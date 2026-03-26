-- Migration 018: Rename telegram_pending_confirmations to pending_confirmations
-- Used by both WhatsApp and Telegram channels

ALTER TABLE telegram_pending_confirmations
  RENAME TO pending_confirmations;

ALTER INDEX idx_tpc_chat_id RENAME TO idx_pc_chat_id;
ALTER INDEX idx_tpc_expires RENAME TO idx_pc_expires;

-- Add source column to distinguish channel
ALTER TABLE pending_confirmations
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'whatsapp';
