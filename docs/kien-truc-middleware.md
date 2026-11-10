# Kiến trúc hệ thống và middleware: Conversational Commerce trên TikTok Shop

Môn Công nghệ thông tin trong thương mại điện tử · Nhóm 4 người · Tài liệu kỹ thuật của Thành viên 3 (trưởng nhóm, hạ tầng, middleware, chatbot, lớp AI)

---

## 0. Đọc nhanh

**Shop làm gì.** Một gian hàng đồ công nghệ (phụ kiện điện thoại, tai nghe, loa, điện thoại...) bán **chỉ trên TikTok Shop**. Khách xem video, nhắn tin hỏi shop, đặt mua ngay trong app TikTok.

**Hệ thống làm gì.** Tự động hóa toàn bộ phía sau mà khách không nhìn thấy:

1. **Trả lời chat 24/7** bằng chatbot AI, dùng dữ liệu thật về giá, tồn kho, đơn hàng, và không bao giờ báo sai giá.
2. **Đơn tự chảy vào kho** (Odoo): không nhập tay, không bán quá số hàng có.
3. **Tự đặt giao hàng** khi kho đóng gói xong, tự báo mã vận đơn cho khách.
4. **Mời mua kèm thông minh**: mô hình học từ dữ liệu Amazon chọn loại hàng, bandit học từ khách thật chọn món.
5. **Ghi log mọi thứ** để đo hiệu quả (dashboard KPI).

**Trái tim của hệ thống là middleware n8n.** TikTok và Odoo không nói chuyện trực tiếp với nhau; mọi sự kiện đi qua n8n, được kiểm tra, ghi lại, rồi chuyển đến đúng chỗ xử lý.

**Con số chính:**

| Thành phần | Số lượng |
|---|---|
| Container Docker | 6: PostgreSQL, Odoo, n8n, ngrok, sao lưu, NLU |
| Workflow n8n | 16 (12 của M3, 4 giữ chỗ cho M2) + 4 workflow test; M2 còn tự tạo thêm Tra sản phẩm Odoo |
| Bảng dữ liệu middleware | 11 bảng, 8 view (3 báo cáo, 5 KPI) |
| Kiểm tra cả luồng | Script diễn tập 13 bước, đạt 13/13 ngày 06/11/2026 |
| Mô hình AI nhóm tự làm | 2 PhoBERT (ý định, thông tin) + 1 mô hình mua kèm + 1 bandit |
| Chi phí hạ tầng | 0đ (tự host, gói miễn phí) |

---

## 1. Bức tranh tổng thể

### 1.1. Bài toán và lời giải

| Vấn đề của một shop nhỏ trên TikTok | Hệ thống giải quyết bằng |
|---|---|
| Khách hỏi lúc 23 giờ, không ai trả lời thì khách đi | Chatbot trả lời trong 1–3 giây, 24/7 |
| Trả lời sai giá thì mất uy tín, có thể phải bán lỗ | Giá lấy từ kho lúc trả lời; **code soát mọi con số** trước khi gửi |
| Nhập đơn tay từ TikTok vào sổ kho, dễ sai, dễ bán quá hàng | Đơn tự vào Odoo, tồn kho tự đẩy ngược lên TikTok |
| Quên đặt giao hàng, khách chờ lâu | Đóng gói xong là tự đặt lấy hàng, tự in phiếu |
| Không biết khách mua kèm gì | Mô hình mua kèm + bandit, có nhóm đối chứng để đo |
| Không biết hiệu quả quảng cáo, chatbot | Mọi bước ghi log, dashboard KPI |

### 1.2. Sơ đồ kiến trúc (5 tầng)

```
TẦNG 1 · KHÁCH VÀ KÊNH BÁN
  Khách (app TikTok) ── xem video, livestream (M4) ── chat với shop ── đặt hàng, thanh toán
        │                                                   ▲
        ▼                                                   │ tin trả lời, mã vận đơn
  TikTok Shop (Seller Center: M1)  ◄──── API ────┐          │
        │ webhook: tin nhắn, đơn, hủy, gói hàng, sắp hết ủy quyền
        ▼                                         │
TẦNG 2 · CỔNG VÀO MẠNG
  ngrok (HTTPS, domain tĩnh) ── chỉ đưa TikTok vào n8n
  Tailscale (mạng riêng) ────── cho 4 thành viên vào Odoo/n8n trên máy chủ nhóm
        │                                         │
        ▼                                         │
TẦNG 3 · MIDDLEWARE: n8n (M3) ── chạy trên máy chủ nhóm bằng Docker
  ┌─ M3 · Router ─── kiểm chữ ký → trả 200 → bỏ bản trùng → rẽ nhánh
  │     ├─ NEW_MESSAGE ──────────► M3 · Chatbot ─► M3 · Gửi tin TikTok ─┘
  │     ├─ đơn chờ giao ─────────► M2 · Tạo đơn  + M3 · Ghi nhận mua kèm
  │     ├─ hủy đơn ──────────────► M2 · Hủy đơn
  │     ├─ gói hàng / đang giao ─► M3 · Trạng thái đơn ─► M3 · Gửi tin TikTok
  │     └─ sắp hết ủy quyền ─────► M3 · Token
  ├─ M3 · TikTok API (ký mọi lệnh gọi TikTok) ── dùng chung cho mọi workflow
  ├─ M3 · Đặt vận chuyển ◄── Odoo báo "đã đóng gói"
  ├─ M2 · Đồng bộ tồn kho ◄── lịch 15 phút, sau tạo/hủy đơn
  ├─ M3 · KPI cho dashboard ◄── Google Sheet của M4 hỏi mỗi giờ
  └─ M3 · Xử lý lỗi ◄── mọi workflow lỗi
        │ JSON-RPC            │ HTTP nội bộ        │ HTTPS
        ▼                     ▼                    ▼
TẦNG 4 · HỆ THỐNG NỘI BỘ VÀ AI
  Odoo (M2): sản phẩm, giá,   NLU PhoBERT (M3):     Gemini API: viết câu
  tồn kho, đơn, serial        ý định + thông tin    trả lời (không quyết
  (nguồn sự thật)             (nhóm tự train)       định số liệu)
        │
  PostgreSQL: DB odoo · DB n8n · DB middleware (11 bảng, 8 view)
        │                         └─ container backup: dump mỗi 24 giờ, giữ 14 ngày
TẦNG 5 · ĐO LƯỜNG
  view kpi_* ─► M3 · KPI (CSV) ─► ngrok ─► Apps Script ─► Google Sheet ─► Looker Studio (M4)
```

### 1.3. Năm nguyên tắc thiết kế

1. **SKU là khóa nối mọi hệ thống.** Một sản phẩm có đúng một mã (vd `PK-SAC-ANKER20W-TRANG`), viết giống hệt nhau ở sheet sản phẩm, Odoo (Internal Reference), TikTok (Seller SKU), chatbot và bảng `sku_map`.
2. **Odoo là nguồn sự thật** cho giá, tồn kho, đơn hàng, số serial. Không ai sửa tồn kho bằng tay trong Seller Center.
3. **Mọi sự kiện đi qua n8n.** TikTok và Odoo không gọi trực tiếp nhau. Nhờ vậy mọi bước đều có log, có xử lý lỗi, đổi được một bên mà bên kia không biết.
4. **Hợp đồng dữ liệu** (thư mục `contracts/`): mỗi điểm nối giữa hai người hoặc hai hệ thống có file mô tả dữ liệu vào/ra. Mỗi người làm song song trên dữ liệu mẫu, đến lúc ghép thì chỉ cần khớp hợp đồng.
5. **AI không được quyết định con số.** Mô hình hiểu câu hỏi, code chọn dữ liệu, LLM chỉ viết lời, code soát lại. Sai thì viết lại; sai lần hai thì chuyển người.

### 1.4. Liên hệ với nội dung môn học

| Khái niệm trong bài giảng | Thể hiện trong hệ thống |
|---|---|
| **Front Controller / Single Page CGI** (Chương 6) | `M3 · Router`: một cửa vào duy nhất cho mọi webhook; làm việc chung (kiểm chữ ký, ghi log, chống trùng) rồi chia việc cho workflow con |
| **Cấu hình tách khỏi code, 12-factor** (Chương 6) | Mọi khóa và mật khẩu nằm trong `.env` và Credentials của n8n, không viết vào workflow; cùng bộ workflow chạy được ở máy khác chỉ bằng cách đổi `.env` |
| **Template engine** (Chương 6) | Câu mẫu dự phòng của chatbot; prompt Gemini ghép từ khối dữ liệu |
| **Xử lý thanh toán an toàn** (Chương 6) | Shop không chạm vào thẻ hay tiền của khách: thanh toán nằm hoàn toàn trong TikTok Shop |
| **SQL, CSDL quan hệ, chống SQL injection** (Chương 7) | PostgreSQL với khóa chính, ràng buộc CHECK, view; mọi câu SQL trong n8n dùng tham số `$1, $2`, không nối chuỗi tin nhắn khách |
| **Conversational commerce, voice/AI agent** (Chương 7) | Chatbot AI trong khung chat TikTok Shop, có ràng buộc an toàn |
| **Live commerce, social commerce ở Việt Nam** (Chương 7) | Kênh bán duy nhất là TikTok Shop; video và GMV Max kéo khách |

---

## 2. Các nền tảng, từng cái chi tiết

Mỗi nền tảng được mô tả theo cùng một khung: **là gì · vai trò · ai làm · dựng thế nào · dùng chức năng gì · nối với gì · chi phí và giới hạn · rủi ro**.

### 2.1. TikTok Shop Seller Center: cửa hàng

- **Là gì:** trang quản trị cho người bán trên TikTok Shop (`seller-vn.tiktok.com`).
- **Vai trò:** nơi khách nhìn thấy: trang sản phẩm, giỏ hàng, thanh toán, khung chat của shop, đơn hàng.
- **Ai làm:** **M1**.
- **Dựng thế nào:**
  1. Đăng ký shop **Cá nhân** bằng CCCD (không cần giấy phép kinh doanh); xác thực VNeID nếu được yêu cầu.
  2. Thêm tài khoản ngân hàng **cùng họ tên** chủ shop (nhận tiền bán hàng).
  3. Liên kết tài khoản TikTok chính thức của shop (để M4 đăng video gắn sản phẩm).
  4. Chờ duyệt 1–2 ngày.
  5. Vận chuyển: dùng đơn vị do nền tảng chỉ định, hình thức **lấy hàng tại shop**.
  6. Đăng 20–30 sản phẩm, **Seller SKU trùng SKU trong sheet**. Ghi product ID và SKU ID của TikTok vào bảng `sku_map`.
