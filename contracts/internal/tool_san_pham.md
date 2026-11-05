# Hợp đồng: tool tra sản phẩm cho chatbot

Chatbot (M3) không đọc Odoo trực tiếp. Nó gọi **một workflow con** với danh sách yêu cầu tra cứu, và nhận lại kết quả theo đúng dạng dưới đây.

| Bản | Workflow | Người làm | Dữ liệu |
|---|---|---|---|
| Giả (đang dùng) | `M3 · Tool sản phẩm (dữ liệu giả)` | M3 | Danh mục mẫu trong `nlu/data/catalog.csv`, tồn kho bịa |
| Thật | `M2 · Tra sản phẩm Odoo` | **M2** | Odoo: `product.product`, `stock.quant` |

Khi bản thật chạy đúng hợp đồng, chỉ cần đổi workflow mà Chatbot gọi (node *Gọi tool sản phẩm*); phần còn lại của Chatbot giữ nguyên. Đây là lần ghép số 1 trong tài liệu phân công (M1, M2, M3).

## Dữ liệu vào

```json
{
  "calls": [
    { "tool": "tra_san_pham", "args": { "query": "sạc anker 20w", "color": "trắng" } },
    { "tool": "tim_theo_ngan_sach", "args": { "category": "tai nghe", "budget_max": 1000000, "brand": null, "limit": 3 } },
    { "tool": "phu_kien_tuong_thich", "args": { "sku": "DT-IP15-128", "device": null, "category": null, "limit": 3 } }
  ]
}
```

| Tool | Tham số | Ý nghĩa |
|---|---|---|
| `tra_san_pham` | `query` (chữ khách gõ hoặc SKU), `color` (có thể null) | Tìm tối đa 3 sản phẩm khớp tên, tên gọi tắt hoặc SKU |
| `tim_theo_ngan_sach` | `category`, `budget_min`, `budget_max`, `brand` (đều có thể null), `limit` | Sản phẩm còn hàng trong khoảng giá, giá cao nhất trước |
| `phu_kien_tuong_thich` | `sku` hoặc `device` (vd "iphone 15"), `category` (có thể null), `limit` | Phụ kiện dùng được cho máy đó |

Chatbot gửi chữ khách gõ gần như nguyên văn vào `query`, có thể không dấu hoặc viết tắt. Bên tra cứu tự so khớp mềm: bỏ dấu, chữ thường, so với tên và tên gọi tắt.

## Dữ liệu ra

Luôn trả **đúng một item**, kể cả khi `calls` rỗng hoặc không tìm thấy gì:

```json
{
  "results": [
    {
      "tool": "tra_san_pham",
      "args": { "query": "sạc anker 20w", "color": "trắng" },
      "ok": true,
      "products": [
        {
          "sku": "PK-SAC-ANKER20W-TRANG",
          "name": "Củ sạc Anker 20W",
          "brand": "Anker",
          "category": "củ sạc",
          "price": 199000,
          "stock": 14,
          "colors": [ { "color": "trắng", "stock": 9 }, { "color": "đen", "stock": 5 } ],
          "warranty_months": 18,
          "specs": "Sạc nhanh PD 20W, cổng USB-C",
          "compatible": ["iphone 15", "iphone 16", "samsung", "xiaomi"]
        }
      ],
      "error": null
    }
  ],
  "source": "gia"
}
```

Quy tắc:

- `price` là **số nguyên VND**, đúng giá bán hiện tại trong Odoo. Bước soát giá của chatbot so từng con số trong câu trả lời với các giá trị này.
- `stock` là số còn bán được: tồn trừ hàng đã giữ cho đơn. `colors[].stock` theo từng màu nếu có biến thể màu, không có thì để mảng rỗng.
- Sản phẩm không có hoặc ngừng bán: không trả về. Hết hàng: vẫn trả về với `stock: 0` để bot báo "tạm hết".
- Lỗi khi tra (Odoo không trả lời...): `ok: false`, `error` ghi lý do, `products: []`. Chatbot sẽ xin lỗi khách thay vì đoán.
- `source`: `"gia"` cho bản giả, `"odoo"` cho bản thật (ghi vào log để biết bot đang dùng dữ liệu nào).
