# Làm việc chung trên repo

Repo này là bản chung của nhóm. Mới vào thì đọc [docs/cai-dat-chung.md](docs/cai-dat-chung.md) trước. Ai làm phần nào thì sửa trong thư mục của nhóm việc đó, đẩy lên nhánh riêng, rồi mở pull request (PR) để người kia xem trước khi vào `main`.

## Ai giữ thư mục nào

| Thư mục | Người giữ | Nội dung |
|---|---|---|
| `1-cua-hang-tiktok/` | Hữu Đức | Sản phẩm, `sku-map`, bộ test chatbot, câu test NLU |
| `2-kho-don-hang-odoo/` | Hữu Đức (tài liệu Odoo), trưởng nhóm (`workflows/m2-*`) | Cấu hình Odoo, hướng dẫn đóng gói, 4 workflow đơn hàng |
| `3-middleware-ai/`, máy chủ (`docker-compose*.yml`, `init/`, `scripts/`), `docs/` | Trưởng nhóm | Middleware, chatbot, lớp AI, tài liệu kiến trúc |
| `4-noi-dung-do-luong/` | Hữu Đức (`kich-ban/`, kế hoạch), trưởng nhóm (dashboard, Apps Script) | Video, dashboard KPI |
| `contracts/` | Cả hai | Hợp đồng dữ liệu; đổi gì phải báo người kia |
| `bao-cao/` | Mỗi nhóm việc một file, trưởng nhóm ghép | Báo cáo cuối |

File `.github/CODEOWNERS` bắt GitHub tự mời đúng người duyệt khi PR chạm vào thư mục đó.

## Cài một lần

1. Cài [GitHub Desktop](https://desktop.github.com), đăng nhập GitHub.
2. Nhận lời mời vào repo trong email hoặc ở github.com, bấm *Accept*.
3. GitHub Desktop: **File → Clone repository**, chọn repo của nhóm, chọn một thư mục trên máy mình.

## Mỗi lần làm một việc

1. **Lấy bản mới nhất:** chọn nhánh `main`, bấm **Fetch origin** rồi **Pull origin**.
2. **Tạo nhánh mới** theo mã việc trong sheet phân công: **Branch → New branch**, đặt tên như `m1-02-san-pham`, `m2-06-tao-don`, `m4-05-kpi`.
3. **Sửa file** trong thư mục của mình.
4. **Commit:** ghi một câu nói đã làm gì, có mã việc, vd `M2-06: tạo Sales Order từ đơn TikTok`. Mỗi commit một thay đổi nhỏ.
5. **Push origin**, rồi bấm **Create Pull Request**. Điền mẫu có sẵn.
6. Người kia xem; sửa theo góp ý nếu có, rồi bấm **Merge**.
7. Vào sheet phân công, đổi Trạng thái và dán link PR vào cột Ghi chú.

`main` lúc nào cũng phải chạy được, nên không ai đẩy thẳng lên `main`.

## Không bao giờ đưa lên repo

- File `.env`, mật khẩu, API key, mã bí mật (`ODOO_WEBHOOK_SECRET`, `KPI_SECRET`, token TikTok...). Gửi riêng qua tin nhắn.
- Thư mục `backups/`: có dữ liệu khách và token.
- Mô hình đã train (`3-middleware-ai/nlu/outputs/`, `3-middleware-ai/upsell/outputs/`): nặng cỡ GB, để Drive.
- Ảnh, video gốc: để Drive chung, trong repo chỉ dán link.

Lỡ đẩy khóa lên thì báo trưởng nhóm ngay để đổi khóa. Xóa commit không đủ, vì khóa đã lộ.

## Workflow n8n (trưởng nhóm)

1. Sửa workflow trong n8n, xong thì **… → Download**.
2. Giữ nguyên dòng `"id"` (Router gọi workflow theo id). Đặt tên file dạng `m2-tao-don.json`, chép đè vào thư mục `workflows/` của nhóm việc tương ứng.
3. Commit, push. Trên máy chủ: `git pull` rồi `bash scripts/import-n8n.sh`, nạp xong chạy `bash scripts/dien-tap.sh` để chắc không hỏng gì.

## Hợp đồng dữ liệu

Mọi dữ liệu đi qua lại giữa các nhóm việc (đơn hàng, sản phẩm, vận chuyển, tồn kho) có mẫu trong `contracts/`. Muốn đổi tên cột, dạng JSON hay quy tắc SKU thì sửa file trong `contracts/` trước và báo người kia, rồi mới sửa code.

## Gặp xung đột (conflict)

GitHub Desktop báo *conflict* khi hai người sửa cùng chỗ. Đừng tự xóa phần của người kia; nhắn nhau để cùng sửa.