- **Chức năng dùng:**
  - quản lý sản phẩm;
  - quản lý đơn (chỉ xem; đơn được middleware tự xử lý);
  - **chat với khách** khi bot chuyển cho người;
  - nhận tiền.
- **Nối với:** phát mọi sự kiện (tin nhắn, đơn, hủy, giao hàng) sang Partner Center, và từ đó sang n8n.
- **Chi phí:** mở shop miễn phí. Sàn khấu trừ thuế 1,5% trên mỗi đơn, cộng phí sàn theo chính sách TikTok Shop hiện hành (xem trong Seller Center).
- **Rủi ro:** danh mục laptop/điện thoại có thể đòi giấy tờ. Nếu vậy chỉ bán phụ kiện và báo cả nhóm sớm.

### 2.2. TikTok Shop Partner Center và Open API: cửa để tự động hóa

- **Là gì:** cổng dành cho nhà phát triển (`partner.tiktokshop.com`). Tạo "app" để đọc/ghi dữ liệu shop qua API và nhận webhook.
- **Vai trò:** **cách duy nhất** để hệ thống tự động làm việc với shop.
- **Ai làm:** **M3** (M1 bấm ủy quyền).
- **Dựng thế nào (sau khi shop được duyệt):**
  1. Đăng ký vai trò **Seller in-house developer**, tạo app loại **Custom**.
  2. Khai **Redirect URL** = `https://<domain ngrok>/webhook/tiktok-oauth`.
  3. Khai **Webhook URL** = `https://<domain ngrok>/webhook/tiktok-events`.
  4. Xin quyền: sản phẩm, đơn hàng, giao vận (fulfillment). **Gửi ticket xin Customer Service API** để nhắn tin cho khách; quyền này phải xin riêng.
  5. Lấy **App Key** và **App Secret**, điền vào `.env` (`TIKTOK_APP_KEY`, `TIKTOK_APP_SECRET`).
  6. Lấy link ủy quyền của app, thêm `&state=<TIKTOK_OAUTH_STATE>`, gửi M1 bấm. Trang hiện "Đã kết nối shop với hệ thống" là xong.
- **Chức năng dùng:**

  | Nhóm API | Lệnh | Dùng ở workflow |
  |---|---|---|
  | Ủy quyền | `GET /api/v2/token/get`, `/api/v2/token/refresh`, `GET /authorization/202309/shops` | M3 · Token |
  | Đơn hàng | `GET /order/202309/orders?ids=` | Tạo đơn (M2), Đặt vận chuyển, Trạng thái đơn, Ghi nhận mua kèm |
  | Giao vận | `POST /fulfillment/202309/packages/{id}/ship`, `GET .../shipping_documents` | Đặt vận chuyển |
  | Sản phẩm, tồn kho | cập nhật tồn kho | Đồng bộ tồn kho (M2) |
  | Chăm sóc khách | `POST /customer_service/202309/conversations`, `.../{id}/messages` | Gửi tin TikTok |
  | Webhook | `ORDER_STATUS_CHANGE`, `CANCELLATION_STATUS_CHANGE`, `PACKAGE_UPDATE`, `NEW_MESSAGE`, `UPCOMING_AUTHORIZATION_EXPIRATION`, `SELLER_DEAUTHORIZATION` | Router |

- **Bảo mật:**
  - Mỗi webhook TikTok gửi kèm **chữ ký HMAC-SHA256**; Router kiểm trước khi làm gì.
  - Mỗi lệnh gọi API phải **ký** bằng App Secret và gửi kèm access token; workflow `M3 · TikTok API` làm việc này.
  - Access token hết hạn sau khoảng 7 ngày; workflow `M3 · Token` tự làm mới.
- **Chi phí:** miễn phí.
- **Rủi ro:**
  - Duyệt app lâu (2–3 ngày).
  - Có thể không được cấp Customer Service API. Khi đó chatbot vẫn chạy và demo qua khung chat thử của n8n; chat thật trả lời tay trong Seller Center.

### 2.3. TikTok Studio và Ads Manager (GMV Max): kéo khách

- **Là gì:** TikTok Studio để đăng video và gắn sản phẩm; Ads Manager để chạy quảng cáo. **GMV Max** là loại quảng cáo dành riêng cho TikTok Shop, tối ưu theo doanh thu.
- **Vai trò:** đưa khách đến shop. Không có khách thì chatbot và luồng đơn không có gì để chạy.
- **Ai làm:** **M4**.
- **Dựng thế nào:**
  1. Đăng nhập tài khoản chính thức của shop (M1 liên kết).
  2. Tạo tài khoản Ads Manager, liên kết shop, cài **GMV Pay** để trừ phí quảng cáo vào doanh thu shop.
  3. Chuẩn bị chiến dịch Product GMV Max: sản phẩm, ROI mục tiêu, ngân sách ngày.
  4. **Chỉ bật khi chatbot và luồng đơn đã chạy**, để không đổ tiền quảng cáo vào một shop chưa trả lời được khách.
- **Chức năng dùng:** đăng video gắn sản phẩm; A/B test nội dung (video nói thông số so với video nói "nỗi đau" như nóng máy, giật lag); theo dõi CTR, ROI.
- **Nối với hệ thống:** video được dựng tự động bằng workflow `M4 · Video` (lấy dữ liệu sản phẩm từ Odoo qua n8n). Số liệu quảng cáo đưa vào dashboard.
- **Chi phí:** ngân sách quảng cáo do nhóm tự đặt.

### 2.4. Docker và Docker Compose: nơi mọi thứ chạy

- **Là gì:** Docker đóng gói mỗi phần mềm thành một **container** (một hộp chạy độc lập, có sẵn đủ thư viện). Docker Compose mô tả nhiều container trong một file `docker-compose.yml` và bật/tắt chúng bằng một lệnh.
- **Vai trò:** chạy toàn bộ hệ thống trên **một máy chủ của nhóm** (laptop trưởng nhóm, luôn bật), miễn phí, không cần thẻ ngân hàng như thuê máy chủ đám mây.
- **Ai làm:** **M3**.
- **Dựng thế nào:**
  1. Cài Docker Desktop cho Windows (dùng WSL 2), bật *Start when you sign in*.
  2. `cp .env.example .env`, điền mật khẩu, khóa (xem [sổ tay vận hành](van-hanh-may-chu.md)).
  3. `docker compose up -d`.
- **Sáu container:**

  | Container | Image | Cổng ra máy | Vai trò |
  |---|---|---|---|
  | `db` | `postgres:17` | `127.0.0.1:15432` (chỉ máy này) | CSDL cho Odoo, n8n, middleware |
  | `odoo` | `odoo:19` | `8069` | ERP kho, đơn |
  | `n8n` | `n8nio/n8n` (2.45) | `5678` | Middleware |
  | `ngrok` | `ngrok/ngrok` | `127.0.0.1:4040` (trang xem request) | Đường hầm HTTPS cho TikTok |
  | `backup` | `postgres:17` | không mở | Sao lưu tự động mọi database và tệp của Odoo (mục 3.6) |
  | `nlu` | `cntttmdt-nlu` (tự build) | `127.0.0.1:8000` | Mô hình PhoBERT; chỉ chạy khi bật `COMPOSE_PROFILES=nlu` |

- **Container sao lưu:** dùng lại image `postgres:17` để có sẵn `pg_dump`, chạy `scripts/backup-loop.sh`. Mỗi giờ script xem bản sao lưu mới nhất; nếu đã cũ hơn 24 giờ thì dump mọi database (`pg_dump -Fc`), tài khoản PostgreSQL (`pg_dumpall --globals-only`) và filestore của Odoo (ảnh, tệp đính kèm) vào `backups/db/<ngày-giờ>/`, rồi xóa bản cũ hơn 14 ngày. Laptop tắt qua đêm thì lần bật sau sao lưu bù. Bản đang ghi dở mang đuôi `.partial`, nên không bao giờ bị nhầm là bản hoàn chỉnh.
- **File ghi đè `docker-compose.dien-tap.yml`:** khi diễn tập, n8n được khởi động lại với địa chỉ TikTok và Gemini trỏ vào workflow giả nằm ngay trong n8n. Cách này dùng tính năng gộp nhiều file compose (`-f a.yml -f b.yml`), không phải sửa `.env`.

- **Chức năng dùng:**
  - **volume** giữ dữ liệu qua các lần khởi động lại (`db-data`, `odoo-data`, `n8n-data`);
  - **mạng nội bộ**: các container gọi nhau bằng tên (`http://odoo:8069`, `http://n8n:5678`, `http://nlu:8000`) mà không ra internet;
  - **`restart: unless-stopped`**: máy khởi động lại thì container tự chạy lại;
  - **healthcheck**: Odoo và n8n chỉ khởi động khi PostgreSQL đã sẵn sàng;
  - **profile**: service NLU tốn RAM chỉ chạy khi bật.
- **Rủi ro trên máy hiện tại:** Docker Desktop (trên bản Windows Insider) hay sập khi khởi động vì không xóa được file socket cũ. Sửa bằng `scripts/fix-docker-desktop.ps1`.

### 2.5. PostgreSQL: cơ sở dữ liệu

- **Là gì:** hệ quản trị CSDL quan hệ mã nguồn mở.
- **Vai trò:** một container phục vụ **ba database**:
  - `odoo`: dữ liệu ERP, do Odoo tự quản lý;
  - `n8n`: workflow, credentials (mã hóa), lịch sử chạy;
  - **`middleware`**: 11 bảng dùng chung giữa các workflow (chi tiết ở mục 3.3).
- **Ai làm:** **M3**.
- **Dựng thế nào:** container tự chạy các file `init/*.sql` lần đầu, gồm tạo database, tạo bảng và luật mua kèm mặc định. Thêm bảng về sau thì chạy tay ([sổ tay vận hành](van-hanh-may-chu.md), mục *Sửa bảng middleware*).
- **Chức năng dùng:**
  - khóa chính, `UNIQUE`, `CHECK` (vd `mode IN ('bot','staff')`);
  - **`INSERT ... ON CONFLICT DO NOTHING`** để chống xử lý trùng;
  - **CTE ghi dữ liệu** (`WITH ... UPDATE ... RETURNING`): làm nhiều việc trong một câu lệnh, ví dụ vừa thưởng bandit vừa ghi đơn;
  - **view** cho báo cáo và KPI (`percentile_cont` tính độ trễ p90, `FILTER` đếm có điều kiện, `generate_series` tạo đủ 90 ngày kể cả ngày không có số liệu); kiểu `jsonb` để lưu dữ liệu gốc của sự kiện.
