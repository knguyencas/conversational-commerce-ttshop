# Sổ tay vận hành máy chủ (M3)

Dành cho trưởng nhóm, người giữ máy chủ. Các bạn khác đọc [README](../README.md) và thư mục [huong-dan](../huong-dan/). Repo này dựng toàn bộ phần chạy chung của nhóm trên máy trưởng nhóm: **PostgreSQL, Odoo, n8n và ngrok**, tất cả bằng Docker.

```
TikTok Shop ──webhook──▶ ngrok (domain tĩnh) ──▶ n8n :5678 ──▶ Odoo :8069
                                                   │
Thành viên ──Tailscale──▶ Odoo, n8n                └──▶ PostgreSQL (database middleware)
```

| Thư mục / file | Nội dung |
|---|---|
| `docker-compose.yml` | 5 container `db`, `odoo`, `n8n`, `ngrok`, `backup` (sao lưu tự động), và `nlu` (mô hình PhoBERT, chỉ chạy khi bật `COMPOSE_PROFILES=nlu`) |
| `docker-compose.dien-tap.yml` | Ghi đè khi diễn tập: n8n gọi TikTok giả và Gemini giả thay vì thật |
| `.env.example` | Mẫu file cấu hình; copy thành `.env` rồi điền |
| `init/` | SQL chạy một lần khi tạo database: DB `n8n`, `middleware`, bảng middleware, bảng mua kèm, view KPI |
| `contracts/` | JSON mẫu của TikTok, Odoo và giữa các workflow; xem [contracts/README.md](../contracts/README.md) |
| `n8n/workflows/` | Workflow n8n dạng JSON: 11 workflow M3 và 5 workflow giữ chỗ của M2 |
| `nlu/` | Mô hình hiểu tin nhắn nhóm tự train (PhoBERT): sinh dữ liệu, gán nhãn, notebook Colab/Kaggle; xem [nlu/README.md](../nlu/README.md) |
| `upsell/` | Mô hình mua kèm học từ Amazon Reviews 2023 (notebook Colab); xem [upsell/README.md](../upsell/README.md) |
| `danh-gia/` | Script chấm chatbot bằng bộ câu test của M1 (`cham_chatbot.py`) |
| `docs/` | [Kiến trúc middleware chi tiết](kien-truc-middleware.md), [hướng dẫn train AI từng bước](huong-dan-train-ai.md), [tài khoản n8n cho nhóm](huong-dan-tai-khoan-n8n.md), [KPI cho dashboard của M4](huong-dan-kpi-dashboard.md) |
| `scripts/import-n8n.sh` | Nạp credential Postgres và các workflow vào n8n, publish, khởi động lại n8n |
| `scripts/send-test-webhook.sh` | Gửi webhook mẫu có chữ ký vào n8n để test Router |
| `scripts/dien-tap.sh` | Diễn tập cả luồng bằng TikTok giả (chat, đơn, đóng gói, giao, báo khách), tự dọn dữ liệu thử |
| `scripts/backup.sh`, `scripts/restore.sh` | Sao lưu ngay (database + workflow JSON); khôi phục một database |
| `scripts/fix-docker-desktop.ps1` | Sửa lỗi Docker Desktop sập khi khởi động trên máy trưởng nhóm |
| `backups/` | Bản sao lưu database và workflow (không đưa lên GitHub) |
| `cua-hang/` | **M1**: sản phẩm, `sku-map`, bộ test chatbot, câu test NLU |
| `odoo/` | **M2**: cấu hình Odoo, hướng dẫn đóng gói, kết quả test |
| `noi-dung/` | **M4**: kịch bản video, Apps Script KPI, A/B, GMV Max, dashboard |
| `bao-cao/` | Báo cáo cuối, mỗi người một file |

**Làm việc nhóm:** ai giữ thư mục nào, cách tạo nhánh, mở pull request và đưa workflow n8n vào repo xem [CONTRIBUTING.md](../CONTRIBUTING.md). Bảng phân công: [docs/phan-cong-nhom.xlsx](phan-cong-nhom.xlsx) (bản đang dùng nằm trên Google Sheet).

