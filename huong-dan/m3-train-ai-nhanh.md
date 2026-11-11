# Train AI: bản bấm từng nút

Bản ngắn cho M3. Mỗi dòng là một việc. Cần giải thích kỹ hơn thì xem [docs/huong-dan-train-ai.md](../docs/huong-dan-train-ai.md).

## Train những gì

| Mô hình | Để làm gì trong chatbot | Train ở đâu | Mất bao lâu |
|---|---|---|---|
| PhoBERT ý định | Biết khách đang hỏi giá, tư vấn, so sánh, tra đơn, bảo hành, khiếu nại hay khác | Colab, GPU T4 | 15 phút (chung một lần chạy với dòng dưới) |
| PhoBERT thông tin | Bắt tên sản phẩm, hãng, loại, ngân sách, màu, dung lượng, mã đơn trong câu | Colab, GPU T4 | (như trên) |
| Mua kèm | Khách đang mua loại A thì mời loại B nào. Notebook so 4 cách: phổ biến, P(B\|A), Lift/PMI, phân rã ma trận ALS | Colab, CPU | 20–40 phút |

**Không train:** AI viết câu trả lời (dùng Groq hoặc Gemini qua API, miễn phí) và bandit chọn món (tự học khi có khách thật).

**Dữ liệu:** câu train PhoBERT đã có sẵn trong `nlu/data/generated/`. Dữ liệu Amazon cho mô hình mua kèm thì notebook tự tải. Không phải tìm dataset nào khác.

---

## Bước 0. Đưa code lên Drive (một lần)