- **Bảo mật:** mật khẩu trong `.env`; cổng chỉ mở cho `127.0.0.1`; mọi truy vấn từ n8n dùng **tham số** (chống SQL injection).

### 2.6. n8n: middleware

- **Là gì:** công cụ tự động hóa dạng "kéo thả node", mã nguồn mở, tự host được. Mỗi **workflow** là chuỗi **node**: node kích hoạt (trigger), node xử lý (Code, IF, Switch), node gọi dịch vụ (HTTP, Postgres, Odoo).
- **Vì sao chọn:**
  - Có sẵn node Webhook, Postgres, HTTP, Code (JavaScript).
  - Tự host nên **không giới hạn số lần chạy**.
  - Cả nhóm cùng sửa qua trình duyệt.
  - Không phải viết backend từ đầu.
- **Ai làm:** **M3** dựng và làm 12 workflow; M2, M4 có tài khoản riêng làm workflow của mình (tên bắt đầu `M2 ·`, `M4 ·`).
- **Dựng thế nào:**
  1. Container `n8n` dùng database `n8n` trong PostgreSQL.
  2. Mở `http://<IP Tailscale>:5678`, tạo tài khoản owner, mời M2, M4.
  3. Chạy `scripts/import-n8n.sh` để nạp credential Postgres và toàn bộ workflow từ `*/workflows/`, publish, khởi động lại n8n.
- **Giới hạn của bản Community miễn phí (đã thử thật trên n8n 2.45.4, ngày 05/11/2026):**

  | Việc | Kết quả |
  |---|---|
  | Mời member, lấy link mời mà không cần cài máy chủ email | Được |
  | Chia sẻ workflow hoặc credential cho người khác | Không: n8n trả *Plan lacks license for this feature* |
  | Nâng member thành admin | Không, cùng lỗi trên |

  Vì vậy member chỉ thấy và sửa được workflow, credential của chính mình. Workflow chạy thật phải nằm ở tài khoản owner với `id` cố định như trong `*/workflows/`, vì Router gọi workflow con theo `id`. Quy trình nhóm thống nhất: M2, M4 làm và thử trong tài khoản riêng, tải file JSON về, đổi `id` thành `id` của file giữ chỗ, gửi trưởng nhóm; trưởng nhóm chạy `scripts/import-n8n.sh` để nạp đè vào tài khoản owner. Chi tiết ở [huong-dan-tai-khoan-n8n.md](huong-dan-tai-khoan-n8n.md).
- **Khái niệm cần nắm:**

  | Khái niệm | Nghĩa | Dùng ở đâu |
  |---|---|---|
  | **Trigger** | Thứ bắt đầu workflow: Webhook (có request HTTP), Schedule (theo giờ), Execute Workflow Trigger (workflow khác gọi), Chat Trigger (khung chat), Error Trigger (có lỗi) | Mọi workflow |
  | **Sub-workflow** | Workflow được workflow khác gọi qua node *Execute Workflow*, giống gọi hàm | Router gọi Chatbot, Tạo đơn...; mọi nơi gọi `M3 · TikTok API` |
  | **Credentials** | Nơi lưu mật khẩu, được **mã hóa** bằng `N8N_ENCRYPTION_KEY` | `Postgres · middleware` |
  | **Publish** | n8n 2.x: workflow phải được publish mới chạy thật; **workflow con cũng phải publish** | Mọi workflow |
  | **Error workflow** | Workflow tự chạy khi workflow khác lỗi | Mọi workflow trỏ về `M3 · Xử lý lỗi` |
  | **Retry On Fail** | Node tự thử lại tối đa 3 lần | Mọi node Postgres |
  | **Code node** | Viết JavaScript; đọc biến môi trường `$env`, gọi HTTP bằng `this.helpers.httpRequest`, dùng `crypto` | Ký chữ ký, chatbot, bandit |

- **Giới hạn đã gặp (ghi lại để nhóm khỏi mất thời gian):**
  - Sau khi khởi động lại, webhook cần **khoảng 30 giây** mới nhận request.
  - Webhook có tham số trong đường dẫn (`:id`) được đăng ký kèm mã webhook ở đầu.
  - Node Code **không có `URLSearchParams`**.
  - `$('Node IF').first()` đọc nhánh của IF nối thẳng vào node hiện tại.
- **Nối với:** TikTok (qua ngrok), Odoo (`http://odoo:8069`), NLU (`http://nlu:8000`), Gemini (HTTPS), PostgreSQL.

### 2.7. Odoo Community: kho và đơn hàng (nguồn sự thật)

- **Là gì:** phần mềm ERP mã nguồn mở. Bản **Community tự host** miễn phí và mở API không giới hạn; bản Odoo Online miễn phí thì không mở API.
- **Vai trò:** giữ **giá, tồn kho, đơn bán, phiếu xuất kho, số serial**.
- **Ai làm:** **M2**. M3 không chạm vào Odoo; middleware nối với Odoo qua hợp đồng `contracts/internal/van_chuyen.md` và `tool_san_pham.md`.
- **Dựng thế nào (M2):**
  1. Mở `http://<IP Tailscale>:8069`, tạo database `cntttmdt` (tiếng Việt, VND, múi giờ Việt Nam, không tick dữ liệu mẫu).
  2. Cài app **Sales** và **Inventory**.
  3. Bật **Lots & Serial Numbers**; mỗi máy có serial để bảo hành.
  4. Import sheet sản phẩm của M1 (Internal Reference = SKU); nhập giá và tồn đầu kỳ.
  5. Tạo **user riêng cho tích hợp**, cấp API key với quyền tối thiểu.
  6. Bật developer mode. Tạo **Automation Rule**: phiếu xuất kho chuyển *Done* thì gửi webhook tới `http://n8n:5678/webhook/odoo-picking-done?secret=<ODOO_WEBHOOK_SECRET>`.
- **Chức năng dùng:**
  - Sales Order (mã đơn TikTok ghi ở `client_order_ref`);
  - phiếu xuất kho (đóng gói, quét serial, bấm Validate);
  - tồn kho có thể bán (`free_qty`: tồn thực trừ hàng đã giữ cho đơn chưa giao), là số đẩy lên TikTok;
  - JSON-RPC API để n8n đọc/ghi;
  - Automation Rule để báo n8n.
- **Bốn workflow M2 nối Odoo với middleware:** Tạo đơn, Hủy đơn, Đồng bộ tồn kho, Cập nhật Odoo (vận chuyển). Thêm `M2 · Tra sản phẩm Odoo` để chatbot chuyển từ dữ liệu giả sang dữ liệu thật.
- **Rủi ro:** webhook của bản Community có thể không chạy. Dự phòng: n8n quét phiếu xuất kho mới theo lịch.

### 2.8. ngrok: đưa TikTok vào n8n

- **Là gì:** dịch vụ "đường hầm": cấp một địa chỉ HTTPS công khai (vd `ten-shop.ngrok-free.app`) và chuyển mọi request về máy trong nhà.
- **Vai trò:** TikTok ở internet cần gọi được webhook vào n8n trên laptop, mà laptop không có IP công khai.
- **Ai làm:** **M3**.
- **Dựng thế nào:**
  1. Đăng ký ngrok.com (miễn phí, không cần thẻ), lấy **Authtoken** và nhận **một domain tĩnh** miễn phí.
  2. Điền `NGROK_AUTHTOKEN`, `NGROK_DOMAIN` vào `.env`; container `ngrok` tự chạy lệnh `ngrok http n8n:5678 --url=<domain>`.
  3. Khai domain vào Partner Center **một lần** (domain tĩnh nên không đổi).
- **Chức năng dùng:** trang `http://localhost:4040` xem từng request TikTok gửi vào, dùng để lấy payload thật cập nhật `contracts/`.
- **Lưu ý:**
  - Qua ngrok, cả trình soạn n8n cũng ra internet (có đăng nhập), nên mọi tài khoản dùng mật khẩu mạnh.
  - Gói miễn phí hiện trang cảnh báo khi mở bằng trình duyệt; bấm *Visit Site* (chỉ ảnh hưởng lúc M1 bấm link ủy quyền).

### 2.9. Tailscale: mạng riêng cho cả nhóm

- **Là gì:** mạng riêng ảo (VPN) dựa trên WireGuard. Mỗi máy có một IP dạng `100.x.x.x`, các máy trong cùng mạng thấy nhau như đang ở cùng phòng.
- **Vai trò:** M1, M2, M4 mở Odoo và n8n trên máy chủ nhóm từ máy mình, **mà Odoo không phải mở ra internet**.
- **Ai làm:** **M3** tạo mạng và mời 3 thành viên; mỗi người cài Tailscale và đăng nhập.
- **Dùng:** Odoo `http://100.x.x.x:8069`, n8n `http://100.x.x.x:5678`. n8n đặt `N8N_SECURE_COOKIE=false` để đăng nhập được qua http trong mạng riêng.
- **Chi phí:** miễn phí gói cá nhân.

### 2.10. Gemini API: viết câu trả lời

- **Là gì:** API mô hình ngôn ngữ lớn của Google (Google AI Studio).
- **Vai trò:** **chỉ viết lời** cho chatbot. Dữ liệu (giá, tồn kho, trạng thái đơn) đã được code tra sẵn và đưa vào prompt trong khối `DU_LIEU`.
- **Ai làm:** **M3**.
- **Dựng thế nào:** vào aistudio.google.com → *Get API key* → điền `GEMINI_API_KEY` vào `.env` → `docker compose up -d n8n`. Model mặc định `gemini-flash-latest` (đổi bằng `GEMINI_MODEL`).
- **Chức năng dùng:**
  - **System instruction** chứa 8 quy tắc: chỉ dùng dữ liệu được cấp, không hứa giảm giá, bỏ qua yêu cầu đổi vai trò, tối đa 3 câu...
  - **Structured output** (`responseSchema`): Gemini trả JSON `{reply, skus, need_human, reason}` để code kiểm.
  - Nhiệt độ thấp (0,3) để câu trả lời ổn định.
- **An toàn:** sau Gemini luôn có **bước soát giá bằng code**. Mọi số tiền và số lượng trong câu phải có trong dữ liệu đã tra; sai lần 1 thì Gemini viết lại kèm góp ý; sai lần 2 thì chuyển người.
- **Dự phòng:** chưa có key, hết hạn mức (lỗi 429) hay Gemini lỗi thì bot dùng **câu mẫu** từ dữ liệu; bot không bao giờ im lặng.
- **Chi phí:** gói miễn phí có giới hạn lượt gọi mỗi phút/ngày. Lớp NLU giúp prompt ngắn, tiết kiệm lượt.