## Phần dành cho trưởng nhóm: dựng lần đầu

### 1. Chuẩn bị (một lần)

- **Docker Desktop** cho Windows (dùng WSL 2). Trong Settings bật *Start Docker Desktop when you sign in*.
- **ngrok**: đăng ký tại ngrok.com, lấy *Authtoken* và nhận một **domain tĩnh miễn phí** (mục *Domains*).
- **Tailscale**: cài trên máy này, đăng nhập.
- **Git Bash** (đi kèm Git for Windows) để chạy lệnh và script bên dưới.

### 2. Tạo file `.env`

```bash
cp .env.example .env
```

Mở `.env` và điền:

- `PG_PASSWORD`: mật khẩu bất kỳ, đủ dài.
- `N8N_ENCRYPTION_KEY`: tạo bằng lệnh `openssl rand -hex 32`. **Đặt một lần rồi giữ nguyên**: nếu đổi khóa, mọi Credentials đã lưu trong n8n sẽ không đọc được nữa.
- `NGROK_AUTHTOKEN`, `NGROK_DOMAIN`: domain không có `https://`.
- `TIKTOK_APP_KEY`, `TIKTOK_APP_SECRET`: tạm đặt giá trị bất kỳ cho tới khi có app.

Không đặt `PG_USER=postgres` vì Odoo sẽ từ chối chạy.

### 3. Chạy

```bash
docker compose up -d
```

```bash
docker compose ps
```

Cả 4 container phải ở trạng thái `running` (hoặc `healthy`). Lần đầu tải image mất vài phút.

Chưa có tài khoản ngrok thì chạy 3 container còn lại; Router vẫn test được trên máy:

```bash
docker compose up -d db odoo n8n
```

Sau đó nạp workflow (chỉ chạy lần đầu, xem mục *Workflow n8n*):

```bash
scripts/import-n8n.sh
```

Kiểm tra n8n đã ra được internet qua ngrok (thay bằng domain của bạn):

```bash
curl https://ten-gi-do.ngrok-free.app/healthz
```

Kết quả đúng là `{"status":"ok"}`.

### 4. Thiết lập Odoo

1. Mở `http://localhost:8069`.
2. Ở màn hình *Create Database*: đặt **Master Password** (lưu vào chỗ an toàn, cần khi sao lưu hoặc xóa DB), tên database `cntttmdt`, ngôn ngữ Tiếng Việt, quốc gia Việt Nam, **không** tick *Demo data*.
3. Từ đây Thành viên 2 tiếp quản: cài Sales, Inventory, tạo user tích hợp và API key.

### 5. Thiết lập n8n

1. Mở `http://localhost:5678`, tạo tài khoản owner (trưởng nhóm), đặt mật khẩu mạnh.
2. *Settings → Users → Invite*: mời Thành viên 2 và 4. Chưa cài email nên n8n hiện link mời; copy link gửi cho từng người. Nếu link bắt đầu bằng `localhost` hoặc domain ngrok, đổi phần đầu thành `http://100.x.x.x:5678` (IP Tailscale của máy này, xem mục 6). Bản miễn phí **không chia sẻ được workflow và credential** giữa các tài khoản; cách làm việc chung xem [docs/huong-dan-tai-khoan-n8n.md](huong-dan-tai-khoan-n8n.md).
3. Credentials dùng chung:
   - **Postgres · middleware**: đã được `scripts/import-n8n.sh` tạo sẵn (Host `db`, Database `middleware`).
   - **Odoo**: URL `http://odoo:8069`, database `cntttmdt`, user tích hợp và API key do Thành viên 2 tạo.
   - **AI viết câu**: không cần credential trong n8n; key nằm trong `.env` (xem mục Chatbot).
4. Quy ước tên workflow: `M2 · Tạo đơn`, `M3 · Router`...

### 6. Mời cả nhóm vào qua Tailscale

