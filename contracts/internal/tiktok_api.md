# Hợp đồng: gọi TikTok Shop API qua workflow `M3 · TikTok API`

Mọi lệnh gọi TikTok Shop Open API (lấy chi tiết đơn, cập nhật tồn kho, giao hàng, gửi tin nhắn...) đi qua **một** workflow con. Không ai tự ký request hay tự đọc token.

Trong n8n: thêm node **Execute Workflow**, chọn `M3 · TikTok API`, bật *Wait for sub-workflow*, đưa vào một item dạng dưới đây.

## Dữ liệu vào

```json
{
  "method": "GET",
  "path": "/order/202309/orders",
  "query": { "ids": "579123456789012345" },
  "body": null,
  "shop": true
}
```

| Trường | Bắt buộc | Ý nghĩa |
|---|---|---|
| `method` | có | `GET`, `POST`, `PUT`, `DELETE` |
| `path` | có | Đường dẫn API, có phiên bản, bắt đầu bằng `/` (vd `/product/202309/inventory/update`) |
| `query` | không | Tham số riêng của API. **Không** tự thêm `app_key`, `timestamp`, `sign`, `shop_cipher` |
| `body` | không | Object JSON cho `POST`/`PUT`; `null` nếu không có |
| `shop` | không | Mặc định `true`: tự thêm `shop_cipher`. Đặt `false` cho API không theo shop (vd lấy danh sách shop) |

Workflow tự làm:
1. Đọc token mới nhất trong bảng `tokens`.
2. Thêm `app_key`, `timestamp`, `shop_cipher`.
3. Tính chữ ký `sign`.
4. Gắn header `x-tts-access-token`.
5. Gọi API.

## Dữ liệu ra (luôn một item)

```json
{
  "ok": true,
  "http_status": 200,
  "code": 0,
  "message": "Success",
  "request_id": "2026102610000301234567890ABCDEF",
  "data": { "orders": [] },
  "auth_error": false
}
```

- `ok` = `true` khi HTTP 2xx **và** `code` = 0.
- `auth_error` = `true` khi token sai hoặc hết hạn. Báo trưởng nhóm; thường do chủ shop cần ủy quyền lại.
- Workflow **không tự ném lỗi** khi `ok` = `false`, để bên gọi tự quyết định (thử lại, bỏ qua, ghi `failed_jobs`). Muốn Retry On Fail chạy, hãy đặt một node IF sau đó và cho nhánh lỗi dừng bằng *Stop and Error*.
- Chưa có token (chủ shop chưa ủy quyền) thì workflow **ném lỗi** `Chưa có token TikTok`, và lỗi này được ghi vào `failed_jobs`.

## Cách ký (TikTok Shop API bản 202309)

1. Lấy mọi tham số query **trừ** `sign` và `access_token`, sắp xếp theo tên.
2. Nối thành chuỗi `tên1giá_trị1tên2giá_trị2...`.
3. Ghép: `path` + chuỗi trên + body JSON (nếu có, và không phải multipart).
4. Bọc: `app_secret` + chuỗi + `app_secret`.
5. `sign` = HMAC-SHA256(khóa = `app_secret`, chuỗi bọc), dạng hex chữ thường.

> Cách ký này viết theo tài liệu TikTok Shop Partner Center mà nhóm biết. **Cần đối chiếu lại khi có app thật**: gọi thử `/authorization/202309/shops`, nếu TikTok báo sai chữ ký thì sửa hàm `sign` trong node *Ký và gọi TikTok*.