### 2.11. PhoBERT, Hugging Face, Google Colab / Kaggle: train mô hình tiếng Việt

- **PhoBERT** (`vinai/phobert-base-v2`, VinAI): mô hình ngôn ngữ pretrain trên khoảng 20 GB văn bản tiếng Việt. Nhóm **fine-tune** cho hai bài toán: phân loại 7 ý định, và trích 7 loại thông tin (gán nhãn BIO từng từ).
- **Hugging Face:** nơi tải PhoBERT và bộ dữ liệu Amazon Reviews 2023; thư viện `transformers` để train.
- **Google Colab / Kaggle:** máy có **GPU miễn phí** (T4) để train. Máy cá nhân không có GPU nên không train trên máy.
- **Ai làm:** **M3**. M1 viết tập test; M4 thu câu thật bằng Google Form.
- **Quy trình chi tiết:** [huong-dan-train-ai.md](huong-dan-train-ai.md).

### 2.12. Service NLU (FastAPI): đưa mô hình vào chạy thật

- **Là gì:** dịch vụ web nhỏ viết bằng FastAPI (`3-middleware-ai/nlu/service/app.py`), chạy trong container `nlu`.
- **Vai trò:** chatbot gửi tin nhắn, nhận lại ý định, độ tự tin và các thông tin trích được.
- **API:**
  - `POST /analyze {"text": "..."}` trả về `{intent, confidence, top_intents, entities, segmented, latency_ms}`;
  - `GET /health` trả 200 khi mô hình đã nạp xong.
- **Tối ưu:**
  - **lượng tử hóa int8**: RAM khoảng 0,9 GB thay vì 1,24 GB;
  - nạp từng mô hình rồi giải phóng bộ nhớ;
  - tách từ một lần dùng cho cả hai mô hình;
  - ~0,1 giây mỗi câu trên CPU.
- **Dự phòng:** service tắt hoặc lỗi thì chatbot tự dùng **bộ quy tắc từ khóa**. Độ tự tin < 0,6 thì chuyển người.

### 2.13. Amazon Reviews 2023: dữ liệu học mua kèm

- **Là gì:** bộ dữ liệu công khai của McAuley Lab (UC San Diego): hàng chục triệu đánh giá sản phẩm Amazon, kèm thông tin sản phẩm.
- **Vai trò:** shop mới chưa có đơn để học, nên học thói quen "mua cùng nhau" ở mức **loại hàng** từ người dùng Amazon.
- **Dùng:** bản *5-core rating_only* của hai nhóm *Cell Phones & Accessories* và *Electronics*, cùng file thông tin sản phẩm (cây danh mục). Chi tiết ở phần B của hướng dẫn train.

### 2.14. Google Sheets và Looker Studio: dữ liệu sản phẩm và dashboard

- **Google Sheets:**
  - sheet sản phẩm chuẩn (M1): SKU, tên, giá, thông số, phụ kiện tương thích; là nguồn để import vào Odoo;
  - sheet bộ test chatbot (M1);
  - sheet KPI do Apps Script kéo từ middleware về mỗi giờ (M4).
- **Looker Studio (M4):** dashboard KPI đọc thẳng Google Sheet. Gồm CTR, ROI quảng cáo, tỉ lệ chat ra đơn, giá trị đơn trung bình, độ chính xác và thời gian trả lời của bot, độ trễ xử lý đơn, tỉ lệ nhận lời mời mua kèm.
- **Số liệu đi từ middleware tới dashboard thế nào:**

  ```
  PostgreSQL (view kpi_*) → M3 · KPI cho dashboard (CSV) → ngrok → Apps Script trong Google Sheet → Looker Studio
  ```

  1. Các view `kpi_*` tính sẵn chỉ số theo ngày từ `chat_logs`, `conversations`, `order_status_log`, `processed_events`, `upsell_offers`, `upsell_order_stats` (mục 3.3).
  2. Workflow `M3 · KPI cho dashboard` trả một view dưới dạng CSV khi có mã truy cập đúng.
  3. Trong Google Sheet của M4, một hàm Apps Script chạy mỗi giờ, gọi workflow qua domain ngrok với header `x-kpi-key` và `ngrok-skip-browser-warning` (header thứ hai để vượt trang cảnh báo của ngrok bản miễn phí), rồi ghi mỗi bảng vào một tab. Không dùng hàm `=IMPORTDATA()` vì hàm này không gửi được header.
  4. Looker Studio đọc tab `tong_hop`, ghép với số liệu Ads Manager theo cột `ngay`.

  Máy chủ nhóm tắt thì lần chạy đó báo lỗi và Sheet giữ số cũ; lần sau lấy lại đủ 90 ngày. Hướng dẫn cài đặt: [huong-dan-kpi-dashboard.md](huong-dan-kpi-dashboard.md).

### 2.15. Creatomate và FPT.AI TTS: video tự động

- **Creatomate:** dựng video dọc 30 giây từ template qua API.
- **FPT.AI TTS:** giọng đọc tiếng Việt.
- **Ai làm:** **M4**, workflow `M4 · Video`:
  1. lấy dữ liệu sản phẩm (Odoo, qua n8n);
  2. Gemini viết kịch bản;
  3. FPT.AI đọc;
  4. Creatomate dựng;
  5. lưu vào Drive.

  Người xem lại rồi đăng tay qua TikTok Studio, vì API đăng video khi chưa qua kiểm duyệt chỉ đăng được video riêng tư.
- **Chi phí:** gói dùng thử (50 credit Creatomate; 100.000 ký tự/tháng FPT.AI).

### 2.16. Google Drive và GitHub: lưu trữ và chia sẻ

- **Drive:** ảnh và video sản phẩm, mô hình đã train (`3-middleware-ai/nlu/outputs`, `3-middleware-ai/upsell/outputs`), bản sao của thư mục `backups/`.
- **GitHub:** mã nguồn repo (workflow JSON, SQL, script, hợp đồng dữ liệu, tài liệu). `.gitignore` đã chặn `.env`, `backups/` và mô hình. Repo đã có trên máy trưởng nhóm (nhánh `main`); trước commit đầu tiên đã quét toàn repo để chắc không có giá trị nào trong `.env` lọt vào file. Chưa đẩy lên GitHub vì cần tài khoản của trưởng nhóm; khi đẩy thì để chế độ **Private**.

---

## 3. Middleware chi tiết

### 3.1. Danh sách workflow

| Workflow | Người | Kích hoạt | Làm gì | Gọi tới |
|---|---|---|---|---|
| **M3 · Router** | M3 | Webhook `POST /webhook/tiktok-events` | Cửa vào duy nhất cho TikTok: kiểm chữ ký, trả 200, chống trùng, rẽ nhánh | Chatbot, Tạo đơn, Hủy đơn, Trạng thái đơn, Token, Ghi nhận mua kèm |
| **M3 · Xử lý lỗi** | M3 | Error Trigger | Ghi `failed_jobs`, báo nhóm chat (node đang tắt) | — |
| **M3 · TikTok API** | M3 | Workflow khác gọi | Ký và gọi mọi API TikTok | TikTok Open API |
| **M3 · Token** | M3 | Webhook `GET /webhook/tiktok-oauth`, lịch 3:00, Router | Ủy quyền lần đầu, làm mới token, xử lý hủy ủy quyền | TikTok auth API |
| **M3 · Chatbot** | M3 | Router, Chat thử | Hiểu, tra, mời mua kèm, viết, soát, gửi, ghi log | NLU, Tool sản phẩm, Gemini, Gửi tin TikTok |
| **M3 · Tool sản phẩm (dữ liệu giả)** | M3 | Chatbot gọi | Tra sản phẩm, tìm theo ngân sách, phụ kiện tương thích | (bản thật: Odoo, M2) |
| **M3 · Chat thử** | M3 | Chat Trigger (Open chat) | Khung chat để thử bot như khách | Chatbot |
| **M3 · Gửi tin TikTok** | M3 | Workflow khác gọi | Mở cuộc chat với người mua (nếu cần), gửi tin | TikTok API |
| **M3 · Đặt vận chuyển** | M3 | Webhook `POST /webhook/odoo-picking-done` | Đóng gói xong thì đặt lấy hàng, lấy phiếu, ghi log | TikTok API, M2 · Cập nhật Odoo |
| **M3 · Trạng thái đơn** | M3 | Router | Ghi trạng thái giao, nhắn mã vận đơn, báo hàng hoàn | TikTok API, Gửi tin TikTok, M2 · Cập nhật Odoo |
| **M3 · Ghi nhận mua kèm** | M3 | Router (đơn mới), lịch mỗi giờ | Thưởng/phạt bandit, thống kê đơn | TikTok API |
| **M3 · KPI cho dashboard** | M3 | Webhook `GET /webhook/kpi-dashboard?bang=…` | Kiểm mã truy cập, đọc một view `kpi_*`, trả CSV | PostgreSQL |
| M2 · Tạo đơn | M2 | Router | (giữ chỗ) Tạo Sales Order, ghi `order_status_log` | Odoo |
| M2 · Hủy đơn | M2 | Router | (giữ chỗ) Hủy Sales Order | Odoo |
| M2 · Cập nhật Odoo (vận chuyển) | M2 | M3 gọi | (giữ chỗ) Ghi mã vận đơn, trạng thái vào Odoo | Odoo |
| M2 · Đồng bộ tồn kho | M2 | Lịch 15 phút (đang tắt) + Tạo đơn, Hủy đơn gọi | (giữ chỗ) Đẩy số có thể bán từ Odoo lên TikTok | Odoo, TikTok API |
| TEST · … (4 workflow) | M3 | Webhook | TikTok giả, Gemini giả, gọi chatbot / TikTok API bằng script. **Chỉ publish khi test** | — |

### 3.2. Từng workflow, từng bước

#### M3 · Router (cửa vào duy nhất)
1. **Webhook** nhận `POST /webhook/tiktok-events`, bật *Raw Body* để giữ đúng byte TikTok gửi.
2. **Kiểm chữ ký:** tính `HMAC-SHA256(app_secret, app_key + body gốc)`, so với header `Authorization` bằng phép so sánh chống dò thời gian. Sai thì trả **401**, ghi `failed_jobs` (trạng thái `ignored`) để theo dõi.
3. Đọc `type` thành tên sự kiện; tính `event_id` (`tts_notification_id`, hoặc SHA-256 của body).
4. **Trả 200 ngay** (khoảng 0,15 giây; TikTok chỉ chờ 3 giây rồi gửi lại).
5. **Chống trùng:** `INSERT INTO processed_events ... ON CONFLICT DO NOTHING RETURNING`. Không có dòng trả về nghĩa là bản gửi lại, dừng.
6. **Rẽ nhánh** (Switch), gọi workflow con và **không chờ** nó chạy xong:
   - `NEW_MESSAGE` từ người mua: Chatbot (tin của chính shop bị bỏ qua để bot không tự trả lời mình);
   - `ORDER_STATUS_CHANGE` = `AWAITING_SHIPMENT`: M2 · Tạo đơn **và** M3 · Ghi nhận mua kèm;
   - `ORDER_STATUS_CHANGE` = đã giao cho hãng, hoặc `PACKAGE_UPDATE`: Trạng thái đơn;
   - `CANCELLATION_STATUS_CHANGE`: M2 · Hủy đơn;
   - `UPCOMING_AUTHORIZATION_EXPIRATION`, `SELLER_DEAUTHORIZATION`: Token.