1. Trong trang quản trị Tailscale, mời 3 thành viên vào tailnet (hoặc *Share* máy này cho từng người).
2. Xem IP Tailscale của máy này (dạng `100.x.x.x`), gửi cho cả nhóm:
   - Odoo: `http://100.x.x.x:8069`
   - n8n: `http://100.x.x.x:5678`

### 7. Giữ máy luôn bật

Chạy trong PowerShell để máy không ngủ khi cắm sạc:

```powershell
powercfg /change standby-timeout-ac 0
```

Container có `restart: unless-stopped`, nên tự bật lại khi Docker Desktop khởi động. Docker Desktop chỉ chạy sau khi đăng nhập Windows, vì vậy sau khi máy khởi động lại phải đăng nhập Windows thì hệ thống mới chạy lại.

**Trên máy hiện tại (Windows Insider build 26220), Docker Desktop hay sập khi khởi động**, báo `remove ...dockerInference` hoặc `remove ...engine.sock: The file cannot be accessed by the system`. Khi gặp lỗi này, chạy:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\fix-docker-desktop.ps1
```

Sau mỗi lần khởi động lại máy, kiểm tra `docker compose ps` trước khi báo cả nhóm vào làm.

## Địa chỉ cần khai trong TikTok Partner Center

Khi tạo app (sau khi shop được duyệt):

| Mục | Giá trị |
|---|---|
| Redirect URL | `https://<NGROK_DOMAIN>/webhook/tiktok-oauth` |
| Webhook URL | `https://<NGROK_DOMAIN>/webhook/tiktok-events` |

### Kết nối shop với hệ thống (sau khi tạo app)

1. Điền `TIKTOK_APP_KEY`, `TIKTOK_APP_SECRET` của app thật vào `.env`. `TIKTOK_OAUTH_STATE` đã có sẵn một mã ngẫu nhiên. Chạy `docker compose up -d n8n`.
2. Trong Partner Center, lấy **link ủy quyền** của app. Thêm `&state=<giá trị TIKTOK_OAUTH_STATE>` vào cuối link rồi gửi cho chủ shop (M1).
3. M1 đăng nhập tài khoản shop, bấm link, đồng ý cấp quyền. TikTok chuyển về `/webhook/tiktok-oauth` và trang hiện **"Đã kết nối shop với hệ thống"**.
4. Kiểm tra token đã được lưu:

```bash
docker compose exec db psql -U odoo -d middleware -c "select shop_id, shop_name, access_token_expires_at from tokens;"
```

Từ đây `M3 · Token` tự làm mới token mỗi ngày. Nếu shop hủy ủy quyền hoặc làm mới thất bại, lỗi được ghi vào `failed_jobs`; khi đó M1 bấm lại link ở bước 3.

**Đối chiếu chữ ký với TikTok thật** (làm ngay khi có app): sau bước 3, gọi `/authorization/202309/shops` qua `M3 · TikTok API` với `shop: false`. Nếu TikTok báo sai chữ ký, sửa hàm `tiktokSign` (có trong `M3 · TikTok API` và `M3 · Token`). Cách ký đang dùng ghi ở `contracts/internal/tiktok_api.md`.

**Test bằng TikTok giả:**

1. Import và publish `TEST · TikTok giả` và `TEST · Gọi TikTok API`.
2. Trong `.env` đặt cả `TIKTOK_API_BASE` và `TIKTOK_AUTH_BASE` thành `http://localhost:5678/webhook/tiktok-mock`, rồi chạy `docker compose up -d n8n`.
3. Mở `http://127.0.0.1:5678/webhook/tiktok-oauth?code=abc&state=<TIKTOK_OAUTH_STATE>`, sau đó gọi API qua `POST /webhook/tiktok-api-test`.
4. Xong thì trả `.env` về như cũ và unpublish hai workflow test.

Gói ngrok miễn phí hiện một trang cảnh báo khi mở bằng trình duyệt. Khi Thành viên 1 bấm link ủy quyền sẽ gặp trang này một lần, chỉ cần bấm *Visit Site*. Webhook từ máy chủ TikTok không bị ảnh hưởng.