1. Mở [drive.google.com](https://drive.google.com).
2. Bấm **Mới → Thư mục**, đặt tên `cntttmdt`, bấm **Tạo**.
3. Mở thư mục `cntttmdt` vừa tạo.
4. Bấm **Mới → Tải thư mục lên**, chọn `C:\Users\Nguyen\Folders code\spj\cntttmdt\nlu`. Chờ tải xong.
5. Làm lại bước 4 với thư mục `...\cntttmdt\upsell`.
6. Kiểm tra: trong `cntttmdt` có 2 thư mục `nlu` và `upsell`.

## Bước 1. Train mô hình mua kèm (làm được ngay)

**Đã chạy bản cũ rồi (chỉ có 2 cách gợi ý)?** Tải 2 file `upsell\upsell_lib.py` và `upsell\train_upsell.ipynb` từ máy lên `cntttmdt → upsell` (đè bản cũ), rồi chạy lại từ đầu. Giữ nguyên thư mục `outputs` trên Drive: file đệm `item_category.json` trong đó giúp bỏ qua bước đọc 9 GB, nên lần chạy lại chỉ mất khoảng 10–15 phút.

1. Trên Drive, vào `cntttmdt → upsell`, bấm đúp **`train_upsell.ipynb`**.
   - Không mở được: chuột phải → **Mở bằng → Google Colaboratory**. Không có Colaboratory thì chọn **Kết nối thêm ứng dụng**, tìm "Colaboratory", bấm **Cài đặt**.
2. Trên thanh menu Colab: **Thời gian chạy → Chạy tất cả**.
3. Hiện hộp thoại "Cho phép notebook này truy cập vào tệp trên Google Drive?": bấm **Kết nối với Google Drive**, chọn tài khoản, bấm **Tiếp tục** / **Cho phép** đến hết.
4. Để nguyên tab, chờ 20–40 phút. Ô đang chạy có vòng quay bên trái.
5. Bị ngắt kết nối giữa chừng: bấm **Kết nối lại**, rồi **Thời gian chạy → Chạy tất cả** lần nữa. Phần đã đọc được lấy lại từ file đệm, không phải đọc lại từ đầu.
6. Xong khi ô cuối in `Đã lưu: [...]` và hiện bảng luật.
7. Chụp màn hình 2 thứ cho báo cáo: **bảng so sánh 4 cách gợi ý** ở mục 6, và **biểu đồ cột** ngay bên dưới.

**Kết quả** nằm trong Drive `cntttmdt/upsell/outputs/`: `metrics.json`, `so_sanh_mo_hinh.png`, `xac_suat_mua_kem.png`, `upsell_rules.csv`, `upsell_rules.sql`.

## Bước 2. Train PhoBERT

Nên chờ M1 gửi bộ câu test trước (xem bước 2a). Chưa có thì vẫn train được, nhưng điểm chỉ chấm trên câu tự sinh nên chưa đưa vào báo cáo được.

**Train lại sau khi dữ liệu được sửa (11/11):** trên Drive, vào `cntttmdt → nlu → data`, xóa thư mục `generated`, rồi tải thư mục `nlu\data\generated` từ máy lên lại. Tải luôn `nlu\templates_vi.py` và `nlu\gen_data.py` lên `cntttmdt → nlu` (đè bản cũ). Sau đó làm 2b. Trước khi chạy, đổi tên thư mục `nlu/outputs` cũ trên Drive thành `outputs-lan-1` để giữ kết quả lần 1 cho báo cáo so sánh.

**2a. Thêm bộ câu test của M1 (khi có)**
1. Mở Google Sheet câu test của M1: **Tệp → Tải xuống → Giá trị được phân tách bằng dấu phẩy (.csv)**. Đổi tên file thành `test.csv`, để vào thư mục repo.
2. Mở Git Bash ở thư mục repo, chạy:

   ```bash
   python nlu/import_annotated.py test.csv nlu/data/test/test.jsonl --source test
   ```

3. Script báo dòng nào sai thì nhờ M1 sửa trong Sheet, tải lại, chạy lại.
4. Trên Drive, vào `cntttmdt → nlu → data`, tải thư mục `test` lên (đè bản cũ nếu hỏi).

**2b. Chạy notebook**
1. Trên Drive, vào `cntttmdt → nlu`, bấm đúp **`train_nlu.ipynb`**.
2. **Thời gian chạy → Thay đổi loại thời gian chạy** → chọn **T4 GPU** → **Lưu**.
3. **Thời gian chạy → Chạy tất cả**, cho phép truy cập Drive như bước 1.
4. Nhìn ô thứ hai: phải in `thiết bị: cuda Tesla T4`. Nếu in `cpu`: dừng lại (**Thời gian chạy → Ngắt thực thi**), làm lại bước 2.
   - Colab báo hết hạn mức GPU: đợi hôm sau, hoặc dùng Kaggle (bản dài, mục A3).
5. Chờ khoảng 15 phút, để nguyên tab.
6. Xong khi gần cuối in `Đã lưu vào ...`, và ô cuối cùng in thử 6 câu mẫu kèm ý định đoán được (vd `hoi_gia 0.98 | sac anker 20w con mau trang ko shop`).
7. Chụp màn hình cho báo cáo: **bảng so sánh baseline với PhoBERT** và **ma trận nhầm lẫn**.

**Kết quả** nằm trong Drive `cntttmdt/nlu/outputs/`: `intent_model/`, `ner_model/`, `so_sanh.csv`, `ma_tran_nham_lan_test.png`, `loi_y_dinh.csv`, `loi_thuc_the.csv`, `metrics.json`.

## Bước 3. Đưa mô hình vào hệ thống (trên máy trưởng nhóm)

Bật Docker Desktop trước.

**Mua kèm**
1. Trên Drive, chuột phải `upsell_rules.sql` → **Tải xuống**. Chép vào `cntttmdt\upsell\outputs\` (chưa có thư mục `outputs` thì tạo).
2. Mở Git Bash ở thư mục repo, chạy:

   ```bash
   docker compose exec -T db psql -U odoo -d middleware < upsell/outputs/upsell_rules.sql
   ```

3. Thấy `COMMIT` ở dòng cuối là xong. Chatbot dùng luật mới ngay ở tin nhắn tiếp theo.

**PhoBERT**
1. Trên Drive, chuột phải thư mục `nlu/outputs` → **Tải xuống** (Drive nén thành file zip).
2. Giải nén, chép `intent_model`, `ner_model`, `metrics.json` vào `cntttmdt\nlu\outputs\`.
3. Mở file `.env` trong thư mục repo, sửa 2 dòng rồi lưu:

   ```
   COMPOSE_PROFILES=nlu
   NLU_URL=http://nlu:8000
   ```

4. Chạy (lần đầu mất vài phút để dựng service):

   ```bash
   docker compose up -d
   ```

5. Chờ 1 phút rồi kiểm tra; thấy `"status": "ok"` là xong:

   ```bash
   curl http://127.0.0.1:8000/health
   ```

**Kiểm tra cả hệ thống**

```bash
bash scripts/dien-tap.sh
```

Phải ra 13/13 bước `[ĐẠT]`.

## Bước 4. Chấm chatbot (khi M1 có bộ 100 câu)

Làm theo mục D của [bản dài](../docs/huong-dan-train-ai.md). Mục tiêu: từ 90/100 câu đúng và 0 câu sai giá.

## Đưa gì vào báo cáo

| Mô hình | Số liệu | Hình |
|---|---|---|
| PhoBERT | `so_sanh.csv`: accuracy, macro-F1 ý định, F1 thông tin, so với baseline (lấy số trên tập **test**) | `ma_tran_nham_lan_test.png`, 5–10 câu sai tiêu biểu |
| Mua kèm | `metrics.json`: Hit@3, Recall@5 của 4 cách gợi ý | `so_sanh_mo_hinh.png`, `xac_suat_mua_kem.png` |
| Chatbot | Bảng điểm các lần chấm | — |
