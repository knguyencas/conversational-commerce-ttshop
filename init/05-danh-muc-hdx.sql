-- Đổi luật mua kèm mặc định sang danh mục HDX Tech; máy dựng trước ngày 13/11/2026 chạy tay một lần.

\connect middleware

DELETE FROM upsell_rules WHERE source = 'mac_dinh';
DELETE FROM bandit_arms;

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
