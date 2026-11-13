-- Số tồn có thể bán đọc từ Odoo (M2 · Đồng bộ tồn kho ghi); tool sản phẩm dùng số này thay cho tồn giả lập.

\connect middleware

CREATE TABLE IF NOT EXISTS ton_kho_odoo (
  seller_sku     text PRIMARY KEY,
  free_qty       numeric NOT NULL,
  qty_available  numeric,
  cap_nhat_luc   timestamptz NOT NULL DEFAULT now()
);
