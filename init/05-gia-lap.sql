-- Đơn giả lập khi chưa có shop thật: form giả lập ghi vào đây, TikTok giả đọc ra như đơn thật.

\connect middleware

CREATE TABLE IF NOT EXISTS gia_lap_don (
  order_id         text PRIMARY KEY,
  buyer_user_id    text NOT NULL DEFAULT 'gia-lap-khach',
  status           text NOT NULL,
  line_items       jsonb NOT NULL,
  total_amount     numeric NOT NULL DEFAULT 0,
  tracking_number  text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