#### M3 · TikTok API (ký request)
- **Vào:** `{method, path, query, body, shop}`. **Ra:** `{ok, http_status, code, message, request_id, data, auth_error}`.
- **Các bước:**
  1. Đọc token mới nhất trong bảng `tokens`.
  2. Thêm `app_key`, `timestamp`, `shop_cipher`.
  3. **Ký:** sắp xếp tham số (trừ `sign`, `access_token`), nối `tên+giá trị`, ghép `path + chuỗi + body`, bọc `secret` hai đầu, HMAC-SHA256.
  4. Gắn header `x-tts-access-token`, gọi API.
  5. Chuẩn hóa kết quả.
- **Hành vi:** không ném lỗi khi API trả lỗi (bên gọi tự quyết định); chỉ ném lỗi khi chưa có token.
- **Đã kiểm:** chữ ký khớp với một bản cài đặt Python viết riêng, kể cả body tiếng Việt và tham số có ký tự đặc biệt.

#### M3 · Token
- **Ủy quyền lần đầu:**
  1. M1 bấm link, TikTok chuyển về `/webhook/tiktok-oauth?code&state`.
  2. Kiểm `state` (chặn link giả).
  3. Đổi `code` lấy access token và refresh token.
  4. Gọi `/authorization/202309/shops` lấy `shop_cipher`.
  5. Lưu bảng `tokens`, hiện trang "Đã kết nối".
- **Làm mới:** mỗi ngày 3:00, nếu token còn dưới 48 giờ; hoặc ngay khi Router báo sắp hết hạn. Làm mới lỗi thì ghi `failed_jobs` "chủ shop cần ủy quyền lại".
- **Shop hủy ủy quyền:** xóa token, ghi `failed_jobs`.

#### M3 · Chatbot (đường đi của một tin nhắn)
1. **Chuẩn bị:** chuẩn hóa dữ liệu vào (`contracts/internal/chatbot_input.json`).
2. **Cập nhật cuộc chat** (`conversations`): lần đầu thì chia ngẫu nhiên nhóm mua kèm, 80% `offer` và 20% `control`. **Nhân viên đang trả lời thì bot im lặng.**
3. Đọc 3 lượt chat gần nhất (ngữ cảnh) và SKU của thẻ sản phẩm (nếu khách gửi thẻ).
4. **Hiểu tin nhắn:** gọi service NLU PhoBERT; chưa có thì dùng quy tắc từ khóa.
5. **Code chọn tool theo ý định**, không để LLM tự chọn:
   - `hoi_gia`: tra sản phẩm;
   - `so_sanh`: tra từng món;
   - `tu_van`: tìm theo ngân sách hoặc phụ kiện hợp máy;
   - `bao_hanh`: tra số tháng bảo hành;
   - `tra_don`: đọc `order_latest_status` (chưa có mã đơn thì xin mã);
   - **`khieu_nai`: chuyển người ngay.**
6. **Tra sản phẩm** qua `M3 · Tool sản phẩm`. Bản thật do M2 làm, đọc Odoo.
7. **Mua kèm** (chỉ nhóm `offer`, khi hỏi giá hoặc tư vấn, và đã tìm được món còn hàng):
   1. Đọc luật `upsell_rules` (luật học từ Amazon, nếu chưa có thì luật mặc định) ra 2 loại nên mời.
   2. Tìm món cụ thể còn hàng, hợp máy khách đang xem.
   3. Đọc `bandit_arms`.
   4. **Thompson sampling** chọn 1 món. Bỏ món đã mời trong 24 giờ qua.
8. **Soạn prompt:** khối `DU_LIEU` gồm sản phẩm, đơn hàng, chính sách shop và món mời kèm; kèm danh sách giá và số lượng **được phép** nói.
9. **Gemini viết câu** (JSON). Không có key hoặc lỗi thì dùng câu mẫu.
10. **Soát giá và số lượng:** quét mọi số tiền (`199.000đ`, `2tr5`, `500k`...) và mọi "còn N cái"; số nào không có trong dữ liệu thì không đạt. SKU nhắc tới cũng phải có trong dữ liệu.
    - Không đạt lần 1: gửi lại Gemini kèm góp ý cụ thể.
    - Không đạt lần 2, hoặc Gemini xin chuyển người: **chuyển người**, câu sai không bao giờ tới khách.
11. **Câu trả lời cuối:** lần đầu nói chuyện thì báo "em là trợ lý tự động của shop".
12. **Gửi:**
    - kênh `tiktok`: qua `M3 · Gửi tin TikTok` (cần Customer Service API);
    - kênh `test`: trả về khung chat thử.
13. **Ghi log** trong **một câu SQL**: `chat_logs` (câu hỏi, ý định, độ tự tin, dữ liệu đã tra, câu trả lời, soát giá, số lần viết lại, chuyển người, món mời, model, độ trễ), cập nhật `conversations` (đã chào, chế độ nhân viên), ghi `upsell_offers` cho món thật sự được mời.

#### M3 · Gửi tin TikTok
- **Vào:** `{conversation_id?, buyer_user_id?, text}`.
- **Các bước:** có `conversation_id` (chatbot trả lời) thì gửi luôn; chỉ có `buyer_user_id` (báo mã vận đơn) thì mở cuộc chat mới rồi gửi. Nội dung theo định dạng TikTok: `{"type": "TEXT", "content": "{\"content\": \"...\"}"}`.
- **Hành vi:** gửi lỗi (vd chưa được cấp quyền) thì trả `ok: false`, không làm hỏng luồng.

#### M3 · Đặt vận chuyển
1. Odoo gọi `POST /webhook/odoo-picking-done?secret=...`. Kiểm mã bí mật (sai thì trả **401**).
2. Chỉ xử lý **phiếu xuất kho** ở trạng thái `done`; phiếu khác thì bỏ qua. Trả 200 ngay.
3. Tìm mã đơn TikTok trong `order_status_log` theo tên Sales Order (M2 ghi lúc tạo đơn). **Đã đặt vận chuyển rồi thì không đặt lại.**
4. Lấy chi tiết đơn. Đơn **không còn** `AWAITING_SHIPMENT` (vd khách đã hủy) thì **dừng và báo lỗi**: không giao hàng cho đơn đã hủy.
5. **Ship Package** (lấy hàng tại shop), rồi lấy **phiếu gửi hàng** (link PDF và mã vận đơn).
6. Ghi `order_status_log` (`shipping_arranged`), rồi gọi `M2 · Cập nhật Odoo (vận chuyển)` để ghi mã vận đơn vào phiếu.
7. Lỗi bất kỳ được ghi `failed_jobs` với lời nhắn "đặt tay trong Seller Center".

#### M3 · Trạng thái đơn
1. Lấy chi tiết đơn từ TikTok, rồi so với trạng thái ghi lần trước; **trùng thì thôi**.
2. Phân nhóm:
   - `dang_giao`: AWAITING_COLLECTION, IN_TRANSIT;
   - `da_giao`: DELIVERED, COMPLETED;
   - `giao_that_bai`: bị hủy sau khi đã giao cho hãng, tức hàng hoàn;
   - `khac`.
3. Ghi `order_status_log` (chatbot đọc để trả lời "đơn tới đâu rồi"), rồi báo M2 cập nhật Odoo.
4. **Lần đầu `dang_giao`:** nhắn mã vận đơn cho khách, đánh dấu `notified`.
5. **`giao_that_bai`:** ghi `failed_jobs` để M2 theo dõi hàng hoàn về kho.

#### M3 · Ghi nhận mua kèm
- **Đơn mới:**
  1. Lấy chi tiết đơn (người mua, các SKU, tổng tiền).
  2. Lượt mời trong 48 giờ có SKU nằm trong đơn thì `reward = 1`, `alpha + 1`.
  3. Ghi `upsell_order_stats` (giá trị đơn, nhóm `offer`/`control`, số món mua kèm).
- **Mỗi giờ:** lượt mời quá 48 giờ mà không mua thì `reward = 0`, `beta + 1`.

#### M3 · KPI cho dashboard
1. Google Sheet của M4 gọi `GET /webhook/kpi-dashboard?bang=<tên bảng>`, mã truy cập đặt trong header `x-kpi-key`.
2. **Kiểm mã:** so với `KPI_SECRET` trong `.env`. Hai bên được băm SHA-256 rồi so bằng `timingSafeEqual`, để thời gian so sánh không lộ mã đúng tới đâu. Sai thì trả **401**.
3. **Chọn view theo danh sách trắng:**

   | `bang` | View |
   |---|---|
   | `tong_hop` | `kpi_tong_hop_ngay` |
   | `chatbot` | `kpi_chatbot_ngay` |
   | `y_dinh` | `kpi_y_dinh_ngay` |
   | `chat_ra_don` | `kpi_chat_ra_don_ngay` |
   | `xu_ly_don` | `kpi_xu_ly_don` |
   | `mua_kem` | `upsell_offer_report` |
   | `ab_mua_kem` | `upsell_report` |

   Tên khác thì trả **400** kèm danh sách tên đúng. Tên view luôn lấy từ bảng trên, không bao giờ từ tham số người gọi, nên không thể chèn SQL qua `bang`.
4. **Đọc view:** mỗi dòng đổi thành JSON bằng `row_to_json` (giữ đúng thứ tự cột, ngày ở dạng `2026-11-06` thay vì bị đổi múi giờ); tên cột lấy từ `information_schema.columns`, nên bảng chưa có dòng nào vẫn có dòng tiêu đề.
5. **Ghép CSV**, ngày mới nhất lên đầu, trả `text/csv; charset=utf-8`.

