-- Các bảng middleware dùng chung giữa các workflow n8n.

\connect middleware

SET timezone = 'Asia/Ho_Chi_Minh';

-- Cập nhật cột updated_at mỗi lần sửa dòng
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE sku_map (
  seller_sku         text PRIMARY KEY,
  tiktok_product_id  text NOT NULL,
  tiktok_sku_id      text NOT NULL UNIQUE,
  odoo_product_id    integer,
  product_name       text,
  is_active          boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sku_map_product_idx ON sku_map (tiktok_product_id);
CREATE TRIGGER sku_map_updated BEFORE UPDATE ON sku_map
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE tokens (
  shop_id                   text PRIMARY KEY,
  shop_cipher               text NOT NULL,
  shop_name                 text,
  seller_base_region        text,
  access_token              text NOT NULL,
  access_token_expires_at   timestamptz NOT NULL,
  refresh_token             text NOT NULL,
  refresh_token_expires_at  timestamptz NOT NULL,
  granted_scopes            text[],
  updated_at                timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER tokens_updated BEFORE UPDATE ON tokens
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE processed_events (
  event_id     text PRIMARY KEY,
  event_type   text NOT NULL,
  type_code    integer,
  shop_id      text,
  order_id     text,
  routed_to    text,
  payload      jsonb NOT NULL,
  received_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX processed_events_type_time_idx ON processed_events (event_type, received_at DESC);
CREATE INDEX processed_events_order_idx ON processed_events (order_id) WHERE order_id IS NOT NULL;

CREATE TABLE conversations (
  conversation_id  text PRIMARY KEY,
  buyer_user_id    text,
  mode             text NOT NULL DEFAULT 'bot' CHECK (mode IN ('bot', 'staff')),
  handoff_reason   text,
  handoff_at       timestamptz,
  upsell_group     text CHECK (upsell_group IN ('offer', 'control')),
  greeted          boolean NOT NULL DEFAULT false,
  last_message_at  timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX conversations_mode_idx ON conversations (mode) WHERE mode = 'staff';
CREATE TRIGGER conversations_updated BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE chat_logs (
  id                  bigserial PRIMARY KEY,
  conversation_id     text NOT NULL,
  message_id          text,
  buyer_message       text NOT NULL,
  intent              text,
  intent_confidence   real,
  skus_referenced     text[],
  tool_results        jsonb,
  bot_reply           text,
  price_check_passed  boolean,
  rewrite_count       smallint NOT NULL DEFAULT 0,
  handed_off          boolean NOT NULL DEFAULT false,
  upsell_skus         text[],
  model               text,
  latency_ms          integer,
  received_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chat_logs_conv_time_idx ON chat_logs (conversation_id, created_at);
CREATE INDEX chat_logs_time_idx ON chat_logs (created_at);

CREATE TABLE failed_jobs (
  id             bigserial PRIMARY KEY,
  workflow_name  text NOT NULL,
  node_name      text,
  execution_id   text,
  error_message  text,
  payload        jsonb,
  status         text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'retried', 'resolved', 'ignored')),
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  resolved_at    timestamptz
);
CREATE INDEX failed_jobs_open_idx ON failed_jobs (created_at) WHERE status = 'open';

CREATE TABLE order_status_log (
  id                bigserial PRIMARY KEY,
  tiktok_order_id   text NOT NULL,
  odoo_sale_order   text,
  status            text NOT NULL,
  source            text NOT NULL CHECK (source IN ('tiktok', 'odoo', 'n8n')),
  tracking_number   text,
  detail            jsonb,
  changed_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_status_log_order_idx ON order_status_log (tiktok_order_id, changed_at DESC);

CREATE VIEW order_latest_status AS
SELECT DISTINCT ON (tiktok_order_id) *
FROM order_status_log
ORDER BY tiktok_order_id, changed_at DESC;
