# SOP: Escalado de Presupuesto (Scaling)

## Objetivo
Incrementar el presupuesto diario (Spend) de una campaña o adset sin romper la fase de aprendizaje o disparar drásticamente el Costo por Adquisición (CPA).

## Contexto Táctico
Escalar rápidamente "asusta" al algoritmo de Meta Ads. Un aumento repentino del 100% de presupuesto reinicia el aprendizaje, sube el CPM (pagamos más caro por impresionar) y usualmente duplica el CPA.

## Reglas de Escalado Vertical ("Micro-Scaling")
1. **Frecuencia**: Escalar máximo **cada 48 horas** (idealmente 72h) para darle tiempo al algoritmo de estabilizar resultados.
2. **Incremento (Regla del 20%)**: Aumentar el presupuesto diario en un **15% a 20%** como máximo. NUNCA duplicar.
3. **Condición de Entrada**: 
   - La campaña debe tener un CPA inferior al `target_cpa`.
   - La campaña debe tener más de 3 días activa y estar generando conversiones constantes.
   - Idealmente, el ROAS (E-commerce) debe estar > 3.0x.

## Reglas de Escalado Horizontal
- Duplicar el ad-set ganador, pero cambiar la audiencia (lookalikes al 5%, intereses cruzados).
- Tomar un anuncio ganador (Post ID) e insertarlo en una nueva campaña CBO sin límite de presupuesto estricto.

## Acciones del Media Buyer
- Utilizar el *Simulador Táctico* en CACHE-OS antes de aplicar el incremento. Si proyectamos +20% de Spend, estimamos una penalización de CPM del 10-15%. Si el nuevo CPA proyectado rompe el objetivo, NO escalar.
