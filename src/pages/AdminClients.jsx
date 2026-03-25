import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import HudPanel from '../components/HudPanel'
import HudButton from '../components/HudButton'
import BlinkingCursor from '../components/BlinkingCursor'

const EMPTY = { name: '', meta_ad_account_id: '', monthly_budget: '', funnel_type: 'leads', is_active: true, kpi_goals: {} }

const GOAL_FIELDS = {
  leads: [
    { key: 'target_cpl',    label: 'TARGET_CPL ($)',  placeholder: '10' },
    { key: 'target_leads',  label: 'TARGET_LEADS/MO', placeholder: '300' },
    { key: 'target_ctr',    label: 'TARGET_CTR (%)',  placeholder: '2.0' },
    { key: 'max_frequency', label: 'MAX_FREQUENCY',   placeholder: '3.0' },
  ],
  conversions: [
    { key: 'target_cpa',    label: 'TARGET_CPA ($)',  placeholder: '50' },
    { key: 'target_roas',   label: 'TARGET_ROAS (x)', placeholder: '3.0' },
    { key: 'target_ctr',    label: 'TARGET_CTR (%)',  placeholder: '2.0' },
    { key: 'max_frequency', label: 'MAX_FREQUENCY',   placeholder: '3.0' },
  ],
}

export default function AdminClients() {
  const [searchParams] = useSearchParams()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    setClients(data ?? [])
    setLoading(false)
    const editId = searchParams.get('edit')
    if (editId && data) {
      const target = data.find((c) => c.id === editId)
      if (target) setForm({ ...target, monthly_budget: String(target.monthly_budget ?? ''), kpi_goals: target.kpi_goals ?? {} })
    }
  }

  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    const payload = {
      name: form.name,
      meta_ad_account_id: form.meta_ad_account_id || null,
      monthly_budget: form.monthly_budget ? parseFloat(form.monthly_budget) : null,
      funnel_type: form.funnel_type || 'leads',
      kpi_goals: form.kpi_goals || {},
      is_active: form.is_active,
    }
    if (form.id) {
      await supabase.from('clients').update(payload).eq('id', form.id)
    } else {
      await supabase.from('clients').insert(payload)
    }
    setSaving(false)
    setForm(null)
    load()
  }

  async function toggleActive(client) {
    await supabase.from('clients').update({ is_active: !client.is_active }).eq('id', client.id)
    load()
  }

  function copyToken(token) {
    navigator.clipboard.writeText(`${window.location.origin}/portal/${token}`)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  function updateGoal(key, val) {
    setForm((f) => ({ ...f, kpi_goals: { ...f.kpi_goals, [key]: val ? parseFloat(val) : null } }))
  }

  function addCpaTarget() {
    const targets = [...(form.kpi_goals?.cpa_targets ?? []), { name: '', target: '' }]
    setForm((f) => ({ ...f, kpi_goals: { ...f.kpi_goals, cpa_targets: targets } }))
  }

  function updateCpaTarget(i, field, val) {
    const targets = [...(form.kpi_goals?.cpa_targets ?? [])]
    targets[i] = { ...targets[i], [field]: field === 'target' ? (val ? parseFloat(val) : '') : val }
    setForm((f) => ({ ...f, kpi_goals: { ...f.kpi_goals, cpa_targets: targets } }))
  }

  function removeCpaTarget(i) {
    const targets = (form.kpi_goals?.cpa_targets ?? []).filter((_, idx) => idx !== i)
    setForm((f) => ({ ...f, kpi_goals: { ...f.kpi_goals, cpa_targets: targets } }))
  }

  const goalFields = GOAL_FIELDS[form?.funnel_type] ?? GOAL_FIELDS.leads

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-baseline gap-2 border-b border-border/30 pb-2">
        <span className="text-accent font-bold font-mono text-sm tracking-widest">CLIENT_CONFIG</span>
        <BlinkingCursor />
        <div className="ml-auto">
          <HudButton onClick={() => setForm({ ...EMPTY })} className="text-[10px] py-1">
            [+] ADD CLIENT
          </HudButton>
        </div>
      </div>

      {form && (
        <HudPanel title={form.id ? 'EDIT_CLIENT' : 'NEW_CLIENT'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { key: 'name',               label: 'CLIENT_NAME',       placeholder: 'Acme Corp' },
              { key: 'meta_ad_account_id', label: 'META_AD_ACCOUNT',   placeholder: 'act_123456' },
              { key: 'monthly_budget',     label: 'MONTHLY_BUDGET_USD',placeholder: '5000' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-[10px] text-text-dim font-mono uppercase tracking-widest mb-1">{label}</label>
                <input
                  value={form[key] ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-bg-primary border border-border/40 text-text font-mono text-xs px-3 py-2 rounded-none focus:outline-none focus:border-accent placeholder:text-text-dim/40"
                />
              </div>
            ))}

            {/* Funnel type */}
            <div>
              <label className="block text-[10px] text-text-dim font-mono uppercase tracking-widest mb-1">FUNNEL_TYPE</label>
              <div className="flex gap-2">
                {['leads', 'conversions'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, funnel_type: t }))}
                    className={`flex-1 py-2 font-mono text-[10px] uppercase tracking-wider border cursor-pointer transition-colors ${
                      form.funnel_type === t
                        ? t === 'leads'
                          ? 'border-success text-success bg-success/10'
                          : 'border-accent text-accent bg-accent/10'
                        : 'border-border/40 text-text-dim hover:text-text'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* KPI Goals */}
          <div className="mt-3 border-t border-border/20 pt-3">
            <p className="text-[10px] text-accent font-mono uppercase tracking-widest mb-2">
              // KPI_GOALS — SEMAFORO DE RENDIMIENTO
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
              {goalFields.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-[9px] text-text-dim font-mono uppercase tracking-widest mb-1">{label}</label>
                  <input
                    type="number"
                    step="any"
                    value={form.kpi_goals?.[key] ?? ''}
                    onChange={(e) => updateGoal(key, e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-bg-primary border border-border/40 text-text font-mono text-xs px-2 py-1.5 rounded-none focus:outline-none focus:border-accent placeholder:text-text-dim/40"
                  />
                </div>
              ))}
            </div>

            {/* CPA Targets */}
            <div className="border-t border-border/20 pt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] text-accent font-mono uppercase tracking-widest">
                  CPA_REAL TARGETS — POR PRODUCTO / CATEGORÍA
                </p>
                <button
                  type="button"
                  onClick={addCpaTarget}
                  className="text-[9px] font-mono text-accent hover:text-accent-soft uppercase tracking-widest cursor-pointer"
                >
                  [+] ADD
                </button>
              </div>
              {(form.kpi_goals?.cpa_targets ?? []).length === 0 && (
                <p className="text-[9px] text-text-dim/50 font-mono">SIN TARGETS — CLICK [+] ADD PARA AGREGAR</p>
              )}
              <div className="space-y-1.5">
                {(form.kpi_goals?.cpa_targets ?? []).map((t, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      value={t.name}
                      onChange={(e) => updateCpaTarget(i, 'name', e.target.value)}
                      placeholder="Ej: Ropa exterior"
                      className="flex-1 bg-bg-primary border border-border/40 text-text font-mono text-xs px-2 py-1.5 rounded-none focus:outline-none focus:border-accent placeholder:text-text-dim/40"
                    />
                    <input
                      type="number"
                      step="any"
                      value={t.target}
                      onChange={(e) => updateCpaTarget(i, 'target', e.target.value)}
                      placeholder="$0"
                      className="w-24 bg-bg-primary border border-border/40 text-accent font-mono text-xs px-2 py-1.5 rounded-none focus:outline-none focus:border-accent placeholder:text-text-dim/40"
                    />
                    <button
                      type="button"
                      onClick={() => removeCpaTarget(i)}
                      className="text-danger hover:text-danger/70 font-mono text-[10px] cursor-pointer px-1"
                    >
                      [×]
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/20">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="accent-accent" />
              <span className="text-text-dim font-mono text-[10px] uppercase tracking-widest">IS_ACTIVE</span>
            </label>
            <div className="ml-auto flex gap-2">
              <HudButton onClick={save} disabled={saving || !form.name}>{saving ? 'SAVING...' : '[✓] SAVE'}</HudButton>
              <HudButton variant="ghost" onClick={() => setForm(null)}>[×] CANCEL</HudButton>
            </div>
          </div>
        </HudPanel>
      )}

      <HudPanel>
        {loading ? (
          <p className="text-text-dim font-mono text-[10px] py-4 text-center">LOADING <BlinkingCursor /></p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-[10px] min-w-[600px]">
            <thead>
              <tr className="text-text-dim border-b border-border/20">
                {['NOMBRE','TIPO','META_ACCOUNT','BUDGET/MO','STATUS','PORTAL','ACTIONS'].map((h) => (
                  <th key={h} className={`py-1 font-normal ${h === 'NOMBRE' || h === 'META_ACCOUNT' ? 'text-left' : 'text-center'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-border/10 hover:bg-accent/5">
                  <td className="py-1.5 font-bold text-text">{c.name}</td>
                  <td className="py-1.5 text-center">
                    <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 border ${
                      c.funnel_type === 'conversions'
                        ? 'text-accent border-accent/40 bg-accent/10'
                        : 'text-success border-success/40 bg-success/10'
                    }`}>
                      {c.funnel_type || 'leads'}
                    </span>
                  </td>
                  <td className="py-1.5 text-text-dim">{c.meta_ad_account_id ?? '—'}</td>
                  <td className="py-1.5 text-center text-accent">
                    {c.monthly_budget ? `$${Number(c.monthly_budget).toLocaleString()}` : '—'}
                  </td>
                  <td className="py-1.5 text-center">
                    <button onClick={() => toggleActive(c)} className={`font-mono text-[9px] uppercase tracking-widest cursor-pointer ${c.is_active ? 'text-success' : 'text-text-dim'}`}>
                      {c.is_active ? 'ACTIVE' : 'PAUSED'}
                    </button>
                  </td>
                  <td className="py-1.5 text-center">
                    <button onClick={() => copyToken(c.magic_link_token)} className="text-accent-soft hover:text-accent font-mono text-[9px] cursor-pointer uppercase tracking-widest">
                      {copied === c.magic_link_token ? '[COPIED!]' : '[COPY LINK]'}
                    </button>
                  </td>
                  <td className="py-1.5 text-center">
                    <button onClick={() => setForm({ ...c, kpi_goals: c.kpi_goals || {} })} className="text-text-dim hover:text-accent font-mono text-[9px] cursor-pointer uppercase">
                      [EDIT]
                    </button>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-text-dim font-mono text-[10px]">NO CLIENTS FOUND. ADD ONE ABOVE.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        )}
      </HudPanel>
    </div>
  )
}
