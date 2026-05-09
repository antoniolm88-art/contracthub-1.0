'use client'
// src/app/contratos/novo/page.tsx
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { useRouter } from 'next/navigation'
import { TIPOS_POR_AREA, LABELS_TIPO, type AreaContrato, type TipoContrato } from '@/lib/types'

export default function NovoContratoPage() {
  const supabase = createBrowserClient()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState('')
  const [empreendimentos, setEmpreendimentos] = useState<any[]>([])
  const [partes, setPartes] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    numero: '', empreendimento_id: '', tipo: '' as TipoContrato | '',
    area: '' as AreaContrato | '', subarea: '', status: 'vigente',
    objeto: '', marca: '', localizacao: '', abl_m2: '',
    contratante_id: '', contratada_id: '',
    data_assinatura: '', data_inicio: '', data_termino: '', data_renovacao_prev: '',
    valor_mensal: '', valor_total: '', indice_reajuste: 'igpm', periodicidade_reajuste: 'anual',
    clausula_multa: '', clausula_rescisao: '', clausula_renovacao: '',
    responsavel_nome: '',
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? ''))
    supabase.from('empreendimentos').select('id, nome').eq('ativo', true).then(({ data }) => setEmpreendimentos(data ?? []))
    supabase.from('partes').select('id, razao_social, nome_fantasia').order('razao_social').then(({ data }) => setPartes(data ?? []))
  }, [])

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    if (field === 'area') setForm(f => ({ ...f, area: value as AreaContrato, tipo: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.numero || !form.empreendimento_id || !form.tipo || !form.area) {
      setError('Preencha os campos obrigatórios: Número, Empreendimento, Área e Tipo.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const payload: any = {
        ...form,
        abl_m2: form.abl_m2 ? parseFloat(form.abl_m2) : null,
        valor_mensal: form.valor_mensal ? parseFloat(form.valor_mensal.replace(/\D/g, '')) / 100 : null,
        valor_total: form.valor_total ? parseFloat(form.valor_total.replace(/\D/g, '')) / 100 : null,
        contratante_id: form.contratante_id || null,
        contratada_id: form.contratada_id || null,
        data_assinatura: form.data_assinatura || null,
        data_inicio: form.data_inicio || null,
        data_termino: form.data_termino || null,
        data_renovacao_prev: form.data_renovacao_prev || null,
        subarea: form.subarea || null,
        created_by: user?.id,
      }
      const { data, error: insertError } = await supabase.from('contratos').insert(payload).select().single()
      if (insertError) throw insertError

      // Evento de criação
      await supabase.from('eventos_ciclo_vida').insert({
        contrato_id: data.id, tipo_evento: 'criado',
        descricao: 'Contrato cadastrado no sistema',
        usuario_nome: user?.email,
      })

      router.push(`/contratos/${data.id}`)
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar contrato')
    } finally {
      setSaving(false)
    }
  }

  const tiposDisponiveis = form.area ? TIPOS_POR_AREA[form.area as AreaContrato] : []

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userEmail={userEmail} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-3 flex-shrink-0 shadow-sm">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-700 text-sm">← Voltar</button>
          <span className="text-gray-300">/</span>
          <h1 className="text-base font-semibold text-gray-900">Novo Contrato</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">

            {/* Identificação */}
            <div className="card p-6">
              <h2 className="font-semibold text-sm text-gray-700 mb-4 uppercase tracking-wider">Classificação</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Número do Contrato *</label>
                  <input className="input" placeholder="CTR-2025-XXXX" value={form.numero} onChange={e => set('numero', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Empreendimento *</label>
                  <select className="select" value={form.empreendimento_id} onChange={e => set('empreendimento_id', e.target.value)} required>
                    <option value="">Selecionar...</option>
                    {empreendimentos.map(emp => <option key={emp.id} value={emp.id}>{emp.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Área *</label>
                  <select className="select" value={form.area} onChange={e => set('area', e.target.value)} required>
                    <option value="">Selecionar...</option>
                    <option value="comercial">Comercial</option>
                    <option value="compras_servicos">Compras & Serviços</option>
                    <option value="prestacao_servicos">Prestação de Serviços</option>
                  </select>
                </div>
                <div>
                  <label className="label">Tipo de Contrato *</label>
                  <select className="select" value={form.tipo} onChange={e => set('tipo', e.target.value)} required disabled={!form.area}>
                    <option value="">Selecionar área primeiro</option>
                    {tiposDisponiveis.map(t => <option key={t} value={t}>{LABELS_TIPO[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Subárea</label>
                  <select className="select" value={form.subarea} onChange={e => set('subarea', e.target.value)}>
                    <option value="">—</option>
                    {form.area === 'comercial' && <>
                      <option value="lojas">Lojas</option>
                      <option value="quiosques">Quiosques</option>
                      <option value="antenas">Antenas</option>
                      <option value="eventos">Eventos</option>
                    </>}
                    {form.area === 'compras_servicos' && <>
                      <option value="operacoes">Operações</option>
                      <option value="marketing">Marketing</option>
                      <option value="rh">RH</option>
                      <option value="financas">Finanças</option>
                      <option value="engenharia">Engenharia</option>
                      <option value="tecnologia">Tecnologia</option>
                    </>}
                    {form.area === 'prestacao_servicos' && <>
                      <option value="administracao">Administração</option>
                      <option value="comercializacao">Comercialização</option>
                      <option value="csc">CSC</option>
                    </>}
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
                    <option value="vigente">Vigente</option>
                    <option value="em_renovacao">Em Renovação</option>
                    <option value="encerrado">Encerrado</option>
                    <option value="distratado">Distratado</option>
                    <option value="rascunho">Rascunho</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Partes */}
            <div className="card p-6">
              <h2 className="font-semibold text-sm text-gray-700 mb-4 uppercase tracking-wider">Partes</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Contratante</label>
                  <select className="select" value={form.contratante_id} onChange={e => set('contratante_id', e.target.value)}>
                    <option value="">Selecionar parte...</option>
                    {partes.map(p => <option key={p.id} value={p.id}>{p.nome_fantasia ?? p.razao_social}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Contratada</label>
                  <select className="select" value={form.contratada_id} onChange={e => set('contratada_id', e.target.value)}>
                    <option value="">Selecionar parte...</option>
                    {partes.map(p => <option key={p.id} value={p.id}>{p.nome_fantasia ?? p.razao_social}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Marca / Nome Comercial</label>
                  <input className="input" placeholder="Ex: Arezzo, CleanPro…" value={form.marca} onChange={e => set('marca', e.target.value)} />
                </div>
                <div>
                  <label className="label">Localização (loja, quiosque…)</label>
                  <input className="input" placeholder="Loja 312 — Piso L2" value={form.localizacao} onChange={e => set('localizacao', e.target.value)} />
                </div>
                <div>
                  <label className="label">ABL (m²)</label>
                  <input className="input" type="number" placeholder="124" value={form.abl_m2} onChange={e => set('abl_m2', e.target.value)} />
                </div>
                <div>
                  <label className="label">Responsável Interno</label>
                  <input className="input" placeholder="Nome do responsável" value={form.responsavel_nome} onChange={e => set('responsavel_nome', e.target.value)} />
                </div>
              </div>
              <div className="mt-4">
                <label className="label">Objeto do Contrato</label>
                <textarea className="input h-20 resize-none" placeholder="Descreva o objeto do contrato…" value={form.objeto} onChange={e => set('objeto', e.target.value)} />
              </div>
            </div>

            {/* Datas e Valores */}
            <div className="card p-6">
              <h2 className="font-semibold text-sm text-gray-700 mb-4 uppercase tracking-wider">Datas e Valores</h2>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="label">Data de Assinatura</label><input className="input" type="date" value={form.data_assinatura} onChange={e => set('data_assinatura', e.target.value)} /></div>
                <div><label className="label">Início de Vigência</label><input className="input" type="date" value={form.data_inicio} onChange={e => set('data_inicio', e.target.value)} /></div>
                <div><label className="label">Término de Vigência</label><input className="input" type="date" value={form.data_termino} onChange={e => set('data_termino', e.target.value)} /></div>
                <div><label className="label">Valor Mensal (R$)</label><input className="input" placeholder="R$ 0,00" value={form.valor_mensal} onChange={e => set('valor_mensal', e.target.value)} /></div>
                <div><label className="label">Índice de Reajuste</label>
                  <select className="select" value={form.indice_reajuste} onChange={e => set('indice_reajuste', e.target.value)}>
                    <option value="igpm">IGPM</option><option value="ipca">IPCA</option>
                    <option value="inpc">INPC</option><option value="incc">INCC</option>
                    <option value="fixo">Fixo</option><option value="outro">Outro</option>
                  </select>
                </div>
                <div><label className="label">Periodicidade</label>
                  <select className="select" value={form.periodicidade_reajuste} onChange={e => set('periodicidade_reajuste', e.target.value)}>
                    <option value="anual">Anual</option><option value="semestral">Semestral</option>
                    <option value="mensal">Mensal</option><option value="unico">Único</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cláusulas-chave */}
            <div className="card p-6">
              <h2 className="font-semibold text-sm text-gray-700 mb-4 uppercase tracking-wider">Cláusulas-chave</h2>
              <div className="space-y-4">
                <div><label className="label">Cláusula de Multa</label><textarea className="input h-16 resize-none" value={form.clausula_multa} onChange={e => set('clausula_multa', e.target.value)} placeholder="Descreva a cláusula de multa…" /></div>
                <div><label className="label">Cláusula de Rescisão</label><textarea className="input h-16 resize-none" value={form.clausula_rescisao} onChange={e => set('clausula_rescisao', e.target.value)} placeholder="Condições de rescisão…" /></div>
                <div><label className="label">Cláusula de Renovação</label><textarea className="input h-16 resize-none" value={form.clausula_renovacao} onChange={e => set('clausula_renovacao', e.target.value)} placeholder="Condições de renovação automática ou negociada…" /></div>
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-200">{error}</p>}

            <div className="flex gap-3 justify-end pb-6">
              <button type="button" onClick={() => router.back()} className="btn btn-secondary">Cancelar</button>
              <button type="submit" disabled={saving} className="btn btn-primary min-w-32 justify-center">
                {saving ? 'Salvando…' : '✓ Salvar Contrato'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
