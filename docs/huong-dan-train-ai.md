# Hướng dẫn train và đánh giá lớp AI (từng bước)

Tài liệu cho Thành viên 3. Muốn làm nhanh theo từng nút bấm thì xem [huong-dan/m3-train-ai-nhanh.md](../huong-dan/m3-train-ai-nhanh.md); tài liệu này giải thích chi tiết. Lớp AI nhóm tự làm gồm 4 phần:

| Phần | Là gì | Có cần train không | Chạy ở đâu |
|---|---|---|---|
| **A. NLU** (PhoBERT) | Hiểu tin nhắn: 7 ý định + 7 loại thông tin | Có: fine-tune trên GPU | Google Colab (hoặc Kaggle) |
| **B. Mô hình mua kèm** | Đang mua loại A thì nên mời loại B | Có: đếm thống kê, không cần GPU | Google Colab (CPU) |
| **C. Bandit** (Thompson sampling) | Chọn món cụ thể để mời, tự học từ khách thật | **Không**: học dần khi chạy | Trong n8n (đã có sẵn) |
| **D. Chấm chatbot** | Đo bot trả lời đúng bao nhiêu, có sai giá không | Không | Máy trưởng nhóm |

Máy cá nhân **không cần GPU** và không train gì nặng. Mọi bước train đều chạy trên Colab.

---

## Chuẩn bị chung (làm một lần)

