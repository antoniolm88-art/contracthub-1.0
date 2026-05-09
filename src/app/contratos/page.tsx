'use client'
// src/app/contratos/page.tsx
import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient, formatCurrency, urgenciaColor } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { LABELS_AREA, LABELS_STATUS, LABELS_TIPO, type ContratoView } from '@/lib/types'

export default function ContratosPage() {
  const supabase = createBrowserClient()
  const params = useSearchParams()
  const [contratos, setContratos] = useState<ContratoView[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterArea, setFilterArea] = useState(params.get('area') ?? '')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSub, setFilterSub] = useState(params.get('sub') ?? '')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? ''))
  }, [])

  const fetchContratos = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('v_contratos').select('*').order('created_at', { ascending: false }).limit(100)
    if (filterArea) query = query.eq('area', filterArea)
    if (filterStatus) query = query.eq('status', filterStatus)
    if (filterSub) query = query.eq('subarea', filterSub)
    if (search) query = query.or(`numero.ilike.%${search}%,marca.ilike.%${search}%,contratada_nome.ilike.%${search}%,objeto.ilike.%${search}%`)
    const { data } = await query
    setContratos((data ?? []) as ContratoView[])
    setLoading(false)
  }, [filterArea, filterStatus, filterSub, search])

  useEffect(() => { fetchContratos() }, [fetchContratos])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userEmail={userEmail} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0 shadow-sm">
          <h1 className="text-base font-semibold flex-1">Contratos</h1>
          <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 w-64">
            <span className="text-gray-400 text-sm">🔍</span>
            <input type="text" placeholder="Buscar por parte, número, marca…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none flex-1 text-gray-700 placeholder-gray-400" />
          </div>
          <Link href="/contratos/novo" className="btn btn-primary text-xs py-1.5">+ Novo Contrato</Link>
        </header>

        {/* Filters */}
        <div className="bg-white border-b border-gray-200 px-6 py-2.5 flex items-center gap-3 flex-wrap">
          <select className="select w-auto text-xs py-1.5" value={filterArea} onChange={e => setFilterArea(e.target.value)}>
            <option value="">Todas as áreas</option>
            <option value="comercial">Comercial</option>
            <option value="compras_servicos">Compras & Serviços</option>
            <option value="prestacao_servicos">Prestação de Serviços</option>
          </select>
          <select className="select w-auto text-xs py-1.5" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="vigente">Vigente</option>
            <option value="em_renovacao">Em Renovação</option>
            <option value="encerrado">Encerrado</option>
            <option value="distratado">Distratado</option>
            <option value="vencido">Vencido</option>
          </select>
          <select className="select w-auto text-xs py-1.5" value={filterSub} onChange={e => setFilterSub(e.target.value)}>
            <option value="">Todas as subáreas</option>
            <option value="lojas">Lojas</option>
            <option value="quiosques">Quiosques</option>
            <option value="antenas">Antenas</option>
            <option value="eventos">Eventos</option>
            <option value="operacoes">Operações</option>
            <option value="marketing">Marketing</option>
            <option value="rh">RH</option>
            <option value="financas">Finanças</option>
            <option value="engenharia">Engenharia</option>
            <option value="tecnologia">Tecnologia</option>
          </select>
          {(filterArea || filterStatus || filterSub || search) && (
            <button onClick={() => { setFilterArea(''); setFilterStatus(''); setFilterSub(''); setSearch('') }}
              className="text-xs text-red-600 hover:underline">Limpar filtros</button>
          )}
          <span className="ml-auto text-xs text-gray-400">{loading ? 'Carregando…' : `${contratos.length} contrato${contratos.length !== 1 ? 's' : ''}`}</span>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <div className="table-wrap">
            <table className="table">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="th">Contrato</th>
                  <th className="th">Parte Contratada</th>
                  <th className="th">Área</th>
                  <th className="th">Tipo</th>
                  <th className="th">Assinatura</th>
                  <th className="th">Vigência</th>
                  <th className="th">Valor/mês</th>
                  <th className="th">Status</th>
                  <th className="th">Urgência</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={10} className="td text-center text-gray-400 py-12">Carregando…</td></tr>
                )}
                {!loading && contratos.length === 0 && (
                  <tr><td colSpan={10} className="td text-center text-gray-400 py-12">Nenhum contrato encontrado com os filtros aplicados.</td></tr>
                )}
                {contratos.map(c => (
                  <tr key={c.id} className="tr-hover" onClick={() => window.location.href = `/contratos/${c.id}`}>
                    <td className="td">
                      <p className="font-semibold text-gray-900 text-sm">{c.marca ?? c.contratada_nome ?? '—'}</p>
                      <p className="text-xs text-gray-400 font-mono">{c.numero}</p>
                    </td>
                    <td className="td text-sm">{c.contratada_nome ?? '—'}</td>
                    <td className="td">
                      <span className={`badge ${c.area === 'comercial' ? 'bg-navy-bg text-[#1B3A5C] border-blue-100' : c.area === 'compras_servicos' ? 'bg-amber-50 text-amber-800 border-amber-100' : 'bg-green-50 text-green-800 border-green-100'}`}>
                        {LABELS_AREA[c.area] ?? c.area}
                      </span>
                    </td>
                    <td className="td text-xs text-gray-600">{LABELS_TIPO[c.tipo] ?? c.tipo}</td>
                    <td className="td text-xs text-gray-500 font-mono">{c.data_assinatura?.slice(0, 10) ?? '—'}</td>
                    <td className="td text-xs text-gray-500 font-mono">
                      {c.data_inicio?.slice(0, 7) ?? '—'} → {c.data_termino?.slice(0, 7) ?? '—'}
                    </td>
                    <td className="td font-semibold text-gray-800 text-sm">{formatCurrency(c.valor_mensal)}</td>
                    <td className="td">
                      <span className={`badge border ${c.status === 'vigente' ? 'bg-green-50 text-green-700 border-green-200' : c.status === 'em_renovacao' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {LABELS_STATUS[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="td">
                      {c.urgencia && c.urgencia !== 'sem_data' && (
                        <span className={`badge border ${urgenciaColor(c.urgencia)} ${c.urgencia === 'critico' ? 'border-red-200' : c.urgencia === 'atencao' ? 'border-amber-200' : 'border-green-200'}`}>
                          {c.dias_para_vencer != null ? `${c.dias_para_vencer}d` : c.urgencia}
                        </span>
                      )}
                    </td>
                    <td className="td text-gray-300">›</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