Xem từng request TikTok gửi vào: `http://localhost:4040`. Trang này hữu ích để lấy payload thật thay cho file mẫu trong `contracts/`.

## Workflow n8n

| Workflow | Người làm | Trạng thái |
|---|---|---|
| `M3 · Router` | M3 | Chạy được: kiểm chữ ký, trả 200, bỏ bản trùng, rẽ nhánh |
| `M3 · Xử lý lỗi` | M3 | Chạy được: ghi `failed_jobs`; node báo nhóm chat đang tắt |
| `M3 · Chatbot` | M3 | Chạy được với **dữ liệu giả**: hiểu tin nhắn, chọn tool, mời mua kèm (bandit), Gemini viết câu, soát giá, gửi lên TikTok, ghi `chat_logs`. Gửi thật cần Customer Service API |
| `M3 · Ghi nhận mua kèm` | M3 | Chạy được: đơn mới có món đã mời thì thưởng bandit; quá 48 giờ không mua thì phạt; thống kê nhóm offer/control |
| `M3 · Tool sản phẩm (dữ liệu giả)` | M3 | Dữ liệu giả cho chatbot. Bản đọc Odoo thật là `M2 · Tra sản phẩm Odoo` (**M2** làm theo `contracts/internal/tool_san_pham.md`) |
| `M3 · Chat thử` | M3 | Khung chat để thử bot trong n8n |
| `M2 · Tạo đơn`, `M2 · Hủy đơn` | M2 | Giữ chỗ: nhận được dữ liệu từ Router, chưa xử lý |
| `M2 · Đồng bộ tồn kho` | M2 | Giữ chỗ: có sẵn trigger lịch 15 phút (đang tắt) và trigger cho workflow khác gọi; hợp đồng `contracts/internal/ton_kho.md` |
| `M3 · KPI cho dashboard` | M3 | Chạy được: `GET /webhook/kpi-dashboard?bang=…` trả CSV từ các view `kpi_*`, cần header `x-kpi-key`; xem `docs/huong-dan-kpi-dashboard.md` |
| `M3 · TikTok API` | M3 | Chạy được (test bằng TikTok giả): ký request, gắn token và `shop_cipher`. Mọi lệnh gọi TikTok đi qua đây; hợp đồng ở `contracts/internal/tiktok_api.md` |
| `M3 · Token` | M3 | Chạy được (test bằng TikTok giả): ủy quyền lần đầu, làm mới mỗi ngày 3:00, xử lý shop hủy ủy quyền |
| `M3 · Đặt vận chuyển` | M3 | Chạy được (test bằng TikTok giả): Odoo báo phiếu xuất kho Done → Ship Package → phiếu gửi hàng + mã vận đơn → `order_status_log` |
| `M3 · Trạng thái đơn` | M3 | Chạy được (test bằng TikTok giả): ghi trạng thái giao hàng, nhắn mã vận đơn cho khách, báo nhóm khi hàng hoàn |
| `M3 · Gửi tin TikTok` | M3 | Gửi tin cho khách qua Customer Service API (chờ TikTok cấp quyền) |
| `M2 · Cập nhật Odoo (vận chuyển)` | M2 | Giữ chỗ: ghi mã vận đơn và trạng thái vào Odoo; hợp đồng `contracts/internal/van_chuyen.md` |
| `TEST · …` (4 workflow) | M3 | Chỉ để test (`n8n/test-workflows/`), **không publish** khi không test |

Router rẽ sự kiện như sau. Sự kiện khác chỉ được ghi vào `processed_events`, không gọi đi đâu.

| Sự kiện TikTok | Điều kiện | Workflow được gọi |
|---|---|---|
| `NEW_MESSAGE` | người gửi là `BUYER` | M3 · Chatbot |
| `ORDER_STATUS_CHANGE` | `AWAITING_SHIPMENT` | M2 · Tạo đơn |
| `ORDER_STATUS_CHANGE` | `AWAITING_COLLECTION`, `IN_TRANSIT`, `DELIVERED`, `COMPLETED` | M3 · Trạng thái đơn |
| `CANCELLATION_STATUS_CHANGE` | | M2 · Hủy đơn |
| `PACKAGE_UPDATE` | | M3 · Trạng thái đơn |
| *(Odoo, không qua Router)* phiếu xuất kho Done | `POST /webhook/odoo-picking-done?secret=…` | M3 · Đặt vận chuyển |
| `UPCOMING_AUTHORIZATION_EXPIRATION`, `SELLER_DEAUTHORIZATION` | | M3 · Token |

