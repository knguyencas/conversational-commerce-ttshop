# Nhóm việc 3: Middleware và AI

## Bối cảnh

Đồ án: bán hàng qua chat cho một shop đồ công nghệ trên TikTok Shop. Đây là **phần lõi**: máy chủ chạy Docker (PostgreSQL, Odoo, n8n, ngrok), middleware n8n nối mọi phần với nhau, chatbot AI, và lớp AI nhóm tự train. TikTok và Odoo không nói chuyện trực tiếp; mọi sự kiện đi qua n8n.

## Đồ án cần gì từ nhóm này

1. **Máy chủ chạy ổn** trong suốt thời gian làm và ngày demo.
2. **Middleware**: nhận sự kiện (kiểm chữ ký, chống trùng), rẽ nhánh, gọi TikTok API (ký request, token), đặt vận chuyển, cập nhật trạng thái, xử lý lỗi.
3. **Chatbot**: hiểu tin nhắn, tra dữ liệu, AI viết câu, soát giá bằng code, chuyển người khi cần, mời mua kèm.
4. **API cho giao diện demo** và **chế độ giả lập** (thay TikTok thật).
5. **Lớp AI tự train** có số liệu đánh giá: PhoBERT hiểu ý định (macro-F1 so với baseline), mô hình mua kèm (Hit@3, Recall@5), bandit Thompson sampling, A/B có mời và không mời.
6. **Kết quả chấm chatbot** bằng bộ câu test của nhóm 1.
7. **Số liệu KPI** cho dashboard (nhóm 4).
8. **Tài liệu kiến trúc** cho báo cáo.

## Hiện trạng

| Phần | Trạng thái |
|---|---|
| Máy chủ Docker, sao lưu tự động 24 giờ | Chạy |
| 11 workflow M3 (Router, Chatbot, TikTok API, Token, Đặt vận chuyển, Trạng thái đơn, Gửi tin, Mua kèm, KPI, Xử lý lỗi, Chat thử) | Chạy với TikTok giả |
| Chatbot dùng Groq (`qwen/qwen3.8-27b`, dự phòng `openai/gpt-oss-120b`) | Chạy |
| Chế độ giả lập: form, danh sách đơn, TikTok giả đọc đơn từ database | Chạy |
| API demo cho giao diện (7 API) | Chạy, hợp đồng [contracts/internal/demo_api.md](../../contracts/internal/demo_api.md) |
| Diễn tập trọn luồng `scripts/dien-tap.sh` | 14/14 đạt |
| Dữ liệu sản phẩm của chatbot | Còn là dữ liệu giả có tên hãng; cần thay bằng `san-pham.csv` |
| PhoBERT | Train lần 1 xong (dev: macro-F1 ý định 0,894, F1 thực thể 0,728, đều hơn baseline). Đã sửa dữ liệu (mẫu "loại hàng + hãng", khiếu nại có mã đơn), chờ train lần 2; chưa bật service NLU |
| Mô hình mua kèm | Notebook so 4 cách (phổ biến, P(B\|A), Lift/PMI, ALS), chưa chạy trên Colab |
| Chấm chatbot | Chờ bộ câu test |
| Tailscale | Chưa cài |

## Kết nối với nhóm khác

| Hướng | Thứ gì | Với ai |
|---|---|---|
| Ra | API demo, mã nhóm, link form giả lập | Nhóm 1 (giao diện) |
| Vào | `san-pham.csv`, bộ câu test | Nhóm 1 |
| Ra | Router gọi workflow `m2-*`; bảng `order_status_log` | Nhóm 2 |
| Vào | API key Odoo, workflow `m2-*` đã làm xong | Nhóm 2 |
| Ra | `GET /webhook/kpi-dashboard` (CSV), `GET /webhook/demo/kpi` (JSON) | Nhóm 4 |

## Triển khai phần còn lại

