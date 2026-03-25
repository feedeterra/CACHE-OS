-- Activar pg_cron y pg_net si no están activados
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Programar ejecución a las 23:30 PM UTC (Aprox 20:30 Arg/UY) todos los días
-- Asegúrate de reeplazar [PROYECTO] y [SERVICE_ROLE_KEY] en entorno de prducción o 
-- usar un Vault local (https://localhost:54321/functions/v1/agency-guardian) para tests
SELECT cron.schedule(
  'guardian-daily-alert',
  '30 23 * * *',
  $$
    SELECT net.http_post(
        url:='http://kong:8000/functions/v1/agency-guardian',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer service_role_key_here"}'::jsonb,
        body:='{}'::jsonb
    ) AS request_id;
  $$
);