**Quy tắc khi sửa workflow (n8n 2.x):**

- Sửa xong phải bấm **Publish**. Router chỉ gọi được workflow con đã publish; chưa publish thì báo lỗi *Workflow is not active*.
- Giữ nguyên node trigger *Router gọi tới* và dạng dữ liệu vào (`contracts/internal/`).
- Mọi workflow đặt **Settings > Error workflow** là `M3 · Xử lý lỗi`.
- File trong `n8n/workflows/` chỉ là bản khởi đầu. Sau khi import, bản thật nằm trong n8n; sao lưu bằng lệnh ở mục *Sao lưu*. Chạy lại `scripts/import-n8n.sh` sẽ **ghi đè** các workflow cùng id.

Sau mỗi lần n8n khởi động lại, webhook cần **khoảng 30 giây** mới nhận request. Gọi sớm hơn sẽ bị 404.

### Chatbot

**Thử bot:** mở workflow `M3 · Chat thử` trong n8n, bấm **Open chat**, nhắn như khách. Cuối mỗi câu trả lời có dòng `[ý định · model · độ trễ]` để kiểm tra. Gõ `/reset` để trả cuộc chat về cho bot sau khi đã bị chuyển người.

**Cho AI viết câu:** node `AI viết câu` gọi được hai loại API, chọn bằng `LLM_PROVIDER` trong `.env`:

| `LLM_PROVIDER` | Dùng | Cần điền |
|---|---|---|
| `openai` (mặc định trong `.env.example`) | Mọi API chuẩn OpenAI. Mặc định là **Groq**, miễn phí, không cần thẻ | `LLM_API_KEY` lấy ở console.groq.com → API Keys. Đổi nhà khác thì sửa `LLM_BASE_URL`, `LLM_MODEL` |
| `gemini` | Google Gemini | `GEMINI_API_KEY` lấy ở aistudio.google.com. Một số tài khoản bị Google chặn gói miễn phí (lỗi 403 *free tier is not available*) |

Với Groq, model chính là `qwen/qwen3.8-27b` (tiếng Việt tự nhiên nhất trong các model Groq cho dùng miễn phí, trả lời khoảng 1–2 giây). Groq miễn phí thỉnh thoảng báo quá tải, nên mỗi lần gọi chỉ chờ 10 giây rồi thử `LLM_MODEL_FALLBACK` (mặc định `openai/gpt-oss-120b`). Xem danh sách model key của mình dùng được ở console.groq.com → Models.

Sửa `.env` xong chạy `docker compose up -d n8n`. Chưa có key hoặc AI lỗi thì bot dùng câu mẫu, vẫn đúng giá và tồn kho, không bao giờ im lặng.

**Luồng một tin nhắn:**

1. Cập nhật bảng `conversations`. Nhân viên đang trả lời thì bot im lặng.
2. Hiểu tin nhắn: gọi service NLU nếu có `NLU_URL`, chưa có thì dùng quy tắc từ khóa tạm.
3. **Code chọn tool** theo ý định. Khiếu nại thì chuyển người ngay.
4. Tra sản phẩm (tool giả) và trạng thái đơn (`order_status_log`).
5. Gemini **chỉ viết câu** từ dữ liệu vừa tra.
6. **Soát giá và số lượng** bằng code. Sai lần 1 thì Gemini viết lại kèm góp ý; sai lần 2 thì chuyển người, câu sai không tới khách.
7. Gửi trả lời, ghi `chat_logs`.

**Test tự động bằng Gemini giả** (không cần key):

