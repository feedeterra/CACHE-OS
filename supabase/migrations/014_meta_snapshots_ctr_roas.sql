-- Migration: Add CTR, CPM, impressions, clicks, ROAS to meta_snapshots
ALTER TABLE meta_snapshots
  ADD COLUMN IF NOT EXISTS impressions  INTEGER   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clicks       INTEGER   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ctr          NUMERIC(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cpm          NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reach        INTEGER   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS frequency    NUMERIC(4,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hook_rate    NUMERIC(6,2) DEFAULT 0;

-- Computed ROAS view (spend vs ventas reales del portal)
CREATE OR REPLACE VIEW client_roas AS
SELECT
  m.client_id,
  m.date,
  SUM(m.spend)                                       AS spend,
  COALESCE(SUM(s.count), 0)                          AS ventas,
  CASE
    WHEN SUM(m.spend) > 0 AND COALESCE(SUM(s.count), 0) > 0
    THEN COALESCE(SUM(s.count), 0) / SUM(m.spend)
    ELSE NULL
  END                                                AS roas_units, -- ventas/spend
  AVG(m.ctr)                                         AS avg_ctr,
  AVG(m.cpm)                                         AS avg_cpm
FROM meta_snapshots m
LEFT JOIN portal_sales_daily s
  ON s.client_id = m.client_id AND s.date = m.date
GROUP BY m.client_id, m.date;