1. **Tailscale**: cài trên máy chủ, *Share* máy cho thành viên, gửi IP để vào Odoo.
2. **Nạp dữ liệu sản phẩm mới vào chatbot**: khi có `cua-hang/san-pham.csv`, sinh lại mảng `PRODUCTS` trong workflow `M3 · Tool sản phẩm (dữ liệu giả)` từ file đó (giữ đúng dạng trong [tool_san_pham.md](../../contracts/internal/tool_san_pham.md): `colors`, `stock`, `compatible`, `aliases`), nạp lại bằng `scripts/import-n8n.sh`. Đồng thời dùng file đó làm `--catalog` khi chấm và khi sinh dữ liệu train NLU.
3. **Mô hình mua kèm**: chạy `upsell/train_upsell.ipynb` trên Google Colab (CPU), nạp `upsell_rules.sql` vào database. Hướng dẫn bấm từng nút: [huong-dan/m3-train-ai-nhanh.md](../../huong-dan/m3-train-ai-nhanh.md); giải thích chi tiết: [docs/huong-dan-train-ai.md](../huong-dan-train-ai.md) mục B.
4. **PhoBERT**: đổi `cua-hang/test-nlu.csv` sang JSONL bằng `nlu/import_annotated.py`, chạy `nlu/train_nlu.ipynb` trên Colab (GPU T4), lấy `so_sanh.csv`; muốn bot dùng mô hình thì bật service NLU (thêm khoảng 0,9 GB RAM trên máy chủ). Hướng dẫn: mục A.
5. **Chấm chatbot**: bật workflow `TEST · Chatbot qua webhook`, chạy `python danh-gia/cham_chatbot.py cua-hang/bo-test-chatbot.csv --catalog cua-hang/san-pham.csv --lan lan-1`, sửa prompt hoặc dữ liệu, chấm lại đến khi từ 90% đúng và không sai giá.
6. **Hỗ trợ ghép**: tạo credential Odoo trong n8n từ API key nhóm 2; nạp workflow `m2-*` khi nhóm 2 xong; sau mỗi lần nạp chạy diễn tập.
7. **Ngày demo**: máy chủ cắm sạc, tắt chế độ ngủ, giả lập bật, chạy diễn tập trước 15 phút.

## Ràng buộc

- Không train trên máy chủ; train trên Colab hoặc Kaggle.
- Không đổi dạng dữ liệu trong `contracts/` khi chưa báo nhóm bị ảnh hưởng.
- `.env` không lên GitHub. Workflow đọc khóa từ biến môi trường hoặc *Credentials*.
- Sau mỗi thay đổi workflow hoặc script: `scripts/dien-tap.sh` phải đạt 14/14.

## Xong khi

- [ ] Giao diện demo gọi được đủ 7 API qua domain ngrok.
- [ ] Chatbot trả lời theo dữ liệu `san-pham.csv`; chấm bộ câu test từ 90% đúng, 0 câu sai giá.
- [ ] Có bảng số: macro-F1 PhoBERT so với baseline; Hit@3, Recall@5 mua kèm so với baseline; A/B.
- [ ] Diễn tập 14/14 sau khi ghép workflow nhóm 2.

## File liên quan

- [docs/van-hanh-may-chu.md](../van-hanh-may-chu.md): sổ tay máy chủ (dựng, chạy, sao lưu, giả lập, diễn tập)
- [docs/kien-truc-middleware.md](../kien-truc-middleware.md): kiến trúc chi tiết cho báo cáo
- [docs/huong-dan-train-ai.md](../huong-dan-train-ai.md): train và chấm mô hình
- [contracts/](../../contracts/README.md): mọi hợp đồng dữ liệu
- `n8n/workflows/m3-*.json`, `n8n/test-workflows/*.json`, `scripts/`, `init/`, `nlu/`, `upsell/`, `danh-gia/`

## Câu giao việc mẫu cho AI

> Tôi giữ phần middleware n8n và lớp AI của đồ án. Đọc file nhóm việc, `docs/van-hanh-may-chu.md` và `contracts/internal/tool_san_pham.md`. Viết script Python đọc `cua-hang/san-pham.csv` và sinh lại mảng `PRODUCTS` trong node Code "Tra dữ liệu giả" của file `n8n/workflows/m3-tool-san-pham-gia.json`, giữ đúng các trường `sku, name, brand, category, price, stock, colors[{color, stock}], warranty_months, specs, compatible, device, aliases`; chia tồn kho theo màu nếu có nhiều màu. Không đổi phần code còn lại của node.
