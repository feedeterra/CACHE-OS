-- Migration: Add revenue to portal_sales_daily
ALTER TABLE portal_sales_daily
  ADD COLUMN IF NOT EXISTS revenue NUMERIC(15,2) DEFAULT 0;

-- Update client_roas VIEW to use the new revenue column instead of just 'ventas' (count) as revenue
DROP VIEW IF EXISTS client_roas;
CREATE VIEW client_roas AS
SELECT
  m.client_id,
  m.date,
  SUM(m.spend)                                       AS spend,
  COALESCE(SUM(s.count), 0)                          AS ventas,
  COALESCE(SUM(s.revenue), 0)                        AS revenue,
  CASE
    WHEN SUM(m.spend) > 0 AND COALESCE(SUM(s.revenue), 0) > 0
    THEN COALESCE(SUM(s.revenue), 0) / SUM(m.spend)
    ELSE NULL
  END                                                AS roas_real,
  AVG(m.ctr)                                         AS avg_ctr,
  AVG(m.cpm)                                         AS avg_cpm
FROM meta_snapshots m
LEFT JOIN portal_sales_daily s
  ON s.client_id = m.client_id AND s.date = m.date
GROUP BY m.client_id, m.date;
