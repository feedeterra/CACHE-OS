-- Migration 017: Telegram bot support
-- Adds source column to processed_webhooks and creates pending confirmations table

-- Add source column to distinguish WhatsApp vs Telegram webhooks
ALTER TABLE processed_webhooks
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'whatsapp';

-- Table for pending Telegram write-operation confirmations (safety gate)
CREATE TABLE IF NOT EXISTS telegram_pending_confirmations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id       TEXT NOT NULL,
  operation     TEXT NOT NULL,   -- 'pause_campaign' | 'activate_campaign' | 'pause_adset' | 'update_budget'
  entity_id     TEXT NOT NULL,   -- campaign_id or adset_id from Meta
  entity_name   TEXT,            -- human-readable name for confirmation message
  params        JSONB,           -- e.g. { "new_budget_usd": 50000 }
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ DEFAULT NOW() + INTERVAL '5 minutes'
);

CREATE INDEX IF NOT EXISTS idx_tpc_chat_id ON telegram_pending_confirmations(chat_id);
CREATE INDEX IF NOT EXISTS idx_tpc_expires ON telegram_pending_confirmations(expires_at);
