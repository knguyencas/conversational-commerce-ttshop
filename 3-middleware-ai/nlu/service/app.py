"""Service NLU: hiểu tin nhắn tiếng Việt bằng 2 mô hình PhoBERT nhóm train trên Colab."""
from __future__ import annotations

import ctypes
import gc
import json
import logging
import os
import threading
import time
from contextlib import asynccontextmanager
from pathlib import Path

import torch
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from transformers import AutoModelForSequenceClassification, AutoModelForTokenClassification, AutoTokenizer

import nlu_lib as L

MODEL_DIR = Path(os.environ.get("MODEL_DIR", "/models"))
QUANTIZE = os.environ.get("QUANTIZE", "1") == "1"
MAX_LEN = int(os.environ.get("MAX_LEN", "96"))
MAX_CHARS = 1000
torch.set_num_threads(int(os.environ.get("TORCH_THREADS", "2")))

log = logging.getLogger("nlu")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

state: dict = {"status": "loading", "detail": None}
models: dict = {}
lock = threading.Lock()


def _release_memory() -> None:
    """Trả bộ nhớ thừa về cho hệ điều hành (Python/glibc mặc định giữ lại)."""
    gc.collect()
    try:
        ctypes.CDLL("libc.so.6").malloc_trim(0)
    except OSError:
        pass


def _load(cls, path):
    """Nạp từng mô hình một rồi lượng tử hóa ngay, để không giữ 2 bản float32 cùng lúc."""
    model = cls.from_pretrained(path).eval()
    if QUANTIZE:
        model = torch.ao.quantization.quantize_dynamic(model, {torch.nn.Linear}, dtype=torch.qint8)
    _release_memory()
    return model


def load_models() -> None:
    intent_dir, ner_dir = MODEL_DIR / "intent_model", MODEL_DIR / "ner_model"
    missing = [str(p) for p in (intent_dir, ner_dir) if not (p / "config.json").exists()]
    if missing:
        state.update(status="no_model",
                     detail=f"Chưa có mô hình: {', '.join(missing)}. Tải intent_model/ và ner_model/ "
                            "từ Drive (3-middleware-ai/nlu/outputs) về thư mục 3-middleware-ai/nlu/outputs trên máy.")
        log.warning(state["detail"])
        return
    try:
        t0 = time.time()
        tokenizer = AutoTokenizer.from_pretrained(intent_dir)
        intent = _load(AutoModelForSequenceClassification, intent_dir)
        ner = _load(AutoModelForTokenClassification, ner_dir)
        models.update(
            tokenizer=tokenizer, intent=intent, ner=ner,
            id2intent={int(k): v for k, v in intent.config.id2label.items()},
            id2label={int(k): v for k, v in ner.config.id2label.items()},
            label2id=dict(ner.config.label2id),
        )
        info = {}
        metrics_path = MODEL_DIR / "metrics.json"
        if metrics_path.exists():
            m = json.loads(metrics_path.read_text(encoding="utf-8"))
            info = {"trained_at": m.get("time"), "base_model": m.get("model"), "smoke": m.get("smoke"),
                    "results": m.get("results")}
        models["info"] = info
        analyze("xin chào shop")
        state.update(status="ok", detail=None, load_seconds=round(time.time() - t0, 1),
                     intents=list(models["id2intent"].values()), quantized=QUANTIZE)
        log.info("Đã nạp mô hình trong %.1fs (int8=%s)", time.time() - t0, QUANTIZE)
    except Exception as e:
        state.update(status="error", detail=f"Lỗi nạp mô hình: {e}")
        log.exception("Lỗi nạp mô hình")


def analyze(text: str) -> dict:
    t0 = time.perf_counter()
    text = L.normalize(text)[:MAX_CHARS]
    tok, mi, mn = models["tokenizer"], models["intent"], models["ner"]
    words = L.segment(text)
    tokens = [w[0] for w in words]
    spans = [(w[1], w[2]) for w in words]

    with lock, torch.inference_mode():
        enc = tok(" ".join(tokens), truncation=True, max_length=MAX_LEN, return_tensors="pt")
        probs = mi(**enc).logits.softmax(-1)[0]
        enc_n = L.encode_ner_example(tok, tokens, None, models["label2id"], MAX_LEN)
        ids = torch.tensor([enc_n["input_ids"]])
        best = mn(input_ids=ids, attention_mask=torch.ones_like(ids)).logits[0].argmax(-1).tolist()

    top = torch.topk(probs, k=min(3, probs.numel()))
    labels = ["O"] * len(tokens)
    for pos, wi in enumerate(enc_n["word_index"]):
        if wi >= 0:
            labels[wi] = models["id2label"][best[pos]]
    entities = L.bio_to_entities(text, spans, labels)
    for e in entities:
        if e["label"] == "NGAN_SACH":
            e["value"] = L.parse_money(e["text"])
    return {
        "intent": models["id2intent"][int(top.indices[0])],
        "confidence": round(float(top.values[0]), 4),
        "top_intents": [{"intent": models["id2intent"][int(i)], "score": round(float(v), 4)}
                        for v, i in zip(top.values, top.indices)],
        "entities": entities,
        "segmented": " ".join(tokens),
        "latency_ms": round((time.perf_counter() - t0) * 1000, 1),
    }


@asynccontextmanager
async def lifespan(_app: FastAPI):
    threading.Thread(target=load_models, daemon=True).start()
    yield


app = FastAPI(title="NLU PhoBERT – chatbot TikTok Shop", lifespan=lifespan)


class AnalyzeIn(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)


@app.get("/health")
def health():
    body = {**state, "model_dir": str(MODEL_DIR), "model_info": models.get("info")}
    return JSONResponse(body, status_code=200 if state["status"] == "ok" else 503)


@app.post("/analyze")
def analyze_endpoint(body: AnalyzeIn):
    if state["status"] != "ok":
        raise HTTPException(status_code=503, detail=state["detail"] or "Mô hình đang nạp")
    return analyze(body.text)
