-- Lớp AI mua kèm (upsell): luật học từ Amazon, bandit Thompson sampling, đo hiệu quả.

\connect middleware

CREATE TABLE IF NOT EXISTS upsell_rules (
  anchor_category  text NOT NULL,
  rec_category     text NOT NULL,
  rank             smallint NOT NULL,
  score            real,
  support          integer,
  source           text NOT NULL DEFAULT 'mac_dinh' CHECK (source IN ('mac_dinh', 'amazon')),
  PRIMARY KEY (anchor_category, rec_category, source)
);

INSERT INTO upsell_rules (anchor_category, rec_category, rank, source) VALUES
  ('laptop', 'chuột', 1, 'mac_dinh'), ('laptop', 'tai nghe', 2, 'mac_dinh'), ('laptop', 'hub', 3, 'mac_dinh'),
  ('bàn phím', 'chuột', 1, 'mac_dinh'), ('bàn phím', 'lót chuột', 2, 'mac_dinh'),
  ('chuột', 'lót chuột', 1, 'mac_dinh'), ('chuột', 'bàn phím', 2, 'mac_dinh'),
  ('tai nghe', 'micro', 1, 'mac_dinh'), ('tai nghe', 'webcam', 2, 'mac_dinh'),
  ('màn hình', 'hub', 1, 'mac_dinh'), ('màn hình', 'bàn phím', 2, 'mac_dinh'), ('màn hình', 'chuột', 3, 'mac_dinh'),
  ('ssd', 'hub', 1, 'mac_dinh'), ('ssd', 'chuột', 2, 'mac_dinh'),
  ('hub', 'màn hình', 1, 'mac_dinh'), ('hub', 'ssd', 2, 'mac_dinh'),
  ('micro', 'webcam', 1, 'mac_dinh'), ('micro', 'tai nghe', 2, 'mac_dinh'),
  ('webcam', 'micro', 1, 'mac_dinh'), ('webcam', 'tai nghe', 2, 'mac_dinh'),
  ('lót chuột', 'chuột', 1, 'mac_dinh'), ('lót chuột', 'bàn phím', 2, 'mac_dinh')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS bandit_arms (
  context     text NOT NULL,
  arm         text NOT NULL,
  alpha       real NOT NULL DEFAULT 1,
  beta        real NOT NULL DEFAULT 1,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (context, arm)
);

CREATE TABLE IF NOT EXISTS upsell_offers (
  id               bigserial PRIMARY KEY,
  conversation_id  text NOT NULL,
  buyer_user_id    text,
  context          text NOT NULL,
  arm_sku          text NOT NULL,
  arm_category     text,
  offered_at       timestamptz NOT NULL DEFAULT now(),
  resolved         boolean NOT NULL DEFAULT false,
  reward           smallint,
  resolved_at      timestamptz,
  order_id         text
);
CREATE INDEX IF NOT EXISTS upsell_offers_open_idx ON upsell_offers (buyer_user_id, offered_at) WHERE NOT resolved;

CREATE TABLE IF NOT EXISTS upsell_order_stats (
  order_id        text PRIMARY KEY,
  buyer_user_id   text,
  total_amount    numeric,
  upsell_group    text,
  accepted_count  integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE VIEW upsell_report AS
SELECT
  COALESCE(upsell_group, 'khong_chat') AS nhom,
  count(*)                                AS so_don,
  round(avg(total_amount))                AS gia_tri_don_tb,
  count(*) FILTER (WHERE accepted_count > 0) AS don_co_mua_kem
FROM upsell_order_stats
GROUP BY 1;

CREATE OR REPLACE VIEW upsell_offer_report AS
SELECT
  context AS dang_mua, arm_sku AS moi_mua,
  count(*)                                   AS so_lan_moi,
  count(*) FILTER (WHERE reward = 1)         AS so_lan_mua,
  round(100.0 * count(*) FILTER (WHERE reward = 1) / NULLIF(count(*) FILTER (WHERE resolved), 0), 1) AS ti_le_nhan_loi_moi
FROM upsell_offers
GROUP BY 1, 2;
