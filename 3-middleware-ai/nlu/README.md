# NLU: mô hình hiểu tin nhắn tiếng Việt (nhóm tự train)

Phần "nhóm tự train" của chatbot. Hai mô hình fine-tune từ **PhoBERT** (`vinai/phobert-base-v2`):

- **Ý định:** tin nhắn thuộc loại nào trong 7 loại (`hoi_gia`, `tu_van`, `so_sanh`, `tra_don`, `bao_hanh`, `khieu_nai`, `khac`).
- **Thông tin (NER):** trích tên sản phẩm, hãng, loại hàng, ngân sách, màu, dung lượng, mã đơn.

Chatbot dùng kết quả này để chọn tool tra Odoo và tham số cho tool. LLM chỉ viết câu trả lời từ dữ liệu tra được.

```
Tin nhắn → [NLU nhóm train] ý định + thông tin → code gọi tool Odoo → LLM viết câu → soát giá → khách
```

## Thư mục

| File | Là gì |
|---|---|
| `HUONG_DAN_GAN_NHAN.md` | Định nghĩa 7 ý định, 7 loại thông tin, cách gán nhãn. **Đọc trước khi viết dữ liệu.** |
| `nlu_lib.py` | Hàm dùng chung: chuẩn hóa, tách từ, nhãn BIO, đọc số tiền, baseline từ điển |
| `templates_vi.py` | Mẫu câu theo ý định, từ viết tắt, tiền tố/hậu tố |
| `data/catalog.csv` | Danh mục sản phẩm **tạm**. Thay bằng sheet sản phẩm của M1 (cùng cột) khi có |
| `gen_data.py` | Sinh dữ liệu train/dev có nhãn từ mẫu câu + catalog |
| `import_annotated.py` | Đổi CSV người gán nhãn (`[chữ](NHÃN)`) sang JSONL |
| `paraphrase_gemini.py` | (Tùy chọn) Nhờ Gemini viết thêm cách nói khác cho dữ liệu train |
| `train_nlu.ipynb` | Notebook train trên **Colab hoặc Kaggle** (GPU miễn phí), so sánh với baseline |
| `service/app.py`, `Dockerfile` | Service FastAPI chạy 2 mô hình cho chatbot (container `nlu` trong docker-compose) |
| `data/generated/` | Dữ liệu sinh ra: `train.jsonl`, `dev.jsonl`, `meta.json` |
| `data/test/` | Tập test do người viết (`*.jsonl`). `mau_dinh_dang.csv` chỉ là ví dụ định dạng |
| `data/human/` | Câu thật đã gán nhãn để thêm vào train (Google Form...) |
| `outputs/` | Kết quả train: mô hình, `metrics.json`, bảng so sánh. Không đưa lên GitHub |

## Quy trình

### 1. Sinh dữ liệu (máy nào cũng chạy được, không cần GPU)

```bash
python 3-middleware-ai/nlu/gen_data.py
```

Mặc định ra 2.100 câu train (300 mỗi ý định) và 560 câu dev. Dev dùng **mẫu câu và sản phẩm không có trong train**, để đo mô hình có hiểu được cách nói và sản phẩm mới hay không.

Khi có sheet sản phẩm thật của M1: xuất CSV với các cột `sku,name,brand,category,price,colors,capacity,aliases` (màu và tên gọi tắt cách nhau bằng `|`), lưu đè `data/catalog.csv`, chạy lại lệnh trên.

Muốn câu đa dạng hơn: thêm mẫu câu vào `templates_vi.py`, hoặc chạy Gemini (cần `GEMINI_API_KEY`):

```bash
python 3-middleware-ai/nlu/paraphrase_gemini.py --per-intent 15 --variants 5
```

### 2. Thu câu thật và làm tập test (việc của M1, M4)

- **Tập test** (~300 câu, người **không** train mô hình viết) → gán nhãn theo `HUONG_DAN_GAN_NHAN.md` trong Google Sheet → xuất CSV → chuyển đổi:

  ```bash
  python 3-middleware-ai/nlu/import_annotated.py test.csv 3-middleware-ai/nlu/data/test/test.jsonl --source test
  ```

- **Câu từ Google Form** (bạn bè trả lời "bạn sẽ nhắn shop thế nào") → gán nhãn → lưu vào `data/human/` để train:

  ```bash
  python 3-middleware-ai/nlu/import_annotated.py form.csv 3-middleware-ai/nlu/data/human/form.jsonl --source form
  ```

Script báo đúng dòng nào sai nhãn hay sai cú pháp.

### 3. Train trên Colab hoặc Kaggle

Hướng dẫn chi tiết nằm ở đầu `train_nlu.ipynb`. Tóm tắt:

- **Colab:** chép thư mục `3-middleware-ai/nlu/` lên Drive vào `MyDrive/cntttmdt/nlu`, mở notebook, chọn GPU T4, *Run all*.
- **Kaggle:** nén `3-middleware-ai/nlu/` thành zip, tạo Dataset, import notebook, *Add Input* dataset đó, bật GPU và Internet, chạy hết.

Mất khoảng 10–15 phút trên GPU T4. Không train trên máy cá nhân vì không có GPU.

