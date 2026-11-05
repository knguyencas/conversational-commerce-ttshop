-- Số liệu KPI theo ngày cho dashboard của M4, đọc qua workflow M3 · KPI cho dashboard.

\connect middleware

CREATE OR REPLACE VIEW kpi_chatbot_ngay AS
SELECT
  (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS ngay,
  count(*) AS so_tin,
  count(DISTINCT conversation_id) AS so_cuoc_chat,
  round(avg(latency_ms)) AS tg_tra_loi_tb_ms,
  round((percentile_cont(0.9) WITHIN GROUP (ORDER BY latency_ms))::numeric) AS tg_tra_loi_p90_ms,
  round(100.0 * count(*) FILTER (WHERE price_check_passed)
        / NULLIF(count(*) FILTER (WHERE price_check_passed IS NOT NULL), 0), 1) AS ti_le_dung_gia,
  round(100.0 * count(*) FILTER (WHERE rewrite_count > 0) / count(*), 1) AS ti_le_viet_lai,
  round(100.0 * count(*) FILTER (WHERE handed_off) / count(*), 1) AS ti_le_chuyen_nguoi
FROM chat_logs
GROUP BY 1;

CREATE OR REPLACE VIEW kpi_y_dinh_ngay AS
SELECT
  (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS ngay,
  COALESCE(intent, 'khong_ro') AS y_dinh,
  count(*) AS so_tin
FROM chat_logs
GROUP BY 1, 2;

CREATE OR REPLACE VIEW kpi_chat_ra_don_ngay AS
WITH c AS (
  SELECT conv.created_at,
         EXISTS (SELECT 1 FROM upsell_order_stats o
                  WHERE o.buyer_user_id = conv.buyer_user_id
                    AND o.created_at BETWEEN conv.created_at AND conv.created_at + interval '7 days') AS co_don
  FROM conversations conv
)
SELECT
  (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS ngay,
  count(*) AS so_cuoc_chat_moi,
  count(*) FILTER (WHERE co_don) AS co_don_trong_7_ngay,
  round(100.0 * count(*) FILTER (WHERE co_don) / count(*), 1) AS ti_le_chat_ra_don
FROM c
GROUP BY 1;

CREATE OR REPLACE VIEW kpi_xu_ly_don AS
WITH moc AS (
  SELECT tiktok_order_id,
         min(changed_at) FILTER (WHERE status = 'odoo_created') AS tao_don_luc,
         min(changed_at) FILTER (WHERE status = 'shipping_arranged') AS dat_ship_luc,
         min(changed_at) FILTER (WHERE status IN ('DELIVERED', 'COMPLETED')) AS giao_xong_luc
  FROM order_status_log
  GROUP BY 1
), nhan AS (
  SELECT order_id, min(received_at) AS nhan_luc
  FROM processed_events
  WHERE order_id IS NOT NULL
  GROUP BY 1
)
SELECT
  m.tiktok_order_id,
  n.nhan_luc,
  m.tao_don_luc,
  m.dat_ship_luc,
  m.giao_xong_luc,
  round(extract(epoch FROM m.tao_don_luc - n.nhan_luc)::numeric, 1) AS tao_don_sau_giay,
  round(extract(epoch FROM m.dat_ship_luc - m.tao_don_luc)::numeric / 3600, 2) AS dong_goi_sau_gio,
  round(extract(epoch FROM m.giao_xong_luc - m.dat_ship_luc)::numeric / 3600, 1) AS giao_sau_gio
FROM moc m
LEFT JOIN nhan n ON n.order_id = m.tiktok_order_id;

CREATE OR REPLACE VIEW kpi_tong_hop_ngay AS
WITH ngay AS (
  SELECT d::date AS ngay
  FROM generate_series((now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date - 89,
                       (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, interval '1 day') d
), don AS (
  SELECT (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS ngay,
         count(*) AS so_don,
         round(avg(total_amount)) AS gia_tri_don_tb,
         round(avg(total_amount) FILTER (WHERE upsell_group = 'offer')) AS gia_tri_don_tb_co_moi,
         round(avg(total_amount) FILTER (WHERE upsell_group = 'control')) AS gia_tri_don_tb_khong_moi
  FROM upsell_order_stats
  GROUP BY 1
), moi AS (
  SELECT (offered_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS ngay,
         count(*) AS so_loi_moi_mua_kem,
         round(100.0 * count(*) FILTER (WHERE reward = 1)
               / NULLIF(count(*) FILTER (WHERE resolved), 0), 1) AS ti_le_nhan_loi_moi
  FROM upsell_offers
  GROUP BY 1
), xl AS (
  SELECT (tao_don_luc AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS ngay,
         round(avg(tao_don_sau_giay), 1) AS tao_don_tb_giay,
         round(avg(dong_goi_sau_gio), 2) AS dong_goi_tb_gio
  FROM kpi_xu_ly_don
  WHERE tao_don_luc IS NOT NULL
  GROUP BY 1
)
SELECT
  ngay.ngay,
  COALESCE(cb.so_tin, 0) AS so_tin,
  COALESCE(cb.so_cuoc_chat, 0) AS so_cuoc_chat,
  cb.tg_tra_loi_tb_ms,
  cb.ti_le_dung_gia,
  cb.ti_le_chuyen_nguoi,
  COALESCE(cd.so_cuoc_chat_moi, 0) AS so_cuoc_chat_moi,
  cd.ti_le_chat_ra_don,
  COALESCE(don.so_don, 0) AS so_don,
  don.gia_tri_don_tb,
  don.gia_tri_don_tb_co_moi,
  don.gia_tri_don_tb_khong_moi,
  xl.tao_don_tb_giay,
  xl.dong_goi_tb_gio,
  COALESCE(moi.so_loi_moi_mua_kem, 0) AS so_loi_moi_mua_kem,
  moi.ti_le_nhan_loi_moi
FROM ngay
LEFT JOIN kpi_chatbot_ngay cb ON cb.ngay = ngay.ngay
LEFT JOIN kpi_chat_ra_don_ngay cd ON cd.ngay = ngay.ngay
LEFT JOIN don ON don.ngay = ngay.ngay
LEFT JOIN moi ON moi.ngay = ngay.ngay
LEFT JOIN xl ON xl.ngay = ngay.ngay;