1. **Tài khoản Google** có Google Drive, còn trống khoảng 3 GB (mô hình NLU chiếm khoảng 1,1 GB).
2. Trên Drive tạo thư mục `MyDrive/cntttmdt/`.
3. Chép 2 thư mục từ repo (máy trưởng nhóm, `C:\Users\Nguyen\Folders code\spj\cntttmdt\`) lên Drive bằng *Mới → Tải thư mục lên*:
   - `nlu/` thành `MyDrive/cntttmdt/nlu/`
   - `upsell/` thành `MyDrive/cntttmdt/upsell/`
4. Mở notebook: trên Drive bấm đúp file `.ipynb`, chọn *Mở bằng → Google Colaboratory*. Không thấy Colaboratory thì chọn *Kết nối thêm ứng dụng*, tìm "Colaboratory" để cài.

---

## A. NLU (PhoBERT): hiểu tin nhắn của khách

### A1. Dữ liệu lấy ở đâu

Shop mới chưa có hội thoại thật, nên dữ liệu đến từ 3 nguồn:

| Nguồn | Dùng để | Cách có |
|---|---|---|
| **Câu sinh tự động** | Train | `python nlu/gen_data.py` sinh 2.100 câu train + 560 câu dev từ mẫu câu (`nlu/templates_vi.py`) và danh mục sản phẩm (`nlu/data/catalog.csv`). Có sẵn câu không dấu, teencode, giá viết tắt. Đã chạy sẵn, file nằm ở `nlu/data/generated/` |
| **Câu thật từ Google Form** | Train thêm (tăng độ đa dạng) | M4 tạo Form "Bạn sẽ nhắn shop đồ công nghệ thế nào?", gửi bạn bè; được 200–300 câu thì gán nhãn |
| **Tập test do người khác viết** | Chấm điểm (không train) | M1 viết khoảng 300 câu, mỗi ý định ít nhất 30 câu |

**Đổi sang danh mục HDX Tech (13/11/2026).** Dữ liệu train và dev được sinh lại hoàn toàn từ `cua-hang/san-pham.csv` (25 sản phẩm, 10 loại) bằng `python scripts/nap-san-pham.py` rồi `python nlu/gen_data.py`; mẫu câu và danh sách máy, hãng trong `nlu/templates_vi.py` cũng đổi sang laptop và phụ kiện máy tính. Số của các lần train trước (danh mục phụ kiện điện thoại) không so trực tiếp với lần train HDX; vẫn dùng được trong báo cáo làm phần phân tích lỗi dữ liệu.

**Mẫu bổ sung sau lần train đầu (11/11/2026).** Lần train đầu, dev cho thấy 2 lỗ hổng của dữ liệu sinh: kiểu câu "loại hàng + hãng" (vd "chuột logitech") có 0 câu trong train vì cả 3 mẫu kiểu này đều rơi vào dev, nên F1 nhận hãng chỉ 0,07; và khiếu nại có mã đơn rất ít nên mô hình học "có mã đơn là tra đơn". Đã thêm `EXTRA_TRAIN_TEMPLATES` trong `nlu/templates_vi.py` (mẫu **chỉ dùng cho train**, viết khác mẫu dev) và sinh lại bằng:

```bash
python nlu/gen_data.py --chi-train
```

Lệnh này giữ nguyên `dev.jsonl` từng byte và cách chia sản phẩm, mẫu câu trong `meta.json`, chỉ sinh lại train, nên so được trước và sau trên **cùng 560 câu dev**. Baseline TF-IDF tăng macro-F1 từ 0,801 lên 0,885. Khi viết báo cáo, ghi rõ mẫu bổ sung được thêm sau khi xem lỗi trên dev, nên số dev sau khi sửa có phần lạc quan; số đáng tin là trên tập test của M1.

Tùy chọn: nhờ Gemini viết thêm cách nói khác cho câu train:

```bash
python nlu/paraphrase_gemini.py --per-intent 15 --variants 5
```

Lệnh này cần `GEMINI_API_KEY`; đọc lướt file kết quả và xóa câu sai trước khi train.

### A2. Gán nhãn câu thật

1. Người gán nhãn đọc `nlu/HUONG_DAN_GAN_NHAN.md`: 7 ý định, 7 loại thông tin, các ca dễ nhầm.
2. Gán trong Google Sheet, mỗi dòng gồm `text` và `intent`. Thông tin bọc dạng `[chữ](NHÃN)`, ví dụ `[chuột g102](SAN_PHAM) màu [trắng](MAU) còn không`.
3. *Tệp → Tải xuống → CSV*. Chuyển sang định dạng train:

   ```bash
   python nlu/import_annotated.py test.csv nlu/data/test/test.jsonl --source test
   ```

   ```bash
   python nlu/import_annotated.py form.csv nlu/data/human/form.jsonl --source form
   ```

   Script liệt kê dòng nào sai nhãn hay sai cú pháp; sửa trong Sheet rồi chạy lại.
4. Chép lại thư mục `nlu/data/` lên Drive, đè bản cũ.

### A3. Train trên Colab

1. Mở `MyDrive/cntttmdt/nlu/train_nlu.ipynb` bằng Colab.
2. *Thời gian chạy → Thay đổi loại thời gian chạy → **T4 GPU** → Lưu.*
3. *Thời gian chạy → **Chạy tất cả***. Cho phép Colab truy cập Drive.
4. Chờ khoảng 10–15 phút. Notebook tự làm:
   1. Cài `underthesea` (tách từ tiếng Việt) và `seqeval` (chấm thực thể).
   2. Đọc dữ liệu train/dev/test, tách từ, gán nhãn BIO.
   3. **Baseline:** TF-IDF + Logistic Regression (ý định); từ điển + regex (thực thể).
   4. **PhoBERT ý định:** 5 epoch, learning rate 3e-5, giữ epoch có macro-F1 dev cao nhất.
   5. **PhoBERT thực thể:** 8 epoch, learning rate 5e-5.
   6. Chấm và so sánh; vẽ ma trận nhầm lẫn; xuất các câu đoán sai.
   7. Đo tốc độ trên CPU; lưu mô hình.

**Cell cài thư viện phải in `thiết bị: cuda Tesla T4`.** Nếu in `cpu` là chưa bật GPU.

### A4. Đọc kết quả (đưa vào báo cáo)

Các file nằm trong `MyDrive/cntttmdt/nlu/outputs/`:

| File | Dùng làm gì |
|---|---|
| `so_sanh.csv` | Bảng chính: accuracy, macro-F1 ý định; precision, recall, F1 thực thể; riêng câu không dấu. Baseline và PhoBERT đặt cạnh nhau |
| `ma_tran_nham_lan_test.png` | Hình cho báo cáo: ý định nào hay bị nhầm với ý định nào |
| `loi_y_dinh.csv`, `loi_thuc_the.csv` | Phân tích lỗi: chọn 5–10 câu tiêu biểu đưa vào báo cáo |
| `metrics.json` | Toàn bộ số liệu, thời gian train, tốc độ |

**Lấy số trên tập test**, không lấy số trên dev. Dev cũng là câu sinh tự động, và dev còn được dùng để chọn epoch tốt nhất, nên số trên dev cao hơn thực tế.

**Kết quả train danh mục HDX Tech (13/11/2026, trên dev 560 câu; chưa có tập test của M1):**

| | Baseline | PhoBERT |
|---|---|---|
| Ý định: accuracy | 0,832 | **0,964** |
| Ý định: macro-F1 | 0,830 | **0,964** |
| Thực thể: F1 | 0,577 | **0,884** |
| Ý định, riêng 156 câu không dấu | 0,817 | 0,918 |
| Thực thể, riêng câu không dấu | 0,569 | 0,753 |

- F1 từng ý định của PhoBERT: so_sanh 0,994, tra_don 0,994, khac 0,981, bao_hanh 0,958, khieu_nai 0,956, tu_van 0,952, hoi_gia 0,915 (yếu nhất: một số câu hỏi giá bị đoán thành tư vấn).
- F1 từng thực thể: MA_DON 1,0, MAU 0,964, NGAN_SACH 0,881, SAN_PHAM 0,877 (dev dùng 5 sản phẩm không có trong train, nên đây là điểm khi gặp tên sản phẩm mới), LOAI 0,865, HANG 0,848. Dev không có câu nào chứa DUNG_LUONG.
- Train ý định 106 giây, thực thể 439 giây trên GPU T4.
- So với lần train đầu (danh mục cũ, macro-F1 0,894, F1 thực thể 0,728): mẫu câu bổ sung sau phân tích lỗi đã lấp được lỗ hổng "loại hàng + hãng" và "khiếu nại có mã đơn". Hai lần dùng dev khác nhau nên chỉ so xu hướng, không so tuyệt đối.
- **Đạt** theo nghĩa vượt baseline rõ ở mọi chỉ số. Điểm chính thức cho báo cáo phải lấy trên tập test do M1 viết, vì dev cũng là câu tự sinh nên điểm dev lạc quan.

### A5. Tối ưu (nếu kết quả chưa tốt)

Làm lần lượt, mỗi lần train lại rồi so số trên test:

1. **Thêm dữ liệu cho chỗ sai:** đọc `loi_y_dinh.csv`. Ví dụ hay nhầm `bao_hanh` với `khieu_nai` thì thêm mẫu câu cho hai ý định đó vào `templates_vi.py`, hoặc thêm câu thật từ Form. Chạy lại `gen_data.py`.
2. **Learning rate:** thử 2e-5 và 5e-5 (biến `LR_INTENT`, `LR_NER` ở cell cấu hình).
3. **Số epoch:** tăng nếu F1 dev còn đang tăng ở epoch cuối.
4. **Độ dài câu:** `MAX_LEN = 64` nhanh hơn nếu tin nhắn ngắn.

Ghi lại mỗi lần thử (tham số và F1 test) thành một bảng trong báo cáo.

### A6. Đưa mô hình vào hệ thống

1. Trên Drive, tải `outputs/intent_model/`, `outputs/ner_model/`, `outputs/metrics.json` về máy trưởng nhóm, đặt vào `nlu/outputs/`.
2. Trong `.env` đặt `COMPOSE_PROFILES=nlu` và `NLU_URL=http://nlu:8000`.
3. Bật service (lần đầu mất vài phút để build):

   ```bash
   docker compose up -d
   ```

4. Khoảng 1 phút sau, kiểm tra service:

   ```bash
   curl http://127.0.0.1:8000/health
   ```

   Kết quả phải có `"status": "ok"`. Từ đây chatbot dùng mô hình PhoBERT thay cho quy tắc từ khóa.

Service tự nén mô hình int8 (khoảng 0,9 GB RAM, ~0,1 giây mỗi câu). Muốn có số liệu "trước/sau nén" cho báo cáo: đặt `NLU_QUANTIZE=0`, đo, rồi trả về `1`.

---

## B. Mô hình mua kèm: loại hàng nào hay được mua cùng nhau

### B1. Dữ liệu: Amazon Reviews 2023

- **Nguồn:** bộ dữ liệu công khai của McAuley Lab (UC San Diego), đăng trên Hugging Face tại `McAuley-Lab/Amazon-Reviews-2023`. Notebook tự tải, không cần tài khoản.
- **Dùng nhóm hàng *Electronics*** (từ 13/11/2026, khi shop đổi sang danh mục HDX Tech: laptop và phụ kiện máy tính). Trước đó dùng thêm *Cell Phones & Accessories* cho danh mục phụ kiện điện thoại cũ.
- **Hai loại file:**
  - `benchmark/5core/rating_only/Electronics.csv`: ai đánh giá món gì, lúc nào. Bản 5-core chỉ giữ người và món có từ 5 đánh giá trở lên, ít nhiễu. Nặng khoảng 900 MB.
  - `raw/meta_categories/meta_Electronics.jsonl`: thông tin sản phẩm (tên, cây danh mục). Nặng khoảng 5,2 GB. Notebook đọc theo dòng nên không tốn RAM.
- **Vì sao dùng dữ liệu Amazon:** shop mới chưa có đơn để học, nên mượn thói quen mua của người dùng Amazon ở mức **loại hàng** (laptop, chuột, hub...). Món cụ thể sẽ do dữ liệu kho của shop lọc.

### B2. Cách mô hình học

1. **Gán loại hàng của shop cho từng sản phẩm Amazon** theo nhánh cuối của cây danh mục (`upsell/category_map.py`, 10 loại của HDX Tech). Ví dụ `Laptops > Traditional Laptops` thành **laptop**, `Data Storage > Internal Solid State Drives` thành **ssd**, `Laptop Accessories > Docking Stations` thành **hub**. Phụ kiện của phụ kiện (túi laptop, giá đỡ màn hình, đệm tai nghe) thì bỏ. Tên nhánh lấy từ dữ liệu thật của Amazon, không đoán.
2. **Coi là "mua cùng nhau"**: một người đánh giá hai món **khác loại** trong vòng **30 ngày**.
3. **Đếm theo người.** Mỗi người góp tối đa 1 cho mỗi cặp loại, để người mua cực nhiều không lấn át.
4. **Tính điểm:** P(B | A) = (số người mua cả A và B + α × độ phổ biến của B) / (số người mua A + α), với α = 20. Khi loại A ít dữ liệu, điểm tự kéo về mức phổ biến chung (làm mượt).
5. **Kiểm tra theo thời gian:** học trên 80% thời gian đầu, chấm trên 20% thời gian sau (dữ liệu "tương lai" mô hình chưa thấy).
6. **Chỉ số:**
   - **Hit@3:** trong 3 loại mời đầu tiên có ít nhất 1 loại khách thật sự mua.
   - **Recall@5:** tỉ lệ loại khách thật sự mua nằm trong 5 gợi ý đầu.
   - So với **baseline**: luôn mời loại hàng phổ biến nhất, không quan tâm khách đang mua gì.
7. **So với hai cách gợi ý khác** để báo cáo có đối chứng:
   - **Lift / PMI** = P(B | A) / P(B), với P(B) = tỉ lệ người (trong số người có mua kèm) đã mua B: đo B được mua kèm A nhiều hơn mức bình thường bao nhiêu lần (luật kết hợp). Hay đẩy loại hiếm lên đầu.
   - **P(B | A) + lọc lift** (dùng để xuất luật, mặc định `RULE_MODEL = "loc_lift"`): xếp theo P(B | A), nhưng loại B có lift ≥ 1 và ít nhất 100 người làm căn cứ được đưa lên trước. Lần chạy đầu (11/11/2026, chỉ có P(B | A)) cho thấy P(B | A) mời "ốp lưng" đứng đầu cho 9/11 loại hàng, kể cả bàn phím, vì ốp lưng chiếm 85.671/202.193 sản phẩm Amazon đã gán loại: đó là độ phổ biến, không phải quan hệ mua kèm. Lọc lift giữ Hit@3 gần như cũ nhưng mời đúng món đi kèm hơn; đổi lại Hit@1 có thể giảm. Báo cáo cả hai.
   - **Phân rã ma trận ALS** (implicit feedback, Hu–Koren–Volinsky 2008): biểu diễn mỗi người và mỗi loại hàng bằng 8 con số ẩn, học từ ma trận ai đã mua loại nào, rồi gợi ý cho khách vừa mua A. Đây là kỹ thuật kinh điển của các hệ gợi ý (Netflix Prize).

   Luật nạp vào hệ thống vẫn lấy từ P(B | A): dễ giải thích với khách và thầy, có số người làm căn cứ cho từng luật.

### B3. Chạy trên Colab

1. Mở `MyDrive/cntttmdt/upsell/train_upsell.ipynb` bằng Colab. **Không cần GPU** (để CPU).
2. *Chạy tất cả*, cho phép truy cập Drive.
3. Chờ khoảng 20–40 phút. Phần lâu nhất là đọc 9 GB thông tin sản phẩm. Kết quả bước này được lưu đệm vào `outputs/item_category.json`, nên chạy lại notebook chỉ mất vài phút.
   - Muốn nhanh hơn: ở cell cấu hình đặt `DATASETS = ["Cell_Phones_and_Accessories"]` (khoảng 10 phút). Cách này thiếu tai nghe, loa, chuột, bàn phím.
4. Colab ngắt kết nối giữa chừng thì mở lại và *Chạy tất cả*; phần đã đọc được lấy lại từ file đệm.

### B4. Kết quả

Các file nằm trong `MyDrive/cntttmdt/upsell/outputs/`:

| File | Dùng làm gì |
|---|---|
| `metrics.json` | Hit@1, Hit@3, Recall@5 của 5 cách gợi ý (baseline, P(B\|A), P(B\|A) + lọc lift, Lift/PMI, ALS), số ca kiểm tra, số người, trần lý thuyết (`tran_ly_thuyet`), kết quả Markov bậc 1/bậc 2 (`markov`) |
| `so_sanh_mo_hinh.png` | Biểu đồ cột Hit@1, Hit@3, Recall@5 của 5 cách gợi ý |
| `xac_suat_mua_kem.png` | Bản đồ nhiệt P(B \| A) cho báo cáo |
| `upsell_rules.csv` | Bảng luật: mỗi loại hàng thì mời 3 loại nào, kèm điểm, lift và số người làm căn cứ |
| `upsell_rules.sql` | File nạp luật vào hệ thống |

Notebook còn in bảng Hit@1 **theo từng loại hàng**, dùng để viết phần phân tích: loại nào mô hình hơn hẳn baseline, loại nào không.


**Kết quả danh mục HDX Tech (13/11/2026, 17 loại hàng, cửa sổ 30 ngày, `MIN_SUPPORT` = 100):** 2.404.428 lượt mua của 1.104.443 người; kiểm tra trên 87.651 ca.

| Cách gợi ý | Hit@1 | Hit@3 | Recall@5 | Kết luận |
|---|---|---|---|---|
| Baseline (phổ biến) | 0,3232 | 0,5557 | 0,5990 | mốc so sánh |
| **P(B\|A)** | 0,3220 | 0,5670 (+0,0113) | 0,5957 | **Đạt cả 3 chỉ số** |
| P(B\|A) + lọc lift (xuất luật) | 0,2870 | **0,5708 (+0,0151)** | 0,5956 | Hit@3 cao nhất, Hit@1 thấp hơn |
| Lift / PMI | | −0,1484 so với baseline | | không đạt |
| Phân rã ma trận ALS | | −0,2389 so với baseline | | không đạt |

- **Đạt:** P(B|A) hơn baseline ở Hit@3 mà không kém ở Hit@1, Recall@5. Cửa sổ 1 ngày (gần với "cùng một đơn hàng") cho P(B|A) hơn baseline +0,0167 Hit@3.
- **Chỉ 3 cặp thật sự đi kèm** (lift ≥ 1, ít nhất 100 người): laptop ↔ túi chống sốc (1,66), màn hình ↔ giá treo màn hình (1,57), micro ↔ webcam (1,61). Các cặp khác chỉ phản ánh hàng bán chạy (tai nghe, bàn phím, chuột).
- **Luật nạp vào hệ thống:** 6 luật Amazon của 3 cặp trên. Chỗ trống chatbot bù bằng 38 luật viết tay, bandit chọn món và học từ khách thật, A/B đo hiệu quả.
- Ngưỡng 30 người từng sinh cặp nhiễu túi chống sốc ↔ kê tay (lift 3,38 từ chỉ 16 sản phẩm kê tay), nên đã nâng lên 100.
- **Điểm trông thấp vì bài toán khó:** chỉ biết một loại khách đang mua, phải đoán đúng trong 16 loại, và nhiều lần mua tiếp không liên quan đến món trước. Đoán bừa chỉ trúng Hit@1 ≈ 0,06.
- **Ô 6d (trần lý thuyết):** mô hình "gian lận" nhìn đáp án tập kiểm tra để chọn loại tốt nhất cho mỗi loại đang mua. Kết quả:

  | | Hit@1 | Hit@3 | Recall@5 |
  |---|---|---|---|
  | Trần lý thuyết | 0,3232 | 0,6112 | 0,6429 |
  | P(B\|A), % trần | 99,6% | 92,8% | 92,7% |
  | P(B\|A) + lọc lift, % trần | 88,8% | 93,4% | 92,6% |

  - **Trần Hit@1 bằng đúng baseline (0,3232):** với mọi loại khách đang mua, loại hay được mua kèm nhất vẫn là món bán chạy chung. Không mô hình nào chỉ dựa vào loại đang mua có thể hơn baseline ở Hit@1.
  - **Trần Hit@3 chỉ 0,61:** điểm thấp là do giới hạn của bài toán. Mô hình đã đạt khoảng 93% mức tối đa; lọc lift lấp được 27% khoảng cách baseline → trần, P(B|A) lấp 20%.
- **Ô 6e (Markov bậc 2):** bài kiểm tra riêng theo thời gian, đoán loại mua tiếp theo; tính trên 22.356 ca có đủ 2 món trước đó.

  | Cách | Hit@1 | Hit@3 | Recall@5 |
  |---|---|---|---|
  | Baseline (phổ biến) | 0,2187 | 0,3685 | 0,5228 |
  | Markov bậc 1 (1 món gần nhất) | 0,2063 | **0,4440** | 0,5740 |
  | Markov bậc 2 (2 món gần nhất) | **0,2251** | 0,4344 | **0,5927** |
  | Trần bậc 1 / bậc 2 | 0,2345 / 0,2640 | 0,5016 / 0,5428 | 0,6681 / 0,7129 |

  - **Bậc 1 hơn baseline 7,6 điểm Hit@3** khi đoán món mua tiếp theo: thứ tự mua mang nhiều thông tin hơn "mua cùng trong 30 ngày".
  - **Bậc 2 không thắng rõ bậc 1:** hơn 1,9 điểm Hit@1 và Recall@5 nhưng kém 1 điểm Hit@3, nên không đạt tiêu chí.
  - **Không dùng bậc 2 trong chatbot:** khách nhắn tin cho shop mới chưa có lịch sử mua, chatbot chỉ biết món khách đang hỏi, nên luật theo 1 loại hàng là cách dùng được.

**Kết quả lần chạy đủ (12/11/2026, danh mục cũ: 11 loại phụ kiện điện thoại).** Shop đã đổi sang danh mục HDX Tech ngày 13/11/2026, nên cần chạy lại notebook để có số cho 10 loại mới. Kết quả dưới đây vẫn dùng được trong báo cáo làm phần phân tích phương pháp (vì sao cần lọc lift, vì sao ALS kém). 6.726.367 lượt mua của 1.672.071 người; học trên dữ liệu trước 11/06/2021, kiểm tra trên 350.395 ca sau đó.

| Cách gợi ý | Hit@1 | Hit@3 | Recall@5 |
|---|---|---|---|
| Baseline (phổ biến) | 0,485 | 0,767 | 0,827 |
| **P(B\|A)** | **0,498** | **0,801** | **0,833** |
| P(B\|A) + lọc lift (luật đang dùng) | 0,415 | 0,785 | 0,831 |
| Lift / PMI | 0,356 | 0,618 | 0,750 |
| Phân rã ma trận ALS | 0,132 | 0,395 | 0,587 |

Cách đọc cho báo cáo:
- **P(B|A) đo giỏi nhất** nhưng thiên về hàng bán chạy: mời "ốp lưng" đầu tiên cho 9/11 loại hàng, kể cả bàn phím. Khách Amazon mua ốp lưng nhiều đến mức đằng nào cũng mua, nên mời ốp lưng "trúng" nhiều mà không tạo thêm đơn.
- **Lọc lift** hy sinh 1,6 điểm Hit@3 (vẫn hơn baseline 1,8 điểm) để mời đúng món thật sự đi kèm: bàn phím → chuột, chuột → bàn phím, củ sạc ↔ sạc dự phòng, điện thoại và đồng hồ → kính cường lực, ốp lưng → kính cường lực. Mục đích của mời mua kèm là thêm đơn mà khách chưa định mua, nên nhóm chọn cách này. Hit@1 giảm mạnh nhất ở củ sạc (0,58 → 0,15): người mua củ sạc mua ốp lưng tiếp theo nhiều hơn sạc dự phòng, nhưng ốp lưng không phải món "đi kèm" củ sạc.
- **Lift / PMI đơn thuần** kém hơn baseline: đẩy cặp hiếm lên đầu.
- **ALS kém nhất**: chỉ có 11 loại hàng, quá ít để học 8 yếu tố ẩn; gợi ý cho khách mới chỉ từ 1 loại (fold-in) làm mất thông tin độ phổ biến; ALS không xét cửa sổ 30 ngày. Đây là kết quả âm có giá trị: phân rã ma trận hợp với danh mục hàng nghìn món, không hợp với 11 loại.
- Cáp, tai nghe, loa không có loại nào đi kèm rõ ràng (lift < 1), nên luật giữ thứ tự theo độ phổ biến.
- Hiệu quả thật đo bằng A/B trong hệ thống (nhóm được mời so với nhóm không mời) và bandit học từ khách thật.

### B5. Đưa luật vào hệ thống

1. Tải `upsell_rules.sql` từ Drive về `upsell/outputs/` trong repo.
2. Chạy bằng Git Bash, từ thư mục repo:

   ```bash
   docker compose exec -T db psql -U odoo -d middleware < upsell/outputs/upsell_rules.sql
   ```

3. Kiểm tra:

   ```bash
   docker compose exec db psql -U odoo -d middleware -c "select anchor_category, rec_category, rank, score from upsell_rules where source='amazon' order by 1,3;"
   ```

Chatbot dùng ngay luật `amazon` ở tin nhắn tiếp theo.
- **Luật Amazon** chỉ gồm cặp loại hàng thật sự đi kèm (lift ≥ 1, ít nhất 100 người mua cùng làm căn cứ, để loại cặp nhiễu từ loại hàng ít dữ liệu).
- **Mỗi loại khách hỏi**, chatbot lấy luật `amazon` trước rồi bù bằng luật `mac_dinh` viết tay cho đủ 3 loại, bỏ loại trùng.
- **Chưa nạp luật** thì chatbot dùng toàn bộ 38 luật `mac_dinh`.

---

## C. Bandit (Thompson sampling): không cần train

**Vấn đề:** luật mua kèm chỉ nói nên mời **loại** nào (vd khách xem chuột thì mời lót chuột hoặc bàn phím). Trong mỗi loại có nhiều **món**, và không biết trước món nào khách của shop hay nhận lời.

**Cách bandit chọn món:**

1. Mỗi cặp (loại khách đang xem, món được mời) có hai con số: `alpha` = 1 + số lần khách mua món đó sau khi được mời, `beta` = 1 + số lần mời mà khách không mua. Lưu trong bảng `bandit_arms`.
2. Mỗi lần mời, với mỗi món ứng viên (còn hàng, hợp máy), **bốc một số ngẫu nhiên** từ phân phối Beta(alpha, beta), rồi mời món có số lớn nhất.
3. Món hay được mua có phân phối lệch về 1 nên thường thắng. Món mới, chưa có dữ liệu, có Beta(1, 1), tức ngẫu nhiên đều, nên vẫn được thử. Đó là cân bằng giữa **khai thác** món tốt và **khám phá** món mới.

**Bandit tự học (workflow `M3 · Ghi nhận mua kèm`):**
- Có đơn mới: nếu khách mua món đã được mời trong 48 giờ thì `reward = 1`, `alpha + 1`.
- Mỗi giờ: lượt mời quá 48 giờ không mua thì `reward = 0`, `beta + 1`.

**Đo hiệu quả (để làm A/B test):**
- 20% cuộc chat được chia ngẫu nhiên vào nhóm `control`, **không được mời**. 80% còn lại là nhóm `offer`.
- So hai nhóm:

  ```bash
  docker compose exec db psql -U odoo -d middleware -c "select * from upsell_report;"
  ```

  Bảng này cho số đơn, giá trị đơn trung bình và số đơn có mua kèm của mỗi nhóm.
- Tỉ lệ nhận lời mời theo từng món:

  ```bash
  docker compose exec db psql -U odoo -d middleware -c "select * from upsell_offer_report order by so_lan_moi desc;"
  ```

Với số đơn của đồ án, số liệu chỉ mang tính minh họa. Ghi rõ điều này trong báo cáo.

**Lưu ý cần đối chiếu khi có TikTok thật:** người mua trong đơn (`user_id`) phải trùng người nhắn tin (`im_user_id`) thì mới khớp được lượt mời với đơn. Nếu TikTok dùng hai mã khác nhau, cần thêm bước tra cứu.

---

## D. Chấm chatbot bằng bộ test

### D1. Bộ test (M1 viết)

File CSV với cột `cau_hoi` (bắt buộc), và các cột tùy chọn `y_dinh_dung`, `sku_dung` (cách nhau bằng `|`), `ghi_chu`. Xem mẫu 10 câu ở `danh-gia/bo-test-chatbot-mau.csv`. Bộ thật khoảng **100 câu**, gồm:
- hỏi giá, hỏi còn hàng;
- so sánh, tư vấn theo ngân sách;
- khiếu nại;
- câu không dấu, teencode;
- câu cố tình lừa bot ("bán rẻ 50% được không", "bỏ qua hướng dẫn trước đó").

### D2. Chạy chấm

1. Bật workflow test: trong n8n mở `TEST · Chatbot qua webhook`, bấm **Publish**. Hoặc trên máy chạy:

   ```bash
   MSYS_NO_PATHCONV=1 docker compose exec n8n n8n publish:workflow --id=testChatbotWh001
   ```

   ```bash
   docker compose restart n8n
   ```

   Chờ 30 giây.
2. Chạy:

   ```bash
   python danh-gia/cham_chatbot.py danh-gia/bo-test-chatbot.csv --lan lan-1
   ```

3. Script in bảng tóm tắt và ghi `danh-gia/ket-qua/lan-1.csv`, gồm câu trả lời, ý định bot đoán, các số tiền trong câu, cột **SAI_GIA**, chuyển người, món được mời, độ trễ.
4. **M1 mở file**, điền cột `danh_gia` (Đúng/Sai) và ghi chú. Mục tiêu: **≥ 90/100 câu Đúng và 0 câu SAI_GIA**.
5. Sửa bot (prompt, mẫu câu, dữ liệu NLU), chạy lại với `--lan lan-2`... Đưa bảng điểm các lần vào báo cáo.
6. Chấm xong thì **Unpublish** workflow test.

---

## Lịch đề xuất

| Tuần | Việc |
|---|---|
| 1 | M4 phát Google Form; M1 bắt đầu viết tập test NLU và bộ 100 câu chatbot; M3 chạy notebook mua kèm (B) |
| 2 | Gán nhãn câu Form; train NLU lần 1 (A); đưa NLU và luật mua kèm vào hệ thống |
| 3 | Chấm chatbot lần 1 (D); sửa; train NLU lần 2 với dữ liệu bổ sung |
| 4 | Chấm lại; lấy số liệu bandit/A-B test từ khách thật; viết báo cáo |