#### M2 · Đồng bộ tồn kho (giữ chỗ)
- **Kích hoạt:** lịch 15 phút một lần để bắt kịp nhập hàng tay (node đang tắt, M2 bật khi làm xong); và `M2 · Tạo đơn`, `M2 · Hủy đơn` gọi ở bước cuối, không chờ kết quả.
- **Vào:** `{ly_do, seller_skus, tiktok_order_id}`; danh sách SKU trống nghĩa là đồng bộ tất cả. Node *Chuẩn hóa yêu cầu* đã gom hai nguồn kích hoạt về một dạng.
- **M2 làm tiếp:**
  1. đọc `free_qty` trong Odoo theo SKU;
  2. đổi SKU sang mã TikTok qua `sku_map`;
  3. lấy mã kho TikTok một lần rồi nhớ trong static data của workflow;
  4. gọi `M3 · TikTok API` với `POST /product/202309/products/{product_id}/inventory/update`, gom theo sản phẩm, số âm gửi 0.
- **Vì sao không gọi khi đóng gói:** hàng đã được giữ từ lúc xác nhận Sales Order, nên phiếu xuất kho chuyển *Done* không làm đổi số có thể bán.
- **Hợp đồng:** `contracts/internal/ton_kho.md`, kèm 4 phép thử khi làm xong.

#### M3 · Xử lý lỗi
Error Trigger → gom tên workflow, node, mã lần chạy, thông báo lỗi → ghi `failed_jobs` (`open`) → soạn tin → gửi nhóm chat. Node gửi đang tắt, chờ nhóm chọn Discord hoặc Telegram.

### 3.3. Cơ sở dữ liệu middleware

| Bảng | Khóa | Cột chính | Ai ghi | Ai đọc |
|---|---|---|---|---|
| `sku_map` | `seller_sku` | `tiktok_product_id`, `tiktok_sku_id`, `odoo_product_id` | M1 | Tạo đơn, Chatbot (thẻ sản phẩm) |
| `tokens` | `shop_id` | `shop_cipher`, `access_token`, hạn, `refresh_token` | Token | TikTok API |
| `processed_events` | `event_id` | `event_type`, `routed_to`, `payload` (jsonb) | Router | Router (chống trùng), kiểm tra |
| `conversations` | `conversation_id` | `mode` (bot/staff), `upsell_group`, `greeted`, `handoff_reason` | Chatbot | Chatbot, M1 (trực chat) |
| `chat_logs` | `id` | câu hỏi, ý định, độ tự tin, dữ liệu tra, câu trả lời, soát giá, chuyển người, món mời, model, độ trễ | Chatbot | Dashboard (M4), chấm bot |
| `failed_jobs` | `id` | workflow, node, lỗi, `status` (open/ignored/...) | Xử lý lỗi, Router, Trạng thái đơn | Trưởng nhóm |
| `order_status_log` | `id` | mã đơn TikTok, Sales Order, trạng thái, nguồn, mã vận đơn, `detail` | M2 Tạo đơn, Đặt vận chuyển, Trạng thái đơn | Chatbot (view `order_latest_status`), dashboard |
| `upsell_rules` | (A, B, source) | `rank`, `score`, `support`, `source` (mac_dinh/amazon) | notebook mua kèm | Chatbot |
| `bandit_arms` | (context, arm) | `alpha`, `beta` | Ghi nhận mua kèm | Chatbot |
| `upsell_offers` | `id` | cuộc chat, người mua, ngữ cảnh, SKU mời, `reward` | Chatbot, Ghi nhận mua kèm | Báo cáo |
| `upsell_order_stats` | `order_id` | tổng tiền, nhóm offer/control, số món mua kèm | Ghi nhận mua kèm | `upsell_report` |

**View báo cáo:** `order_latest_status` (trạng thái mới nhất mỗi đơn), `upsell_report` (giá trị đơn theo nhóm), `upsell_offer_report` (tỉ lệ nhận lời theo món).

**View KPI** (`init/04-kpi.sql`, ngày tính theo giờ Việt Nam):

| View | Một dòng là | Chỉ số |
|---|---|---|
| `kpi_chatbot_ngay` | một ngày có chat | số tin, số cuộc chat, thời gian trả lời trung bình và p90, tỉ lệ đúng giá, tỉ lệ phải viết lại, tỉ lệ chuyển người |
| `kpi_y_dinh_ngay` | một ngày × một ý định | số tin theo từng ý định |
| `kpi_chat_ra_don_ngay` | ngày bắt đầu cuộc chat | số cuộc chat mới, số cuộc có đơn trong 7 ngày, tỉ lệ chat ra đơn |
| `kpi_xu_ly_don` | một đơn | các mốc nhận đơn, tạo Sales Order, đặt vận chuyển, giao xong; thời gian giữa các mốc |
| `kpi_tong_hop_ngay` | một ngày, 90 ngày gần nhất | gộp các chỉ số trên, cùng số đơn, giá trị đơn trung bình (chung, nhóm được mời, nhóm không mời), số lời mời mua kèm, tỉ lệ nhận lời |

Cách tính các chỉ số chính:
- **Tỉ lệ đúng giá:** phần trăm câu trả lời qua bước soát giá ngay lần đầu.
- **Tỉ lệ chat ra đơn:** cuộc chat mới mà người mua có đơn (`upsell_order_stats`) trong 7 ngày sau đó.
- **Thời gian tạo đơn:** từ lúc Router nhận sự kiện đơn (`processed_events`) tới dòng `odoo_created`. **Thời gian đóng gói:** từ `odoo_created` tới `shipping_arranged`.
- **Hiệu quả mua kèm (A/B):** giá trị đơn trung bình nhóm `offer` so với nhóm `control`.
- Độ chính xác trên bộ 100 câu không nằm trong log; lấy từ kết quả `3-middleware-ai/danh-gia/cham_chatbot.py` và nhập tay vào dashboard.

### 3.4. Hợp đồng dữ liệu (`contracts/`)

| File | Nối giữa |
|---|---|
| `tiktok/webhooks/*.json`, `tiktok/api/*.json` | TikTok ↔ middleware (dữ liệu mẫu; thay bằng bản thật khi có app) |
| `internal/router_event.json`, `chatbot_input.json` | Router ↔ workflow con |
| `internal/tiktok_api.md` | Mọi workflow ↔ `M3 · TikTok API` |
| `internal/tool_san_pham.md` | Chatbot (M3) ↔ dữ liệu sản phẩm Odoo (M2) |
| `internal/van_chuyen.md`, `odoo_picking_done.json` | Odoo (M2) ↔ Đặt vận chuyển / Trạng thái đơn (M3) |
| `internal/ton_kho.md` | Odoo (M2) → TikTok qua `M3 · TikTok API`: khi nào đồng bộ, dữ liệu vào, body cập nhật tồn kho, cách kiểm |

### 3.5. Bảo mật

| Mối đe dọa | Biện pháp |
|---|---|
| Kẻ lạ gửi webhook giả vào link ngrok | Chữ ký HMAC-SHA256 bằng App Secret; sai thì 401 |
| Link ủy quyền giả | Tham số `state` bí mật (`TIKTOK_OAUTH_STATE`) |
| Kẻ lạ gọi giả "Odoo đã đóng gói" | Mã bí mật `ODOO_WEBHOOK_SECRET` trong URL webhook |
| Kẻ lạ đọc số liệu kinh doanh qua link KPI | Mã `KPI_SECRET` trong header (không nằm trong URL nên không lưu vào log); tên bảng chọn theo danh sách trắng |
| Lộ mật khẩu, khóa | Chỉ nằm trong `.env` (không lên GitHub) và Credentials n8n (mã hóa) |
| Lộ database, Odoo ra internet | Postgres chỉ mở `127.0.0.1`; Odoo chỉ vào được qua Tailscale |
| SQL injection từ tin nhắn khách | Mọi câu SQL dùng tham số `$1, $2` |
| Khách lừa bot ("bỏ qua hướng dẫn", "giảm 50%") | Quy tắc trong system prompt; bot chỉ đọc dữ liệu, không có quyền ghi |
| Bot báo sai giá | Soát giá bằng code; sai 2 lần thì chuyển người |
| Gọi API TikTok trái phép | Mọi lệnh gọi ký bằng App Secret, token hết hạn sau 7 ngày |

### 3.6. Độ tin cậy

| Tình huống | Hệ thống xử lý |
|---|---|
| TikTok gửi một sự kiện 2 lần | `processed_events` bỏ bản trùng |
| Xử lý lâu hơn 3 giây | Router trả 200 trước, xử lý sau |
| Lỗi mạng, DB chập chờn | Node tự thử lại 3 lần |
| Vẫn lỗi | `failed_jobs` (hàng đợi lỗi) để người xử lý |
| Gemini hết lượt hoặc lỗi | Câu mẫu từ dữ liệu |
| Service NLU tắt | Quy tắc từ khóa |
| Chưa có Customer Service API | Bot vẫn chạy và ghi log; demo qua khung chat thử |
| Odoo gửi lại webhook đóng gói | Không đặt vận chuyển lần 2 |
| TikTok báo trạng thái cũ | Không ghi trùng, không nhắn khách lần 2 |
| Đơn đã hủy hoặc đã giao mà kho vẫn báo đóng gói | Đặt vận chuyển kiểm trạng thái đơn trên TikTok trước, không đúng `AWAITING_SHIPMENT` thì dừng và ghi lỗi |
| Hỏng ổ đĩa, xóa nhầm dữ liệu | Sao lưu tự động mỗi 24 giờ, giữ 14 ngày; khôi phục bằng một lệnh |
| Sửa workflow làm hỏng luồng mà không biết | Chạy script diễn tập trước mỗi lần ghép và trước demo |

**Sao lưu và khôi phục.**
- **Tự động:** container `backup` (mục 2.4) dump mọi database và filestore Odoo vào `backups/db/<ngày-giờ>/`.
- **Sao lưu ngay**, cuối mỗi buổi làm: `scripts/backup.sh`. Script dump database, rồi xuất toàn bộ workflow ra JSON vào `backups/n8n/<ngày-giờ>/`, gồm cả workflow M2, M4 sửa trong giao diện. Lần chạy thử ngày 05/11 xuất được 20 workflow.
- **Khôi phục:** `scripts/restore.sh <ngày-giờ> <tên database> --yes`. Script tạm dừng n8n và Odoo, chạy `pg_restore --clean`, rồi bật lại. Thiếu `--yes` thì script từ chối chạy, vì lệnh này ghi đè dữ liệu.
- **Đã thử khôi phục:** nạp bản sao lưu database `middleware` vào một database tạm, được đủ 19 bảng và view cùng 21 luật mua kèm, khớp với bản gốc; sau đó xóa database tạm. Không thử trên database thật.
- **Khóa:** database `n8n` chứa credential đã mã hóa bằng `N8N_ENCRYPTION_KEY`. Bản `.env` được giữ riêng trong trình quản lý mật khẩu, không để chung với bản sao lưu.

