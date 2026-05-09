// src/app/alertas/page.tsx
import { createServerClient, formatCurrency, formatDate } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function AlertasPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: criticos } = await supabase
    .from('v_contratos').select('*')
    .eq('urgencia', 'critico').eq('status', 'vigente')
    .order('dias_para_vencer', { ascending: true })

  const { data: atencao } = await supabase
    .from('v_contratos').select('*')
    .eq('urgencia', 'atencao').eq('status', 'vigente')
    .order('dias_para_vencer', { ascending: true })

  function AlertTable({ contratos, color }: { contratos: any[], color: 'red' | 'amber' }) {
    const cls = color === 'red'
      ? { badge: 'bg-red-50 text-red-700 border-red-200', header: 'text-red-600', dot: 'bg-red-500' }
      : { badge: 'bg-amber-50 text-amber-700 border-amber-200', header: 'text-amber-700', dot: 'bg-amber-400' }
    return (
      <div className="table-wrap">
        <table className="table">
          <thead><tr>
            <th className="th">Contrato</th><th className="th">Parte</th>
            <th className="th">Empreendimento</th><th className="th">Área</th>
            <th className="th">Término</th><th className="th">Dias restantes</th>
            <th className="th">Valor/mês</th><th className="th">Ação</th>
          </tr></thead>
          <tbody>
            {contratos.map(c => (
              <tr key={c.id} className="tr-hover" onClick={() => window.location.href = `/contratos/${c.id}`}>
                <td className="td">
                  <p className="font-semibold text-gray-900">{c.marca ?? c.numero}</p>
                  <p className="text-xs text-gray-400 font-mono">{c.numero}</p>
                </td>
                <td className="td text-sm">{c.contratada_nome ?? '—'}</td>
                <td className="td text-sm">{c.empreendimento_nome}</td>
                <td className="td">
                  <span className={`badge border ${c.area === 'comercial' ? 'bg-navy-bg text-[#1B3A5C] border-blue-100' : 'bg-amber-50 text-amber-800 border-amber-100'}`}>
                    {c.area === 'comercial' ? 'Comercial' : 'Compras'}
                  </span>
                </td>
                <td className="td text-sm text-gray-500 font-mono">{formatDate(c.data_termino)}</td>
                <td className="td">
                  <span className={`badge border font-bold ${cls.badge}`}>{c.dias_para_vencer} dias</span>
                </td>
                <td className="td font-semibold">{formatCurrency(c.valor_mensal)}</td>
                <td className="td" onClick={e => e.stopPropagation()}>
                  <button className="btn btn-primary text-xs py-1 px-3">Renovar</button>
                </td>
              </tr>
            ))}
            {contratos.length === 0 && (
              <tr><td colSpan={8} className="td text-center py-8 text-gray-400">Nenhum contrato nesta categoria 🎉</td></tr>
            )}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userEmail={user.email} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0 shadow-sm">
          <h1 className="text-base font-semibold flex-1">Alertas de Vencimento</h1>
          <button className="btn btn-secondary text-xs py-1.5">⚙️ Configurar alertas</button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Críticos (≤ 30 dias)', value: criticos?.length ?? 0, color: 'border-l-red-500', icon: '🚨', sub: 'ação imediata' },
              { label: 'Atenção (31–90 dias)', value: atencao?.length ?? 0, color: 'border-l-amber-400', icon: '⏰', sub: 'iniciar negociação' },
              { label: 'Valor em risco (críticos)', value: formatCurrency(criticos?.reduce((s, c) => s + (c.valor_mensal ?? 0), 0)), color: 'border-l-red-400', icon: '💸', sub: 'por mês' },
              { label: 'Valor em risco (atenção)', value: formatCurrency(atencao?.reduce((s, c) => s + (c.valor_mensal ?? 0), 0)), color: 'border-l-amber-300', icon: '💰', sub: 'por mês' },
            ].map(({ label, value, color, icon, sub }) => (
              <div key={label} className={`card p-5 border-l-4 ${color}`}>
                <div className="text-2xl mb-2">{icon}</div>
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 mt-1">{sub}</p>
              </div>
            ))}
          </div>

          {/* Críticos */}
          <div className="card mb-6">
            <div className="flex items-center gap-3 p-5 border-b border-gray-100">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow shadow-red-200" />
              <h2 className="font-semibold text-red-600">Crítico — Vencimento em até 30 dias</h2>
            </div>
            <AlertTable contratos={criticos ?? []} color="red" />
          </div>

          {/* Atenção */}
          <div className="card">
            <div className="flex items-center gap-3 p-5 border-b border-gray-100">
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <h2 className="font-semibold text-amber-700">Atenção — Vencimento em 31 a 90 dias</h2>
            </div>
            <AlertTable contratos={atencao ?? []} color="amber" />
          </div>
        </main>
      </div>
    </div>
  )
}
