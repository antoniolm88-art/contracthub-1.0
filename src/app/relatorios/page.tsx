// src/app/relatorios/page.tsx
import { createServerClient, formatCurrency } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { redirect } from 'next/navigation'

export default async function RelatoriosPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: kpis } = await supabase.from('v_dashboard_kpis').select('*')

  const relatorios = [
    { icon: '📋', title: 'Carteira de Contratos', desc: 'Listagem completa com partes, valores, datas e índices de reajuste', color: 'bg-navy-bg text-[#1B3A5C]' },
    { icon: '⏰', title: 'Vencimentos por Período', desc: 'Contratos a vencer em 30, 60 e 90 dias com semáforo de criticidade', color: 'bg-amber-50 text-amber-700' },
    { icon: '💰', title: 'Resumo Financeiro', desc: 'Valores totais por área, tipo de contrato e empreendimento', color: 'bg-green-50 text-green-700' },
    { icon: '🏬', title: 'Portfólio Comercial', desc: 'Lojas, quiosques, antenas e espaços — ABL, aluguel e status por empreendimento', color: 'bg-navy-bg text-[#1B3A5C]' },
    { icon: '📦', title: 'Compras & Serviços', desc: 'Contratos por área: Operações, TI, Marketing, RH e Engenharia', color: 'bg-amber-50 text-amber-700' },
    { icon: '🔀', title: 'Aditivos e Renovações', desc: 'Histórico completo de alterações, renovações e distratos', color: 'bg-green-50 text-green-700' },
  ]

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userEmail={user.email} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0 shadow-sm">
          <h1 className="text-base font-semibold flex-1">Relatórios</h1>
          <button className="btn btn-secondary text-xs py-1.5">⚙️ Agendar relatório</button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-4 mb-8">
            {relatorios.map(r => (
              <button key={r.title}
                className="card p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all group"
                onClick={() => alert(`Gerando "${r.title}"…`)}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${r.color}`}>{r.icon}</div>
                <h3 className="font-semibold text-sm text-gray-900 mb-1 group-hover:text-[#1B3A5C]">{r.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{r.desc}</p>
                <div className="mt-3 flex gap-2">
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Excel</span>
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">PDF</span>
                </div>
              </button>
            ))}
          </div>

          {/* Resumo por empreendimento */}
          <div className="card">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-sm">Resumo da Carteira por Empreendimento</h2>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead><tr>
                  <th className="th">Empreendimento</th>
                  <th className="th">Total</th>
                  <th className="th">Vigentes</th>
                  <th className="th">Críticos</th>
                  <th className="th">Atenção</th>
                  <th className="th">Comercial</th>
                  <th className="th">Compras</th>
                  <th className="th">Prestação</th>
                  <th className="th">Valor Mensal</th>
                </tr></thead>
                <tbody>
                  {kpis?.map(k => (
                    <tr key={k.empreendimento_id} className="tr-hover">
                      <td className="td font-semibold text-gray-900">{k.empreendimento}</td>
                      <td className="td font-bold">{k.total_contratos}</td>
                      <td className="td"><span className="badge bg-green-50 text-green-700 border border-green-200">{k.vigentes}</span></td>
                      <td className="td">{k.criticos > 0 ? <span className="badge bg-red-50 text-red-700 border border-red-200">{k.criticos}</span> : <span className="text-gray-300">—</span>}</td>
                      <td className="td">{k.atencao > 0 ? <span className="badge bg-amber-50 text-amber-700 border border-amber-200">{k.atencao}</span> : <span className="text-gray-300">—</span>}</td>
                      <td className="td text-sm">{k.total_comercial}</td>
                      <td className="td text-sm">{k.total_compras}</td>
                      <td className="td text-sm">{k.total_prestacao}</td>
                      <td className="td font-semibold">{formatCurrency(k.valor_mensal_total)}</td>
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
