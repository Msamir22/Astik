-- =============================================================================
-- Migration 007: Make market_rates fields non-nullable
-- Description: Make market_rates fields non-nullable
-- =============================================================================

UPDATE public.market_rates
SET
  silver_egp_per_gram = COALESCE(silver_egp_per_gram, 0),
  usd_egp = COALESCE(usd_egp, 0),
  gold_egp_per_gram = COALESCE(gold_egp_per_gram, 0),
  eur_egp = COALESCE(eur_egp, 0),
  created_at = COALESCE(created_at, NOW());

ALTER TABLE market_rates
ALTER COLUMN silver_egp_per_gram SET NOT NULL,
ALTER COLUMN usd_egp SET NOT NULL,
ALTER COLUMN gold_egp_per_gram SET NOT NULL,
ALTER COLUMN eur_egp SET NOT NULL,
ALTER COLUMN created_at SET NOT NULL;

