# Service NLU (FastAPI + 2 mô hình PhoBERT), chạy CPU.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
WORKDIR /app

RUN pip install --index-url https://download.pytorch.org/whl/cpu torch==2.11.0
COPY service/requirements.txt .
RUN pip install -r requirements.txt

RUN python -c "from underthesea import word_tokenize; print(word_tokenize('điện thoại giá bao nhiêu'))"

COPY nlu_lib.py service/app.py ./

ENV HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 MODEL_DIR=/models MALLOC_ARENA_MAX=2
RUN useradd --create-home nlu
USER nlu
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=4).status == 200 else 1)"
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
