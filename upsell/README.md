# Mô hình mua kèm (upsell)

Học "đang mua loại hàng A thì hay mua kèm loại B" từ Amazon Reviews 2023, để chatbot mời mua kèm. Hướng dẫn đầy đủ ở [docs/huong-dan-train-ai.md](../docs/huong-dan-train-ai.md), phần B và C.

| File | Là gì |
|---|---|
| `category_map.py` | Gán sản phẩm Amazon vào 11 loại hàng của shop theo cây danh mục. Tự kiểm: `python upsell/category_map.py` |
| `upsell_lib.py` | Đọc dữ liệu, đếm cặp mua cùng nhau, mô hình P(B\|A) và baseline, Hit@3/Recall@5, xuất SQL |
| `train_upsell.ipynb` | Notebook chạy trên Colab (CPU), khoảng 20–40 phút |
| `outputs/` | Kết quả: `upsell_rules.sql` (nạp vào hệ thống), `upsell_rules.csv`, `metrics.json`, hình. Không đưa lên GitHub |

Nạp luật vào hệ thống:

```bash
docker compose exec -T db psql -U odoo -d middleware < upsell/outputs/upsell_rules.sql
```

Phần chọn **món cụ thể** (bandit Thompson sampling) và tự học từ khách thật nằm trong n8n: `M3 · Chatbot` (chọn món) và `M3 · Ghi nhận mua kèm` (thưởng/phạt). Bảng dữ liệu ở `init/03-upsell.sql`.