1. Import và publish `n8n/test-workflows/*.json`.
2. Trong `.env` đặt:
   - `GEMINI_API_KEY=test`
   - `GEMINI_BASE_URL=http://localhost:5678/webhook/2179f9fe-d27e-55de-8ecb-0387433a6b32/gemini-mock`
3. Chạy `docker compose up -d n8n`.
4. Gửi tin bằng `POST /webhook/chatbot-test` với `{"conversation_id":"...","text":"..."}`. Các từ khóa điều khiển Gemini giả:
   - `THU_VIET_LAI`: sai giá lần đầu, buộc bot viết lại;
   - `SAI_HAI_LAN`: sai cả hai lần, bot phải chuyển người;
   - `XIN_GAP_NGUOI`: Gemini xin chuyển cho người.
5. Test xong: trả `.env` về như cũ và unpublish 2 workflow test.

Thêm một đơn mẫu để thử tra đơn:

```bash
docker compose exec db psql -U odoo -d middleware -c "insert into order_status_log (tiktok_order_id, status, source, tracking_number) values ('579123456789012345','IN_TRANSIT','tiktok','VNEXAMPLE123456789');"
```

### Test Router

```bash
scripts/send-test-webhook.sh contracts/tiktok/webhooks/order_status_change.json
```

Kết quả đúng là `HTTP 200`. Xem lại trong n8n ở mục *Executions*, hoặc trong database:

```bash
docker compose exec db psql -U odoo -d middleware -c "select event_type, routed_to, received_at from processed_events order by received_at desc limit 5;"
```

Gửi lại cùng file sẽ vẫn nhận 200 nhưng không gọi workflow con lần nữa (đã bỏ bản trùng). Muốn gửi lại như sự kiện mới, đổi `tts_notification_id` trong file.

## Dùng hằng ngày

Xem log của một container (vd khi n8n lỗi):

```bash
docker compose logs -f n8n
```

Tắt toàn bộ (dữ liệu vẫn còn trong volume):

```bash
docker compose down
```

Vào database middleware bằng dòng lệnh:

```bash
docker compose exec db psql -U odoo -d middleware
```

(Thay `odoo` bằng `PG_USER` nếu bạn đặt khác.)

## Diễn tập cả luồng (trước buổi ghép, trước demo)

```bash
scripts/dien-tap.sh
```

Script tạm trỏ n8n vào TikTok giả và AI giả (`docker-compose.dien-tap.yml`), rồi chạy lần lượt: khách hỏi giá → chatbot trả lời bằng AI (không phải câu mẫu); khách đặt đơn → ghi đơn, gửi lại webhook không tạo bản trùng; giả lập M2 tạo Sales Order; Odoo báo đóng gói → đặt vận chuyển; TikTok báo đang giao → nhắn khách; webhook sai chữ ký và sai mã bí mật bị chặn; KPI có số. Mỗi bước in `[ĐẠT]` hoặc `[HỎNG]`. Cuối cùng script xóa mọi dữ liệu thử, trả bandit về như cũ và đưa n8n về cấu hình thật, kể cả khi bị ngắt giữa chừng. Mất khoảng 3 phút.

Không chạy khi shop đang có khách thật, vì trong lúc diễn tập n8n gọi TikTok giả.

## Chế độ giả lập (khi chưa có shop hay đơn thật)

Khi chưa có shop, hoặc shop chưa có sản phẩm bán được, bật chế độ giả lập. n8n gọi TikTok giả thay vì TikTok thật, và cả nhóm tạo đơn giả bằng một form trên web:

```bash
scripts/gia-lap.sh bat         # bật: in ra link form, link danh sách đơn và mã nhóm
scripts/gia-lap.sh trang-thai  # xem đang bật hay tắt, 10 đơn giả lập gần nhất
scripts/gia-lap.sh xoa-don     # xóa mọi đơn giả lập và log của chúng
scripts/gia-lap.sh tat         # tắt: n8n gọi TikTok thật
```

