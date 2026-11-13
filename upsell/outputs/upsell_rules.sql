-- Luật mua kèm học từ Amazon Reviews 2023 (sinh bởi upsell/train_upsell.ipynb)
BEGIN;
DELETE FROM upsell_rules WHERE source = 'amazon';
INSERT INTO upsell_rules (anchor_category, rec_category, rank, score, support, source) VALUES ('laptop', 'túi chống sốc', 1, 0.1693, 3514, 'amazon');
INSERT INTO upsell_rules (anchor_category, rec_category, rank, score, support, source) VALUES ('màn hình', 'giá treo màn hình', 1, 0.1674, 4249, 'amazon');
INSERT INTO upsell_rules (anchor_category, rec_category, rank, score, support, source) VALUES ('micro', 'webcam', 1, 0.1183, 733, 'amazon');
INSERT INTO upsell_rules (anchor_category, rec_category, rank, score, support, source) VALUES ('webcam', 'micro', 1, 0.0729, 733, 'amazon');
INSERT INTO upsell_rules (anchor_category, rec_category, rank, score, support, source) VALUES ('túi chống sốc', 'laptop', 1, 0.2511, 3514, 'amazon');
INSERT INTO upsell_rules (anchor_category, rec_category, rank, score, support, source) VALUES ('giá treo màn hình', 'màn hình', 1, 0.2913, 4249, 'amazon');
COMMIT;
