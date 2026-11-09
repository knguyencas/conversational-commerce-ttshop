# Làm việc chung trên repo

Repo này là bản chung của cả nhóm. Mới vào thì đọc [huong-dan/00-cai-dat-chung.md](huong-dan/00-cai-dat-chung.md) trước. Ai làm phần nào thì sửa trong thư mục của phần đó, đẩy lên nhánh riêng, rồi mở pull request (PR) để người giữ thư mục duyệt trước khi vào `main`.

## Ai giữ thư mục nào

| Thư mục | Người giữ | Nội dung |
|---|---|---|
| `cua-hang/` | M1 | Sản phẩm, `sku-map`, bộ test chatbot, câu test NLU, ghi chép đơn tay |
| `odoo/`, `n8n/workflows/m2-*`, `contracts/odoo/` | M2 | Cấu hình Odoo, 4 workflow đơn hàng, JSON thật của Odoo |
| `noi-dung/`, `n8n/workflows/m4-*` | M4 | Kịch bản video, Apps Script KPI, kết quả A/B, GMV Max, dashboard |
| Hạ tầng (`docker-compose*.yml`, `init/`, `scripts/`), `n8n/workflows/m3-*`, `nlu/`, `upsell/`, `danh-gia/`, `docs/` | M3 | Middleware, chatbot, lớp AI, tài liệu kiến trúc |
| `contracts/` | M3 cùng bên liên quan | Hợp đồng dữ liệu; đổi gì phải báo cả nhóm |
| `bao-cao/` | Mỗi người một file, M3 ghép | Báo cáo cuối |

File `.github/CODEOWNERS` bắt GitHub tự mời đúng người duyệt khi PR chạm vào thư mục đó.

## Cài một lần

1. Cài [GitHub Desktop](https://desktop.github.com), đăng nhập GitHub.
2. Nhận lời mời vào repo trong email hoặc ở github.com, bấm *Accept*.
3. GitHub Desktop: **File → Clone repository**, chọn repo của nhóm, chọn một thư mục trên máy mình.

## Mỗi lần làm một việc

1. **Lấy bản mới nhất:** chọn nhánh `main`, bấm **Fetch origin** rồi **Pull origin**.
2. **Tạo nhánh mới** theo mã việc trong sheet phân công: **Branch → New branch**, đặt tên như `m2-06-tao-don`, `m1-02-san-pham`, `m4-05-kpi`.
3. **Sửa file** trong thư mục của mình.
4. **Commit:** ghi một câu nói đã làm gì, có mã việc, vd `M2-06: tạo Sales Order từ đơn TikTok`. Mỗi commit một thay đổi nhỏ.
5. **Push origin**, rồi bấm **Create Pull Request**. Điền mẫu có sẵn.
6. Người giữ thư mục duyệt; sửa theo góp ý nếu có, rồi bấm **Merge** khi được duyệt.
7. Vào sheet phân công, đổi Trạng thái và dán link PR vào cột Ghi chú.

`main` lúc nào cũng phải chạy được, nên không ai đẩy thẳng lên `main`.

## Không bao giờ đưa lên repo

- File `.env`, mật khẩu, API key, mã bí mật (`ODOO_WEBHOOK_SECRET`, `KPI_SECRET`, token TikTok...). Gửi riêng qua tin nhắn.
- Thư mục `backups/`: có dữ liệu khách và token.
- Mô hình đã train (`nlu/outputs/`, `upsell/outputs/`): nặng cỡ GB, để Drive.
- Ảnh, video gốc: để Drive chung, trong repo chỉ dán link.

Lỡ đẩy khóa lên thì báo M3 ngay để đổi khóa. Xóa commit không đủ, vì khóa đã lộ.

## Workflow n8n

n8n chạy trên máy M3 và bản miễn phí không chia sẻ workflow giữa các tài khoản. Cách đưa workflow của mình vào repo:

1. Trong n8n: mở workflow, **… → Download**.
2. Mở file vừa tải, sửa dòng `"id"` thành id của file giữ chỗ (vd `"m2TaoDon00000001"`). Workflow mới chưa có file giữ chỗ thì hỏi M3 một id.
3. Đặt tên file theo dạng `m2-tao-don.json`, chép đè vào `n8n/workflows/`, mở PR.
4. Sau khi merge, M3 chạy `scripts/import-n8n.sh` trên máy chủ để nạp bản mới.

## Hợp đồng dữ liệu

Mọi dữ liệu đi qua lại giữa các phần (đơn hàng, sản phẩm, vận chuyển, tồn kho) có mẫu trong `contracts/`. Muốn đổi tên cột, tên bảng, dạng JSON hay quy tắc SKU thì mở PR sửa file trong `contracts/` trước, có M3 và người bị ảnh hưởng duyệt, rồi mới sửa code.

## Gặp xung đột (conflict)

GitHub Desktop báo *conflict* khi hai người sửa cùng chỗ. Đừng tự xóa phần của người khác; nhắn người giữ thư mục đó để cùng sửa.
