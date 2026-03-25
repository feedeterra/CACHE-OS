# SOP: Control de Pacing (Presupuesto)

## Qué medir
El ritmo (Pacing) en que Meta consume el presupuesto asignado para el mes.
- Consumo Acumulado (MTD): El total consumido desde el día 1 hasta hoy.
- Presupuesto Meta: Ej. $1500 USD / mes (idealmente $50/día).
- Desviación (Overspending / Underspending).

## Alertas
- **🔴 Overspending (>5%)**: Si estamos consumiendo más agresivamente de lo planeado. Significa que agotaremos el presupuesto antes de fin de mes. (Medida: bajar budget diario).
- **🟡 Warning / Break Even**: Consumo exacto al hilo previsto.
- **🟢 Underspending (<5%)**: Ocurre si fijamos límites bajos de puja (BID) o pausas prolongadas.

## Fórmula para Corregir ("Fixing")
`Nuevo Presupuesto Diario = (Presupuesto Restante / Días Restantes)`

Si estamos hoy a 20 de mes, Meta ha consumido $1200 y la meta era $1500:
Restante: $300
Días: 10
Nuevo Diario = $30.

El dashboard CACHE-OS te da este cálculo en la columna [NUEVO DIARIO] del panel principal de Pacing.