**Diễn tập cả luồng** (`scripts/dien-tap.sh`, khoảng 3 phút). Script chạy trên chính hệ thống thật, nhưng trỏ n8n vào TikTok giả và Gemini giả:
1. Nạp và publish hai workflow `TEST · TikTok giả`, `TEST · Gemini giả`; khởi động lại n8n với `docker-compose.dien-tap.yml`; chép lại bảng `bandit_arms`; tạo token giả.
2. Gửi lần lượt các webhook có chữ ký như TikTok thật, rồi chờ kết quả trong database. Mỗi bước in `[ĐẠT]` hoặc `[HỎNG]`:

   | Bước | Kiểm |
   |---|---|
   | Khách hỏi giá | Router trả 200; chatbot trả lời, đúng giá, ghi `chat_logs` |
   | Khách đặt đơn | Router trả 200; đơn vào thống kê mua kèm; gửi lại cùng webhook không tạo bản trùng |
   | Kho đóng gói xong | Đặt vận chuyển trả 200 và ghi `shipping_arranged`; sai mã bí mật bị chặn (401) |
   | Hãng vận chuyển cập nhật | Router trả 200; ghi `IN_TRANSIT` kèm mã vận đơn |
   | An toàn và đo lường | Webhook sai chữ ký bị chặn (401); KPI hôm nay có tin nhắn và đơn; không có lỗi mới trong `failed_jobs` |

   Bước Tạo đơn của M2 còn là giữ chỗ, nên script tự ghi dòng `odoo_created` thay cho M2.
3. **Dọn sạch**, kể cả khi bị ngắt giữa chừng: xóa mọi dòng thử, trả `bandit_arms` về như cũ để lần diễn tập không làm lệch việc học của bandit, gỡ publish workflow giả, đưa n8n về cấu hình thật.

TikTok giả có một đơn thử (mã đuôi `344`) mang trạng thái `AWAITING_SHIPMENT` cho tới khi gói hàng được đặt ship, sau đó chuyển sang `IN_TRANSIT`, giống đơn thật. Lần chạy đầu dùng đơn luôn ở `IN_TRANSIT` nên hỏng 2 bước: Đặt vận chuyển từ chối đặt ship cho đơn "đang giao", đúng như chốt an toàn phải làm. **Kết quả ngày 06/11/2026: 13/13 bước đạt**, không có lỗi mới, dữ liệu thử đã được dọn hết.

Không chạy diễn tập khi shop đang có khách thật, vì trong mấy phút đó n8n gọi TikTok giả.

---

## 4. Lớp AI

