'use client'
// src/app/contratos/[id]/page.tsx
import { useEffect, useState, useRef } from 'react'
import { createBrowserClient, formatCurrency, formatDate, statusColor, areaColor } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { LABELS_AREA, LABELS_TIPO, LABELS_STATUS, LABELS_INDICE, type ContratoView, type EventoCicloVida, type Documento } from '@/lib/types'

interface Message { role: 'user' | 'assistant'; content: string }

export default function ContratoDetailPage({ params }: { params: { id: string } }) {
  const supabase = createBrowserClient()
  const [contrato, setContrato] = useState<ContratoView | null>(null)
  const [eventos, setEventos] = useState<EventoCicloVida[]>([])
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [filhos, setFilhos] = useState<ContratoView[]>([])
  const [userEmail, setUserEmail] = useState('')
  const [tab, setTab] = useState<'historico' | 'docs' | 'agente'>('historico')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá! Posso analisar este contrato, responder perguntas sobre suas cláusulas, comparar com outros contratos ou identificar riscos. Como posso ajudar?' }
  ])
  const [agentInput, setAgentInput] = useState('')
  const [agentLoading, setAgentLoading] = useState(false)
  const msgEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? ''))
    fetchData()
  }, [params.id])

  async function fetchData() {
    const [{ data: c }, { data: ev }, { data: docs }, { data: ch }] = await Promise.all([
      supabase.from('v_contratos').select('*').eq('id', params.id).single(),
      supabase.from('eventos_ciclo_vida').select('*').eq('contrato_id', params.id).order('created_at', { ascending: true }),
      supabase.from('documentos').select('*').eq('contrato_id', params.id).order('uploaded_at', { ascending: false }),
      supabase.from('v_contratos').select('*').eq('contrato_pai_id', params.id).order('created_at'),
    ])
    setContrato(c as ContratoView)
    setEventos(ev ?? [])
    setDocumentos(docs ?? [])
    setFilhos((ch ?? []) as ContratoView[])
  }

  async function sendToAgent() {
    if (!agentInput.trim() || agentLoading) return
    const userMsg: Message = { role: 'user', content: agentInput }
    setMessages(prev => [...prev, userMsg])
    setAgentInput('')
    setAgentLoading(true)
    try {
      const res = await fetch('/api/agente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg], contrato }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.content ?? 'Erro ao processar sua pergunta.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Não foi possível conectar ao agente. Configure a ANTHROPIC_API_KEY no .env.local.' }])
    } finally {
      setAgentLoading(false)
    }
    setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  if (!contrato) return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userEmail={userEmail} />
      <div className="flex-1 flex items-center justify-center text-gray-400">Carregando...</div>
    </div>
  )

  const tipoEvento: Record<string, { icon: string; color: string }> = {
    criado:    { icon: '📄', color: 'bg-[#1B3A5C]' },
    aditivo:   { icon: '📝', color: 'bg-[#C8923A]' },
    renovacao: { icon: '🔄', color: 'bg-green-600' },
    encerramento: { icon: '✅', color: 'bg-gray-500' },
    distrato:  { icon: '❌', color: 'bg-red-500' },
    suspensao: { icon: '⏸️', color: 'bg-amber-500' },
    retomada:  { icon: '▶️', color: 'bg-blue-500' },
    documento_adicionado: { icon: '📎', color: 'bg-indigo-500' },
    status_alterado: { icon: '🔀', color: 'bg-purple-500' },
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userEmail={userEmail} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-3 flex-shrink-0 shadow-sm">
          <Link href="/contratos" className="text-gray-400 hover:text-gray-700 text-sm">← Contratos</Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-500 font-mono">{contrato.numero}</span>
          <div className="flex-1" />
          <button className="btn btn-secondary text-xs py-1.5">📥 PDF</button>
          <button className="btn btn-secondary text-xs py-1.5">✏️ Editar</button>
          <Link href="/contratos/novo" className="btn btn-primary text-xs py-1.5">+ Aditivo</Link>
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* Hero */}
          <div className="bg-white border-b border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#1B3A5C] rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">
                {contrato.area === 'comercial' ? '🏬' : contrato.area === 'compras_servicos' ? '📦' : '🤝'}
              </div>
              <div className="flex-1">
                <h1 className="text-lg font-bold text-gray-900 mb-1">
                  {contrato.marca ? `${contrato.marca} — ` : ''}{contrato.contratada_nome ?? contrato.numero}
                  {contrato.localizacao ? ` (${contrato.localizacao})` : ''}
                </h1>
                <p className="text-xs text-gray-400 font-mono mb-3">{contrato.numero} · Assinado em {formatDate(contrato.data_assinatura)}</p>
                <div className="flex flex-wrap gap-2">
                  <span className={`badge border ${statusColor(contrato.status)}`}>{LABELS_STATUS[contrato.status] ?? contrato.status}</span>
                  <span className={`badge border border-transparent ${areaColor(contrato.area)}`}>{LABELS_AREA[contrato.area]}</span>
                  <span className="badge bg-gray-100 text-gray-600 border-gray-200">{LABELS_TIPO[contrato.tipo]}</span>
                  {contrato.empreendimento_nome && <span className="badge bg-gray-100 text-gray-500 border-gray-200">🏢 {contrato.empreendimento_nome}</span>}
                  {contrato.urgencia === 'critico' && <span className="badge bg-red-50 text-red-700 border-red-200">⚠️ Vence em {contrato.dias_para_vencer} dias</span>}
                  {contrato.urgencia === 'atencao' && <span className="badge bg-amber-50 text-amber-700 border-amber-200">⏰ Vence em {contrato.dias_para_vencer} dias</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Fields grid */}
          <div className="grid grid-cols-3 bg-white border-b border-gray-200">
            {[
              ['Contratante', contrato.contratante_nome ?? '—'],
              ['Contratada', contrato.contratada_nome ?? '—'],
              ['CNPJ Contratada', contrato.contratada_cnpj ?? '—'],
              ['Data de Assinatura', formatDate(contrato.data_assinatura)],
              ['Início de Vigência', formatDate(contrato.data_inicio)],
              ['Término de Vigência', formatDate(contrato.data_termino)],
              ['Valor Mensal', formatCurrency(contrato.valor_mensal)],
              ['Índice de Reajuste', contrato.indice_reajuste ? LABELS_INDICE[contrato.indice_reajuste] : '—'],
              ['ABL / Localização', contrato.abl_m2 ? `${contrato.abl_m2} m²` : contrato.localizacao ?? '—'],
              ['Objeto', contrato.objeto ?? '—'],
              ['Responsável', contrato.responsavel_nome ?? '—'],
              ['Empreendimento', contrato.empreendimento_nome ?? '—'],
            ].map(([label, value]) => (
              <div key={label} className="p-4 border-r border-b border-gray-100 last:border-r-0">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-sm font-medium text-gray-800">{value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="bg-white border-b border-gray-200 px-6 flex gap-0">
            {(['historico', 'docs', 'agente'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-3 text-sm border-b-2 transition-colors ${tab === t ? 'text-[#1B3A5C] border-[#1B3A5C] font-semibold' : 'text-gray-500 border-transparent hover:text-gray-700'}`}>
                {t === 'historico' ? `📋 Histórico & Aditivos ${filhos.length > 0 ? `(${filhos.length + 1})` : ''}` : t === 'docs' ? `📎 Documentos (${documentos.length})` : '🤖 Agente IA'}
              </button>
            ))}
          </div>

          {/* Tab: Histórico */}
          {tab === 'historico' && (
            <div className="p-6 max-w-3xl">
              <div className="relative">
                {/* Linha vertical */}
                <div className="absolute left-3.5 top-4 bottom-4 w-0.5 bg-gray-200" />
                <div className="space-y-4">
                  {/* Contrato original */}
                  <div className="flex gap-4 items-start">
                    <div className="w-7 h-7 rounded-full bg-[#1B3A5C] flex items-center justify-center text-xs flex-shrink-0 z-10">📄</div>
                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm text-gray-900">Contrato Original — {contrato.numero}</p>
                        <span className="text-xs text-gray-400 font-mono">{formatDate(contrato.data_assinatura)}</span>
                      </div>
                      <p className="text-xs text-gray-500">Vigência: {formatDate(contrato.data_inicio)} a {formatDate(contrato.data_termino)} · {formatCurrency(contrato.valor_mensal)}/mês</p>
                    </div>
                  </div>

                  {/* Filhos (aditivos, renovações etc.) */}
                  {filhos.map(filho => (
                    <div key={filho.id} className="flex gap-4 items-start">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 z-10 ${filho.tipo_vinculo === 'aditivo' ? 'bg-[#C8923A]' : filho.tipo_vinculo === 'renovacao' ? 'bg-green-600' : 'bg-red-500'}`}>
                        {filho.tipo_vinculo === 'aditivo' ? '📝' : filho.tipo_vinculo === 'renovacao' ? '🔄' : '❌'}
                      </div>
                      <Link href={`/contratos/${filho.id}`} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:bg-white transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm text-gray-900 capitalize">{filho.tipo_vinculo?.replace('_', ' ')} — {filho.numero}</p>
                          <span className="text-xs text-gray-400 font-mono">{formatDate(filho.data_assinatura)}</span>
                        </div>
                        <p className="text-xs text-gray-500">{filho.objeto ?? ''} · {formatCurrency(filho.valor_mensal)}/mês</p>
                      </Link>
                    </div>
                  ))}

                  {/* Eventos */}
                  {eventos.filter(e => e.tipo_evento !== 'criado').map(ev => {
                    const meta = tipoEvento[ev.tipo_evento] ?? { icon: '•', color: 'bg-gray-400' }
                    return (
                      <div key={ev.id} className="flex gap-4 items-start">
                        <div className={`w-7 h-7 rounded-full ${meta.color} flex items-center justify-center text-xs flex-shrink-0 z-10`}>{meta.icon}</div>
                        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-sm text-gray-900 capitalize">{ev.tipo_evento.replace('_', ' ')}</p>
                            <span className="text-xs text-gray-400 font-mono">{new Date(ev.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                          {ev.descricao && <p className="text-xs text-gray-500">{ev.descricao}</p>}
                          {ev.usuario_nome && <p className="text-xs text-gray-400 mt-1">por {ev.usuario_nome}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Documentos */}
          {tab === 'docs' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">{documentos.length} documento(s) vinculado(s)</p>
                <button className="btn btn-primary text-xs py-1.5">⬆️ Adicionar documento</button>
              </div>
              {documentos.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-4xl mb-3">📎</p>
                  <p>Nenhum documento cadastrado ainda.</p>
                  <p className="text-sm mt-1">Faça upload do contrato original ou de aditivos.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documentos.map(doc => (
                    <div key={doc.id} className="card p-4 flex items-center gap-4">
                      <span className="text-2xl">{doc.mime_type?.includes('pdf') ? '📕' : '📄'}</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-800">{doc.nome_arquivo}</p>
                        <p className="text-xs text-gray-400">{doc.tipo_doc} · {doc.tamanho_bytes ? `${(doc.tamanho_bytes / 1024 / 1024).toFixed(1)} MB` : '—'} · v{doc.versao}</p>
                      </div>
                      <span className={`badge ${doc.status_ocr === 'concluido' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'} border`}>
                        {doc.status_ocr}
                      </span>
                      <button className="btn btn-ghost btn-secondary text-xs py-1">⬇️</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Agente IA */}
          {tab === 'agente' && (
            <div className="flex flex-col" style={{ height: 'calc(100vh - 280px)' }}>
              {/* Chips */}
              <div className="p-4 pb-2 flex flex-wrap gap-2 border-b border-gray-100">
                {['Faça um resumo executivo deste contrato', 'Quais são os principais riscos deste contrato?', 'Explique a cláusula de multa', 'Quando ocorre renovação automática?'].map(chip => (
                  <button key={chip} onClick={() => { setAgentInput(chip); }}
                    className="text-xs px-3 py-1.5 bg-navy-bg text-[#1B3A5C] rounded-full border border-blue-100 hover:bg-blue-100 transition-colors">
                    {chip}
                  </button>
                ))}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.role === 'assistant' && (
                      <div className="w-7 h-7 bg-[#1B3A5C] rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-1">🤖</div>
                    )}
                    <div className={`max-w-lg px-4 py-3 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-[#1B3A5C] text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {agentLoading && (
                  <div className="flex justify-start">
                    <div className="w-7 h-7 bg-[#1B3A5C] rounded-full flex items-center justify-center text-xs mr-2">🤖</div>
                    <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm">
                      <div className="flex gap-1.5 items-center">
                        {[0, 150, 300].map(d => (
                          <div key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={msgEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200 flex gap-3">
                <input
                  value={agentInput}
                  onChange={e => setAgentInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendToAgent()}
                  placeholder="Pergunte sobre este contrato…"
                  className="flex-1 input"
                />
                <button onClick={sendToAgent} disabled={agentLoading || !agentInput.trim()}
                  className="btn btn-primary px-4 py-2 disabled:opacity-50">
                  ➤
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
