// src/app/dashboard/page.tsx
import { createServerClient, formatCurrency, urgenciaColor } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // KPIs consolidados
  const { data: kpis } = await supabase.from('v_dashboard_kpis').select('*')
  const kpi = kpis?.reduce((acc, row) => ({
    total_contratos: (acc.total_contratos || 0) + Number(row.total_contratos),
    vigentes: (acc.vigentes || 0) + Number(row.vigentes),
    criticos: (acc.criticos || 0) + Number(row.criticos),
    atencao: (acc.atencao || 0) + Number(row.atencao),
    valor_mensal_total: (acc.valor_mensal_total || 0) + Number(row.valor_mensal_total || 0),
    total_comercial: (acc.total_comercial || 0) + Number(row.total_comercial),
    total_compras: (acc.total_compras || 0) + Number(row.total_compras),
    total_prestacao: (acc.total_prestacao || 0) + Number(row.total_prestacao),
  }), {} as any) ?? {}

  // Contratos com vencimento próximo
  const { data: alertas } = await supabase
    .from('v_contratos')
    .select('id, numero, empreendimento_nome, contratada_nome, area, data_termino, valor_mensal, urgencia, dias_para_vencer, status')
    .in('urgencia', ['critico', 'atencao'])
    .eq('status', 'vigente')
    .order('dias_para_vencer', { ascending: true })
    .limit(8)

  // Contratos recentes
  const { data: recentes } = await supabase
    .from('v_contratos')
    .select('id, numero, contratada_nome, area, tipo, data_inicio, data_termino, valor_mensal, status, marca')
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userEmail={user.email} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0 shadow-sm">
          <h1 className="text-base font-semibold flex-1">Dashboard</h1>
          {(kpi.criticos > 0) && (
            <Link href="/alertas" className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full font-semibold hover:bg-red-100 transition-colors">
              ⚠️ {kpi.criticos} contrato{kpi.criticos > 1 ? 's' : ''} crítico{kpi.criticos > 1 ? 's' : ''}
            </Link>
          )}
          <Link href="/contratos/novo" className="btn btn-primary text-xs py-1.5">
            + Novo Contrato
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total de Contratos', value: kpi.total_contratos ?? 0, sub: 'todos os empreendimentos', color: 'border-l-[#1B3A5C]', icon: '📄' },
              { label: 'Valor Mensal Vigente', value: formatCurrency(kpi.valor_mensal_total), sub: 'contratos ativos', color: 'border-l-[#C8923A]', icon: '💰' },
              { label: 'Contratos Vigentes', value: kpi.vigentes ?? 0, sub: `${Math.round(((kpi.vigentes ?? 0) / (kpi.total_contratos || 1)) * 100)}% do total`, color: 'border-l-green-500', icon: '✅' },
              { label: 'Vencem em 30 dias', value: kpi.criticos ?? 0, sub: `+ ${kpi.atencao ?? 0} em 90 dias`, color: 'border-l-red-500', icon: '⏰', red: true },
            ].map(({ label, value, sub, color, icon, red }) => (
              <div key={label} className={`card p-5 border-l-4 ${color}`}>
                <div className="text-2xl mb-2">{icon}</div>
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className={`text-2xl font-bold ${red && Number(value) > 0 ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
                <p className="text-xs text-gray-400 mt-1">{sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-5 gap-6 mb-6">
            {/* Alertas */}
            <div className="col-span-3 card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-sm">Alertas de Vencimento</h2>
                <Link href="/alertas" className="text-xs text-[#1B3A5C] font-medium hover:underline">Ver todos →</Link>
              </div>
              <div className="space-y-2">
                {alertas?.length === 0 && (
                  <p className="text-sm text-gray-400 py-4 text-center">Nenhum alerta no momento 🎉</p>
                )}
                {alertas?.map(c => (
                  <Link href={`/contratos/${c.id}`} key={c.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all group">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${c.urgencia === 'critico' ? 'bg-red-500 shadow-sm shadow-red-200' : 'bg-amber-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{c.contratada_nome ?? c.numero}</p>
                      <p className="text-xs text-gray-400">{c.empreendimento_nome} · {formatCurrency(c.valor_mensal)}/mês</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${urgenciaColor(c.urgencia)}`}>
                      {c.dias_para_vencer}d
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Distribuição */}
            <div className="col-span-2 card p-5">
              <h2 className="font-semibold text-sm mb-4">Distribuição por Área</h2>
              <div className="space-y-4">
                {[
                  { label: 'Comercial', value: kpi.total_comercial ?? 0, total: kpi.total_contratos || 1, color: 'bg-[#1B3A5C]' },
                  { label: 'Compras & Serviços', value: kpi.total_compras ?? 0, total: kpi.total_contratos || 1, color: 'bg-[#C8923A]' },
                  { label: 'Prestação', value: kpi.total_prestacao ?? 0, total: kpi.total_contratos || 1, color: 'bg-green-600' },
                ].map(({ label, value, total, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-semibold text-gray-800">{value}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all`}
                        style={{ width: `${Math.round((value / total) * 100)}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{Math.round((value / total) * 100)}% do portfólio</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recentes */}
          <div className="card">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-sm">Contratos Recentes</h2>
              <Link href="/contratos" className="text-xs text-[#1B3A5C] font-medium hover:underline">Ver todos →</Link>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th className="th">Contrato</th>
                    <th className="th">Parte Contratada</th>
                    <th className="th">Área</th>
                    <th className="th">Vigência</th>
                    <th className="th">Valor/mês</th>
                    <th className="th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentes?.map(c => (
                    <tr key={c.id} className="tr-hover" onClick={() => window.location.href = `/contratos/${c.id}`}>
                      <td className="td">
                        <p className="font-medium text-gray-900">{c.marca ?? c.contratada_nome ?? '—'}</p>
                        <p className="text-xs text-gray-400 font-mono">{c.numero}</p>
                      </td>
                      <td className="td text-sm">{c.contratada_nome ?? '—'}</td>
                      <td className="td">
                        <span className={`badge ${c.area === 'comercial' ? 'bg-navy-bg text-[#1B3A5C] border-blue-100' : c.area === 'compras_servicos' ? 'bg-amber-50 text-amber-800 border-amber-100' : 'bg-green-50 text-green-800 border-green-100'}`}>
                          {c.area === 'comercial' ? 'Comercial' : c.area === 'compras_servicos' ? 'Compras' : 'Prestação'}
                        </span>
                      </td>
                      <td className="td text-xs text-gray-500 font-mono">
                        {c.data_inicio ? c.data_inicio.slice(0, 7).replace('-', '/') : '—'} →{' '}
                        {c.data_termino ? c.data_termino.slice(0, 7).replace('-', '/') : '—'}
                      </td>
                      <td className="td font-semibold text-gray-800">{formatCurrency(c.valor_mensal)}</td>
                      <td className="td">
                        <span className={`badge border ${c.status === 'vigente' ? 'bg-green-50 text-green-700 border-green-200' : c.status === 'em_renovacao' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {c.status === 'vigente' ? '● Vigente' : c.status === 'em_renovacao' ? '◎ Renovação' : c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