| Phần | Bài toán | Phương pháp | Đánh giá |
|---|---|---|---|
| NLU ý định | Tin nhắn thuộc 7 loại nào | Fine-tune PhoBERT; baseline TF-IDF + Logistic Regression | Accuracy, **macro-F1**, riêng câu không dấu |
| NLU thông tin | Trích sản phẩm, hãng, loại, ngân sách, màu, dung lượng, mã đơn | Fine-tune PhoBERT gán nhãn BIO; baseline từ điển + regex | Precision/Recall/**F1 theo thực thể** (seqeval) |
| LLM | Viết câu trả lời tự nhiên | Gemini với structured output; **không fine-tune** (giá đổi hằng ngày, shop chưa có hội thoại để train) | Bộ 100 câu của M1: ≥ 90 đúng, 0 sai giá |
| Mua kèm (loại) | Đang mua A thì mời B nào | P(B\|A) làm mượt, học từ Amazon Reviews 2023; baseline phổ biến | **Hit@3, Recall@5** (tách theo thời gian) |
| Mua kèm (món) | Mời món cụ thể nào | Bandit **Thompson sampling** Beta(α, β), học từ khách thật | Tỉ lệ nhận lời mời; giá trị đơn nhóm offer so với control (A/B test) |

Nguyên tắc: **mô hình quyết định *mời gì* và *hiểu gì*; LLM chỉ quyết định *nói thế nào*.** Nhờ vậy đo được từng phần, và LLM không thể mời món hết hàng hay bịa giá. Quy trình train chi tiết: [huong-dan-train-ai.md](huong-dan-train-ai.md).

---

## 5. Hệ thống chạy thế nào: từ video đến lúc khách nhận hàng

| Bước | Diễn ra | Ai/cái gì | Thời gian |
|---|---|---|---|
| 1. Thu hút | Video sản phẩm (dựng tự động, người duyệt) và quảng cáo GMV Max đưa khách vào shop | M4, TikTok | — |
| 2. Hỏi | Khách nhắn "sạc anker 20w còn màu trắng ko shop" | Khách | — |
| 3. Nhận tin | TikTok gửi `NEW_MESSAGE` qua ngrok; Router kiểm chữ ký, trả 200, chống trùng, gọi Chatbot | Router | ~0,2 giây |
| 4. Trả lời | Chatbot hiểu (hỏi giá, SAN_PHAM, MAU) → tra Odoo → mời kèm (vd cáp USB-C) → Gemini viết → soát giá → gửi | Chatbot, NLU, Odoo, Gemini | 1–3 giây |
| 5. Đặt hàng | Khách đặt và thanh toán trong TikTok; TikTok gửi `ORDER_STATUS_CHANGE` (`AWAITING_SHIPMENT`) | Khách, TikTok | — |
| 6. Vào kho | Router gọi M2 · Tạo đơn: đổi SKU qua `sku_map`, tạo và xác nhận Sales Order (giữ hàng), ghi `order_status_log`; đồng bộ tồn kho lên TikTok | M2 | vài giây |
| 7. Ghi nhận mua kèm | Cùng lúc, Ghi nhận mua kèm kiểm khách có mua món đã được mời không, thưởng bandit, thống kê đơn | M3 | vài giây |
| 8. Đóng gói | Người đóng gói mở phiếu xuất kho, quét serial, bấm Validate | Kho | — |
| 9. Đặt giao | Odoo báo n8n → Đặt vận chuyển: Ship Package, lấy phiếu PDF + mã vận đơn → ghi Odoo | M3, M2, TikTok | vài giây |
| 10. Giao hàng | Hãng vận chuyển lấy hàng; TikTok báo `PACKAGE_UPDATE` → Trạng thái đơn ghi log, **nhắn mã vận đơn cho khách** | M3 | vài giây |
| 11. Hỏi đơn | Khách hỏi "đơn tới đâu rồi": chatbot đọc `order_latest_status` | Chatbot | 1–2 giây |
| 12. Nhận hàng | `DELIVERED`/`COMPLETED` được ghi lại; TikTok chuyển tiền (đã trừ phí, thuế) về tài khoản shop | TikTok | — |
| Ngoại lệ | Hủy trước khi giao: M2 · Hủy đơn trả hàng về kho. Hủy sau khi giao cho hãng: báo nhóm theo dõi hàng hoàn. Khiếu nại: chuyển người (M1) | — | — |
| Chạy nền | Token làm mới mỗi ngày; lượt mời quá 48 giờ được đóng mỗi giờ; mọi lỗi vào `failed_jobs`; Google Sheet lấy KPI mỗi giờ cho dashboard; sao lưu mỗi 24 giờ | — | — |

---

## 6. Mô hình kinh doanh của shop về mặt kỹ thuật

### 6.1. Mô hình

- **Loại hình:** bán lẻ **B2C** đồ công nghệ trên **social commerce** (TikTok Shop), shop cá nhân. Kênh bán duy nhất là TikTok Shop; Shopee không phù hợp vì Open API chỉ mở cho Shop Yêu Thích và Mall.
- **Giá trị cho khách:** tìm thấy sản phẩm qua video; được tư vấn tức thì 24/7, đúng giá, đúng tồn kho; giao nhanh, biết đơn đang ở đâu.
- **Giá trị cho shop:** vận hành bằng 4 người mà không cần trực chat 24/7 hay nhập liệu tay; mỗi cuộc chat có cơ hội bán thêm (mua kèm); mọi quyết định có số liệu.

### 6.2. Dòng sản phẩm, dữ liệu và tiền

```
Sản phẩm  : nhập hàng → Odoo (tồn đầu kỳ) → TikTok (đăng sản phẩm, tồn kho đồng bộ) → khách
Dữ liệu   : sheet sản phẩm (M1) → Odoo (nguồn sự thật) → chatbot / video / TikTok
            sự kiện TikTok → n8n → Odoo + PostgreSQL (log) → dashboard
Tiền      : khách trả qua TikTok (ví, thẻ, COD) → TikTok giữ → trừ phí sàn + thuế khấu trừ 1,5%
            → chuyển về tài khoản ngân hàng shop
            Phí quảng cáo GMV Max: trừ vào doanh thu shop (GMV Pay)
```

Shop **không xử lý thẻ hay tiền của khách**. Toàn bộ thanh toán nằm trong TikTok, nên giảm rủi ro bảo mật thanh toán (liên hệ Chương 6: hosted payment, tokenization).

### 6.3. Doanh thu và chi phí

| Doanh thu | Công nghệ tác động |
|---|---|
| Bán hàng | Video + GMV Max (lượt xem → lượt vào shop); chatbot 24/7 (tỉ lệ chat ra đơn) |
| Tăng giá trị đơn | Mua kèm: mô hình + bandit (AOV nhóm offer so với control) |

| Chi phí | Mức | Công nghệ giảm chi phí |
|---|---|---|
| Giá vốn hàng | Theo nhập hàng | — |
| Phí sàn, thuế 1,5% | Theo chính sách TikTok | — |
| Quảng cáo | Ngân sách nhóm đặt | Chỉ bật khi hệ thống trả lời được khách; chỉnh theo ROI mỗi ngày |
| Nhân sự chăm sóc khách | Gần 0 ngoài giờ | Chatbot; chỉ khiếu nại mới cần người |
| Nhập liệu, kho | Thấp | Đơn tự vào Odoo, tự đặt giao |
| Hạ tầng phần mềm | **0đ** | Tự host Docker; Odoo, n8n, PostgreSQL mã nguồn mở; ngrok, Tailscale, Gemini, Colab gói miễn phí |

### 6.4. Công nghệ tác động ở đâu trên phễu bán hàng

| Giai đoạn | Chỉ số (KPI) | Công nghệ | Nguồn số liệu |
|---|---|---|---|
| Biết đến | Lượt xem, CTR | Video tự động, A/B nội dung, GMV Max | TikTok Studio, Ads Manager |
| Quan tâm | Số cuộc chat, thời gian trả lời | Chatbot 24/7 | `chat_logs` (`latency_ms`) |
| Mua | Tỉ lệ chat ra đơn, ROI | Trả lời đúng giá, tồn kho; chuyển người khi cần | `chat_logs`, đơn, Ads Manager |
| Giá trị đơn | AOV, tỉ lệ nhận lời mời | Mua kèm (mô hình + bandit) | `upsell_report`, `upsell_offer_report` |
| Giao hàng | Độ trễ đóng gói → đặt giao → giao | Đặt vận chuyển tự động, báo mã vận đơn | `order_status_log` |
| Hậu mãi | Số khiếu nại, thời gian xử lý | Chuyển người ngay khi khiếu nại; serial để bảo hành | `conversations`, `chat_logs` |

Mục tiêu KPI đặt theo mức trung bình ngành điện tử (CTR 0,64%, ROAS 1,98), không dùng mức trong proposal (CTR 3,2%, ROAS 4,5).

---

## 7. Phân công và các điểm nối giữa thành viên

| Thành viên | Phần | Nền tảng | Nối vào middleware qua |
|---|---|---|---|
| **M1** | Cửa hàng, dữ liệu sản phẩm, trực chat, bộ test | Seller Center, Google Sheets | `sku_map`; bấm link ủy quyền; trực cuộc chat bị chuyển (`conversations.mode = staff`); bộ 100 câu cho `3-middleware-ai/danh-gia/cham_chatbot.py`; tập test NLU |
| **M2** | Kho và đơn hàng | Odoo, n8n | Workflow `M2 ·` nhận sự kiện từ Router; ghi `order_status_log`; webhook Odoo `odoo-picking-done`; `M2 · Tra sản phẩm Odoo` theo `tool_san_pham.md`; `M2 · Cập nhật Odoo (vận chuyển)` theo `van_chuyen.md`; `M2 · Đồng bộ tồn kho` theo `ton_kho.md`; gọi TikTok qua `M3 · TikTok API` |
| **M3** | Hạ tầng, middleware, chatbot, lớp AI, ghép nối | Docker, n8n, PostgreSQL, ngrok, Tailscale, Partner Center, Gemini, Colab, FastAPI | Giữ quy ước, hợp đồng dữ liệu; chủ trì 3 lần ghép |
| **M4** | Nội dung, quảng cáo, đo lường | TikTok Studio, Ads Manager, Creatomate, FPT.AI, Looker Studio | Workflow `M4 · Video`; Google Sheet lấy KPI qua `M3 · KPI cho dashboard` (mã `KPI_SECRET` do trưởng nhóm gửi riêng) |

**Ba lần ghép:**
1. **Chatbot đọc dữ liệu thật** (M1, M2, M3): đổi Tool sản phẩm giả sang `M2 · Tra sản phẩm Odoo`. Đạt khi bot trả đúng giá 5 SKU bất kỳ và qua bộ test 100 câu.
2. **Luồng đơn hàng** (M1, M2, M3): một đơn thật đi từ TikTok qua Router vào Odoo, có nhãn giao hàng, tồn kho TikTok giảm, khách nhận được mã vận đơn.
3. **Khách thật và đo lường** (cả nhóm): M4 đăng video và bật GMV Max, dashboard có số liệu thật, quay được video demo trọn luồng.

---

## 8. Dựng, vận hành, di chuyển

### 8.1. Dựng từ đầu (máy mới)

1. Cài Docker Desktop, Git for Windows (Git Bash), Tailscale.
2. Lấy repo về; `cp .env.example .env`; điền mật khẩu và khóa:
   - `openssl rand -hex 32` cho `N8N_ENCRYPTION_KEY`;
   - `openssl rand -hex 16` cho `ODOO_WEBHOOK_SECRET` và `KPI_SECRET`;
   - `openssl rand -hex 8` cho `TIKTOK_OAUTH_STATE`;
   - token và domain ngrok.
3. `docker compose up -d`. Lần đầu tải image vài phút; PostgreSQL tự chạy `init/*.sql` (database, bảng middleware, bảng mua kèm, view KPI).
4. `scripts/import-n8n.sh`: nạp credential, 16 workflow, publish. Chờ 30 giây.
5. Mở n8n, tạo owner, mời M2, M4. Mở Odoo, M2 tạo database.
6. Kiểm tra nhanh: `scripts/send-test-webhook.sh contracts/tiktok/webhooks/order_status_change.json` trả `HTTP 200`. Kiểm tra đủ: `scripts/dien-tap.sh` ra 13/13 bước đạt.

Máy đã dựng trước ngày 05/11/2026 có database cũ, nên `init/04-kpi.sql` không tự chạy. Chạy tay một lần: `docker compose exec -T db psql -U odoo -d postgres < init/04-kpi.sql`, rồi `docker compose up -d` để thêm container `backup` và biến `KPI_SECRET`, và `scripts/import-n8n.sh` để nạp 2 workflow mới.

### 8.2. Vận hành hằng ngày

| Việc | Lệnh / nơi xem |
|---|---|
| Hệ thống có chạy không | `docker compose ps` (`db`, `odoo`, `n8n`, `ngrok`, `backup` đều `running`; thêm `nlu` khi bật profile) |
| Docker không lên (lỗi socket) | `powershell -ExecutionPolicy Bypass -File scripts\fix-docker-desktop.ps1` |
| Lỗi chưa xử lý | `select * from failed_jobs where status = 'open';` |
| Xem log n8n | `docker compose logs -f n8n` |
| Xem request TikTok gửi vào | `http://localhost:4040` (ngrok) |
| Sao lưu tự động có chạy không | `docker compose logs backup` (dòng "sao lưu xong") và `ls backups/db` |
| Sao lưu cuối buổi | `scripts/backup.sh` |
| Khôi phục một database | `scripts/restore.sh <ngày-giờ> <database> --yes` |
| Trước buổi ghép, trước demo | `scripts/dien-tap.sh` (13/13 bước đạt) |
| Xem KPI hôm nay | `select * from kpi_tong_hop_ngay order by ngay desc limit 1;` |
| Thử bot | n8n → `M3 · Chat thử` → Open chat |

### 8.3. Di chuyển sang máy khác hoặc máy chủ đám mây

Hệ thống đóng gói hoàn toàn bằng Docker, nên di chuyển gồm 5 bước:

1. **Sao lưu ở máy cũ:**
   - `scripts/backup.sh` đã có bản dump từng database trong `backups/db/`; muốn một file duy nhất thì dùng `docker compose exec db pg_dumpall -U odoo > backups/all.sql` (cả 3 database);
   - sao lưu thư mục dữ liệu Odoo (ảnh, tệp đính kèm), chạy trong Git Bash: `MSYS_NO_PATHCONV=1 docker run --rm -v cntttmdt_odoo-data:/d -v "$(pwd -W)/backups:/b" alpine tar czf /b/odoo-data.tgz -C /d .`;
   - giữ lại file **`.env`**, đặc biệt **`N8N_ENCRYPTION_KEY`** (mất khóa này thì mọi Credentials n8n không đọc được).
2. **Máy mới:** cài Docker, chép repo, `.env`, thư mục `backups/`.
3. **Khôi phục:**
   - `docker compose up -d db`, rồi `docker compose exec -T db psql -U odoo -d postgres < backups/all.sql`;
   - giải nén `odoo-data.tgz` vào volume `odoo-data`;
   - `docker compose up -d`.
4. **Mạng:**
   - ngrok dùng cùng domain tĩnh (chỉ một nơi chạy cùng lúc, nên tắt máy cũ trước);
   - Tailscale: đăng nhập máy mới, gửi IP mới cho nhóm;
   - đường dẫn webhook không đổi nên Partner Center **không phải khai lại**.
5. **Kiểm tra** như mục 8.1, bước 6 (chạy cả `scripts/dien-tap.sh`).

Lên máy chủ đám mây (VPS Linux) làm y hệt. Khi đó có thể thay ngrok bằng tên miền riêng có HTTPS, và máy chủ không phụ thuộc laptop phải luôn bật.

### 8.4. Nâng cấp phiên bản

- **n8n:** ghi cố định `N8N_VERSION` khi ổn định. Muốn nâng cấp: sao lưu, đổi phiên bản, `docker compose up -d n8n`, chạy lại các test.
- **Odoo:** giữ bản 19 trong suốt môn học. Odoo 20 bỏ XML-RPC và JSON-RPC, nên phải đổi cách gọi API nếu nâng cấp.
- **Mô hình AI:** train lại trên Colab, tải `outputs/` mới về, rồi `docker compose restart nlu`. Luật mua kèm mới thì nạp lại `upsell_rules.sql`.

---

## 9. Hiện trạng (cập nhật 06/11/2026)

**Đã chạy được và đã test bằng dữ liệu giả:**
- hạ tầng 6 container, 11 bảng, 8 view;
- Router, Xử lý lỗi, TikTok API, Token;
- Chatbot (gồm mua kèm, gửi TikTok), Gửi tin TikTok;
- Đặt vận chuyển, Trạng thái đơn, Ghi nhận mua kèm;
- KPI cho dashboard: trả CSV đúng thứ tự cột; sai mã trả 401, sai tên bảng trả 400;
- sao lưu tự động, sao lưu ngay, khôi phục (đã thử vào database tạm);
- diễn tập cả luồng: 13/13 bước đạt;
- giữ chỗ và hợp đồng Đồng bộ tồn kho cho M2;
- service NLU;
- notebook train NLU và mua kèm;
- script chấm chatbot;
- repo Git trên máy trưởng nhóm (nhánh `main`), đã quét không lộ khóa.

**Chờ để chạy thật:**

| Việc | Chờ ai |
|---|---|
| App TikTok, Customer Service API, ủy quyền, đối chiếu chữ ký và tên API | Shop được duyệt (M1) |
| Database Odoo, 4 workflow `M2 ·`, `M2 · Tra sản phẩm Odoo`, webhook đóng gói | M2 |
| Tài khoản owner n8n (chưa tạo) và mời M2, M4 | M3 |
| Token và domain ngrok (container `ngrok` đang tắt vì chưa có token), Tailscale, key Gemini | M3 (tài khoản cá nhân) |
| Đẩy repo lên GitHub ở chế độ riêng tư | M3 |
| Gửi riêng `ODOO_WEBHOOK_SECRET` cho M2, `KPI_SECRET` cho M4 | M3 |
| Train NLU và mua kèm trên Colab (chưa có mô hình thật) | M3 |
| Bộ 100 câu test chatbot, tập test NLU | M1 |
| Google Form thu câu thật; Google Sheet + Apps Script + Looker Studio | M4 |
| Kênh nhóm chat nhận báo lỗi | Cả nhóm chọn |
