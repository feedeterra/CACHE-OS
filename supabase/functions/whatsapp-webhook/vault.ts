export const SOP_ESCALADO = `# SOP: Escalado de Presupuesto (Scaling)

## Objetivo
Incrementar el presupuesto diario (Spend) de una campaña o adset sin romper la fase de aprendizaje o disparar drásticamente el Costo por Adquisición (CPA).

## Contexto Táctico
Escalar rápidamente "asusta" al algoritmo de Meta Ads. Un aumento repentino del 100% de presupuesto reinicia el aprendizaje, sube el CPM (pagamos más caro por impresionar) y usualmente duplica el CPA.

## Reglas de Escalado Vertical ("Micro-Scaling")
1. **Frecuencia**: Escalar máximo **cada 48 horas** (idealmente 72h) para darle tiempo al algoritmo de estabilizar resultados.
2. **Incremento (Regla del 20%)**: Aumentar el presupuesto diario en un **15% a 20%** como máximo. NUNCA duplicar.
3. **Condición de Entrada**: 
   - La campaña debe tener un CPA inferior al \`target_cpa\`.
   - La campaña debe tener más de 3 días activa y estar generando conversiones constantes.
   - Idealmente, el ROAS (E-commerce) debe estar > 3.0x.

## Reglas de Escalado Horizontal
- Duplicar el ad-set ganador, pero cambiar la audiencia (lookalikes al 5%, intereses cruzados).
- Tomar un anuncio ganador (Post ID) e insertarlo en una nueva campaña CBO sin límite de presupuesto estricto.

## Acciones del Media Buyer
- Utilizar el *Simulador Táctico* en CACHE-OS antes de aplicar el incremento. Si proyectamos +20% de Spend, estimamos una penalización de CPM del 10-15%. Si el nuevo CPA proyectado rompe el objetivo, NO escalar.
`;

export const SOP_PACING = `# SOP: Control de Pacing (Presupuesto)

## Qué medir
El ritmo (Pacing) en que Meta consume el presupuesto asignado para el mes.
- Consumo Acumulado (MTD): El total consumido desde el día 1 hasta hoy.
- Presupuesto Meta: Ej. \$1500 USD / mes (idealmente \$50/día).
- Desviación (Overspending / Underspending).

## Alertas
- **🔴 Overspending (>5%)**: Si estamos consumiendo más agresivamente de lo planeado. Significa que agotaremos el presupuesto antes de fin de mes. (Medida: bajar budget diario).
- **🟡 Warning / Break Even**: Consumo exacto al hilo previsto.
- **🟢 Underspending (<5%)**: Ocurre si fijamos límites bajos de puja (BID) o pausas prolongadas.

## Fórmula para Corregir ("Fixing")
\`Nuevo Presupuesto Diario = (Presupuesto Restante / Días Restantes)\`

Si estamos hoy a 20 de mes, Meta ha consumido \$1200 y la meta era \$1500:
Restante: \$300
Días: 10
Nuevo Diario = \$30.

El dashboard CACHE-OS te da este cálculo en la columna [NUEVO DIARIO] del panel principal de Pacing.
`;

export const SOP_RENDIMIENTO = `# SOP: Rendimiento Táctico y Fatiga Creativa

## Reglas de Optimización según Funnel Type

### Generación de Leads (WhatsApp/Formulario)
1. **Línea Sensible**: El "Costo X Contacto" (CPL). Un lead se encarece no sólo porque el anuncio sea malo, sino porque el CMP sube (más competencia).
2. Si un anuncio pasa 3x nuestro CPA objetivo SIN un contacto > Se APAGA.
3. Si el CTR baja del 1% y la Frecuencia > 2.5: **Fatiga de Audiencia** (El mismo grupo ve el anuncio mil veces).
4. Solución: Crear anuncios nuevos o rotar (Dynamic Creative Optimization).

### Ecommerce (Compras, Add To Cart)
1. **Eslabón Fuerte**: El **ROAS** (\`Ventas (\$) / Inversión (\$)\`).
2. Aunque una campaña tenga CTR enorme, si el tráfico rebota en el portal de cliente por envíos caros o mala tienda, el ROAS se desploma.
3. Si CPA > \`target_cpa\` pero el Ticket Promedio (AOV) es inmenso y generamos super ROAS (ej. vendemos maquinaria industrial con \$1000 CPA pero 20.0x ROAS): ¡MANTENER ENCENDIDO! **En E-commerce, ROAS mata al CPA**.

## Alarma: Descenso de CTR (Click Through Rate) %
Si el CTR Baja (la gente ignora el anuncio): 
- Significa creatividad pobre o estancada.
- Activa proceso de testing de 3 variables (Nuevos Hooks, Nuevos Ángulos Visuales).

## Alarma: CPM Alto (Costo por Mil)
Si el mercado está saturado con ofertas:
- Amplía la audiencia (Pásate de intereses estrechos a Advantage+ Broad).
- Meta Ads prefiere la fluidez. Broad + Creativo fuerte da el CPM más bajo.
`;