- **Form**: `https://<NGROK_DOMAIN>/form/gia-lap-tiktok`. Phải mở bằng domain ngrok; mở bằng `localhost` hay IP Tailscale thì trình duyệt chặn lúc gửi. Lần đầu ngrok hiện trang cảnh báo, bấm *Visit Site*.
- **Việc chọn được**: khách đặt đơn mới (nhập SKU*số lượng), kho đóng gói xong (thay Odoo báo, kích hoạt Đặt vận chuyển), đơn đang giao, khách đã nhận hàng, khách hủy đơn. Mỗi lần gửi tạo đúng sự kiện có chữ ký như TikTok gửi vào Router.
- **Danh sách đơn**: `https://<NGROK_DOMAIN>/webhook/gia-lap-don?ma=<mã nhóm>`, trang chữ liệt kê 20 đơn gần nhất, trạng thái và các bước hệ thống đã ghi. Dùng để lấy mã đơn cho bước tiếp theo.
- **Mã nhóm** (`GIA_LAP_MA` trong `.env`) chặn người lạ dùng form; gửi riêng cho nhóm.
- Đơn giả lập nằm trong bảng `gia_lap_don`; TikTok giả đọc chi tiết đơn từ đó, nên SKU, số lượng, tổng tiền, mã vận đơn đều khớp với những gì đã nhập. SKU có trong `sku_map` thì dùng SKU ID TikTok của nó.
- **API cho giao diện demo**: `https://<NGROK_DOMAIN>/webhook/demo/...` (sản phẩm, chat, đặt đơn, đẩy bước, danh sách đơn, tin nhắn, KPI), header `x-ma-nhom`, cho phép gọi từ mọi domain. Hợp đồng: [contracts/internal/demo_api.md](../contracts/internal/demo_api.md).
- `scripts/dien-tap.sh` chạy được khi đang bật giả lập và không tắt nó.

Khi app TikTok đã được duyệt và có shop thật (hoặc shop thử trong sandbox), chạy `scripts/gia-lap.sh tat` rồi làm theo mục *Kết nối shop với hệ thống*.

## Sao lưu

Container `backup` tự dump mọi database (n8n, middleware, Odoo) và filestore của Odoo vào `backups/db/<ngày-giờ>/` mỗi 24 giờ, giữ 14 ngày gần nhất. Máy tắt qua đêm thì lần bật sau sẽ sao lưu bù. Đổi chu kỳ bằng `BACKUP_EVERY_HOURS`, `BACKUP_KEEP_DAYS` trong `.env`.

Cuối mỗi buổi làm, sao lưu ngay và xuất workflow ra JSON (gồm cả workflow M2, M4 sửa trong giao diện):

```bash
scripts/backup.sh
```

Khôi phục một database (ghi đè, n8n và Odoo tạm dừng trong lúc chạy):

```bash
scripts/restore.sh 20261105-164408 middleware --yes
```

Database `n8n` chứa cả credential đã mã hóa bằng `N8N_ENCRYPTION_KEY`. Mất `.env` là mất cách đọc credential, nên giữ một bản `.env` trong trình quản lý mật khẩu, **không** để chung với bản sao lưu. Chép `backups/` lên Drive chung nếu muốn; thư mục này không lên GitHub vì chứa token và dữ liệu khách.

## Sửa bảng middleware sau khi đã chạy

File trong `init/` **chỉ chạy một lần**, khi volume database còn trống. Nếu đã chạy rồi mà muốn thêm hoặc sửa bảng:

1. Báo cả nhóm (quy tắc mục 7).
2. Viết file SQL mới, vd `init/05-them-cot.sql`, gồm `\connect middleware` và các lệnh `ALTER TABLE`.
3. Chạy tay:

```bash
docker compose exec -T db psql -U odoo -d postgres < init/05-them-cot.sql
```

Máy đã dựng trước ngày 2026-11-05 thì chạy tay một lần `init/04-kpi.sql` theo cách trên để có các view KPI.

Giữ file đó trong `init/` để lần dựng lại từ đầu cũng có thay đổi này.

## Các bảng middleware