### 4. Đọc kết quả

Trong `outputs/`:

| File | Dùng cho |
|---|---|
| `so_sanh.csv`, `metrics.json` | Bảng so sánh Baseline và PhoBERT: accuracy, macro-F1 ý định; precision, recall, F1 thực thể; riêng câu không dấu |
| `ma_tran_nham_lan_*.png` | Hình ma trận nhầm lẫn cho báo cáo |
| `loi_y_dinh.csv`, `loi_thuc_the.csv` | Câu đoán sai, để phân tích lỗi trong báo cáo |
| `intent_model/`, `ner_model/` | Mô hình đã train, dùng cho service FastAPI |

**Số liệu đưa vào báo cáo lấy trên tập test** do người viết. Số trên dev thường cao hơn thực tế, vì dev cũng là câu sinh từ mẫu, và dev còn được dùng để chọn checkpoint tốt nhất.

### 5. Chạy service NLU cho chatbot

Service FastAPI (`service/app.py`, `Dockerfile`) nạp 2 mô hình và trả lời chatbot qua `http://nlu:8000/analyze`.

**Bước 1: tải mô hình từ Drive về máy trưởng nhóm.** Trên Drive mở `cntttmdt/nlu/outputs/`, tải về và đặt sao cho có:

```
3-middleware-ai/nlu/outputs/intent_model/   (config.json, model.safetensors, vocab.txt, bpe.codes, ...)
3-middleware-ai/nlu/outputs/ner_model/
3-middleware-ai/nlu/outputs/metrics.json
```

Drive tải thư mục về dạng zip thì giải nén vào `3-middleware-ai/nlu/outputs/`.

**Bước 2: bật service.** Trong `.env` đặt:

```
COMPOSE_PROFILES=nlu
NLU_URL=http://nlu:8000
```

rồi chạy (lần đầu build image mất vài phút):

```bash
docker compose up -d
```

**Bước 3: kiểm tra.** Khoảng 30–60 giây sau khi chạy:

```bash
curl http://127.0.0.1:8000/health
```

```bash
curl -X POST http://127.0.0.1:8000/analyze -H "Content-Type: application/json" -d "{\"text\": \"sac anker 20w con mau trang ko shop\"}"
```

`/health` trả `"status": "ok"` là xong. Từ lúc này, trong `M3 · Chat thử` dòng cuối mỗi câu trả lời sẽ ghi `(phobert)` thay vì `(quy_tac)`.

**Kết quả `/analyze`:**

```json
{
  "intent": "hoi_gia", "confidence": 0.97,
  "top_intents": [{"intent": "hoi_gia", "score": 0.97}, ...],
  "entities": [{"start": 0, "end": 13, "label": "SAN_PHAM", "text": "sac anker 20w"},
               {"start": 22, "end": 27, "label": "MAU", "text": "trang"}],
  "segmented": "sac anker 20w con mau trang ko shop",
  "latency_ms": 85.3
}
```

**Tài nguyên:** service bị giới hạn 1,5 GB RAM. Mặc định mô hình được lượng tử hóa int8 (`NLU_QUANTIZE=1`), dùng khoảng 0,9 GB (đo thực tế; phần lớn là lớp embedding không nén được). Đặt `NLU_QUANTIZE=0` nếu muốn so độ chính xác và tốc độ trước/sau lượng tử hóa cho báo cáo.

**Khi train lại trên Colab:** tải `outputs/` mới về đè lên, rồi chạy `docker compose restart nlu`.

**Nếu service lỗi hoặc tắt:** chatbot tự quay về quy tắc từ khóa, khách vẫn được trả lời. Nhưng mỗi tin nhắn sẽ phải chờ thêm tới 5 giây (thời gian chatbot đợi NLU). Vì vậy tắt service lâu thì nhớ để trống `NLU_URL` và chạy `docker compose up -d n8n`.

**Độ tự tin thấp:** mô hình trả độ tự tin dưới 0,6 thì chatbot chuyển cho người thay vì đoán. Nếu thấy bot chuyển người quá nhiều, xem `chat_logs` (cột `intent_confidence`) rồi bổ sung dữ liệu train cho các kiểu câu đó.

**Đo tốc độ từ máy Windows:** dùng `127.0.0.1`, đừng dùng `localhost`. Windows thử IPv6 trước nên mỗi lần gọi `localhost` chậm thêm khoảng 2 giây. Chatbot gọi `nlu` trong mạng Docker nên không bị.

## Kiểm tra code

```bash
python 3-middleware-ai/nlu/tests/test_nlu_lib.py
```

Notebook có chế độ chạy thử nhỏ trên CPU (vài chục câu, 2 bước train) để bắt lỗi code trước khi lên Colab:

```bash
cd nlu
NLU_SMOKE=1 NLU_OUT=/tmp/nlu_smoke jupyter nbconvert --to notebook --execute train_nlu.ipynb --output /tmp/nlu_smoke/run.ipynb
```

Cần cài `underthesea seqeval accelerate torch transformers scikit-learn pandas matplotlib` (xem `requirements.txt`).
