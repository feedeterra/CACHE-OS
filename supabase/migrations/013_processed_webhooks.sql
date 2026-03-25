-- Tabla para rastreo atómico de webhooks procesados
CREATE TABLE IF NOT EXISTS processed_webhooks (
    message_id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sender_phone TEXT,
    status TEXT
);

-- Indice para limpieza automática (opcional)
CREATE INDEX IF NOT EXISTS idx_processed_webhooks_created_at ON processed_webhooks(created_at);