| Bảng | Ai ghi | Dùng để |
|---|---|---|
| `sku_map` | M1 | Nối SKU chung với product ID, SKU ID của TikTok |
| `tokens` | M3 · Token | Access token, refresh token, `shop_cipher` |
| `processed_events` | M3 · Router | Chống xử lý trùng webhook |
| `conversations` | M3 · Chatbot | Cuộc chat đang do bot hay nhân viên trả lời |
| `chat_logs` | M3 · Chatbot | Mỗi lượt trả lời: ý định, dữ liệu đã tra, độ trễ, upsell |
| `failed_jobs` | M3 · Xử lý lỗi | Việc lỗi sau 3 lần thử, chờ xử lý tay |
| `order_status_log` | M2, M3 | Giờ đổi trạng thái đơn; view `order_latest_status` cho chatbot |
| `upsell_rules` | M3 (notebook) | Luật mua kèm theo loại hàng: `mac_dinh` (viết tay) hoặc `amazon` (học từ dữ liệu) |
| `bandit_arms` | M3 · Chatbot, Ghi nhận mua kèm | Điểm Beta(alpha, beta) của từng món được mời |
| `upsell_offers` | M3 · Chatbot | Mỗi lần mời mua kèm, và khách có mua trong 48 giờ không |
| `upsell_order_stats` | M3 · Ghi nhận mua kèm | Giá trị từng đơn theo nhóm offer/control; view `upsell_report`, `upsell_offer_report` |

Chi tiết từng cột có trong [init/02-middleware-schema.sql](../init/02-middleware-schema.sql).

## Lỗi hay gặp

| Hiện tượng | Cách sửa |
|---|---|
| Docker Desktop sập: *The file cannot be accessed by the system* | Chạy `scripts\fix-docker-desktop.ps1` (mục 7) |
| Docker báo *There was a problem with WSL*, exit status 143 | Cũng chạy `scripts\fix-docker-desktop.ps1`; script có tắt WSL trước khi mở lại |
| Odoo báo *Using the database user 'postgres' is a security risk* | Đổi `PG_USER` trong `.env` sang tên khác, xóa volume (`docker compose down -v`, **mất hết dữ liệu**) rồi chạy lại |
| Thành viên vào n8n qua Tailscale bị báo lỗi *secure cookie* | Kiểm tra `N8N_SECURE_COOKIE: "false"` trong compose rồi `docker compose up -d n8n` |
| Container ngrok liên tục khởi động lại | `docker compose logs ngrok`; thường do sai authtoken hoặc domain có `https://` |
| `port is already allocated` hoặc `bind: ... forbidden` ở cổng Postgres | Máy đã có PostgreSQL khác. Compose mặc định dùng cổng 15432 ra máy; nếu vẫn trùng, đặt `PG_HOST_PORT` khác trong `.env` |
| Router chạy lỗi *Workflow is not active and cannot be executed* | Mở workflow con đó, bấm **Publish** |
| Lệnh `docker compose exec ... /tmp/...` trong Git Bash báo không thấy file | Git Bash đổi đường dẫn; thêm `MSYS_NO_PATHCONV=1` trước lệnh |
| Webhook test trả `HTTP 401` dù đúng file | `TIKTOK_APP_KEY`, `TIKTOK_APP_SECRET` trong `.env` vừa đổi mà n8n chưa nhận: `docker compose up -d n8n` |
| Sửa `init/` nhưng bảng không đổi | Xem mục *Sửa bảng middleware sau khi đã chạy* |
| Đổi `N8N_ENCRYPTION_KEY` rồi Credentials báo lỗi | Đặt lại khóa cũ; nếu mất khóa cũ thì phải nhập lại mọi Credentials |

## Bảo mật

- Qua ngrok, cả trình soạn thảo n8n cũng truy cập được từ internet (có đăng nhập). Mọi tài khoản n8n dùng mật khẩu mạnh.
- Odoo, Postgres không mở ra internet. Postgres chỉ mở cho chính máy này (`127.0.0.1`).
- Khóa và mật khẩu chỉ nằm trong `.env` hoặc Credentials của n8n; không dán vào node, không gửi qua chat nhóm.
