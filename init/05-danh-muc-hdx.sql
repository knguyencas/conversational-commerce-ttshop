-- Luật mua kèm mặc định cho danh mục HDX Tech 17 loại (thêm 7 loại phụ kiện); máy đã nạp bản cũ chạy tay lại một lần.

\connect middleware

DELETE FROM upsell_rules WHERE source = 'mac_dinh';
DELETE FROM bandit_arms;

INSERT INTO upsell_rules (anchor_category, rec_category, rank, source) VALUES
  ('laptop', 'balo laptop', 1, 'mac_dinh'), ('laptop', 'chuột', 2, 'mac_dinh'), ('laptop', 'sạc laptop', 3, 'mac_dinh'),
  ('bàn phím', 'chuột', 1, 'mac_dinh'), ('bàn phím', 'kê tay', 2, 'mac_dinh'), ('bàn phím', 'lót chuột', 3, 'mac_dinh'),
  ('chuột', 'lót chuột', 1, 'mac_dinh'), ('chuột', 'bàn phím', 2, 'mac_dinh'),
  ('tai nghe', 'micro', 1, 'mac_dinh'), ('tai nghe', 'webcam', 2, 'mac_dinh'),
  ('màn hình', 'cáp màn hình', 1, 'mac_dinh'), ('màn hình', 'giá treo màn hình', 2, 'mac_dinh'), ('màn hình', 'hub', 3, 'mac_dinh'),
  ('ssd', 'hub', 1, 'mac_dinh'), ('ssd', 'chuột', 2, 'mac_dinh'),
  ('hub', 'màn hình', 1, 'mac_dinh'), ('hub', 'cáp màn hình', 2, 'mac_dinh'), ('hub', 'ssd', 3, 'mac_dinh'),
  ('micro', 'webcam', 1, 'mac_dinh'), ('micro', 'tai nghe', 2, 'mac_dinh'),
  ('webcam', 'micro', 1, 'mac_dinh'), ('webcam', 'tai nghe', 2, 'mac_dinh'),
  ('lót chuột', 'chuột', 1, 'mac_dinh'), ('lót chuột', 'bàn phím', 2, 'mac_dinh'),
  ('balo laptop', 'chuột', 1, 'mac_dinh'), ('balo laptop', 'sạc laptop', 2, 'mac_dinh'),
  ('túi chống sốc', 'sạc laptop', 1, 'mac_dinh'), ('túi chống sốc', 'chuột', 2, 'mac_dinh'),
  ('đế tản nhiệt', 'chuột', 1, 'mac_dinh'), ('đế tản nhiệt', 'lót chuột', 2, 'mac_dinh'),
  ('sạc laptop', 'balo laptop', 1, 'mac_dinh'), ('sạc laptop', 'hub', 2, 'mac_dinh'),
  ('cáp màn hình', 'giá treo màn hình', 1, 'mac_dinh'), ('cáp màn hình', 'hub', 2, 'mac_dinh'),
  ('giá treo màn hình', 'cáp màn hình', 1, 'mac_dinh'), ('giá treo màn hình', 'hub', 2, 'mac_dinh'),
  ('kê tay', 'bàn phím', 1, 'mac_dinh'), ('kê tay', 'lót chuột', 2, 'mac_dinh')
ON CONFLICT DO NOTHING;
