// src/lib/types.ts
export type StatusContrato = 'vigente' | 'em_renovacao' | 'encerrado' | 'distratado' | 'suspenso' | 'vencido' | 'rascunho'
export type TipoContrato = 'locacao_loja' | 'quiosque' | 'antena_telecom' | 'evento' | 'licenca_espaco' | 'servico_continuo' | 'compra_fornecimento' | 'manutencao' | 'administracao' | 'prestacao_servicos' | 'comercializacao' | 'csc'
export type AreaContrato = 'comercial' | 'compras_servicos' | 'prestacao_servicos'
export type SubareaContrato = 'lojas' | 'quiosques' | 'antenas' | 'eventos' | 'operacoes' | 'marketing' | 'rh' | 'financas' | 'engenharia' | 'tecnologia' | 'administracao' | 'comercializacao' | 'csc'
export type IndiceReajuste = 'igpm' | 'ipca' | 'inpc' | 'incc' | 'fixo' | 'outro'
export type TipoDocumento = 'original' | 'aditivo' | 'renovacao' | 'distrato' | 'suspensao' | 'retomada' | 'outro'
export type Urgencia = 'ok' | 'atencao' | 'critico' | 'vencido' | 'sem_data'

export interface Empreendimento {
  id: string
  nome: string
  cnpj?: string
  cidade?: string
  uf?: string
  ativo: boolean
  created_at: string
}

export interface Parte {
  id: string
  razao_social: string
  nome_fantasia?: string
  cnpj_cpf?: string
  email?: string
  telefone?: string
  cidade?: string
  uf?: string
}

export interface Contrato {
  id: string
  numero: string
  empreendimento_id: string
  tipo: TipoContrato
  area: AreaContrato
  subarea?: SubareaContrato
  status: StatusContrato
  objeto?: string
  marca?: string
  localizacao?: string
  abl_m2?: number
  contratante_id?: string
  contratada_id?: string
  data_assinatura?: string
  data_inicio?: string
  data_termino?: string
  data_renovacao_prev?: string
  valor_mensal?: number
  valor_total?: number
  indice_reajuste?: IndiceReajuste
  periodicidade_reajuste?: string
  clausula_multa?: string
  clausula_rescisao?: string
  clausula_renovacao?: string
  responsavel_id?: string
  responsavel_nome?: string
  contrato_pai_id?: string
  tipo_vinculo?: TipoDocumento
  created_by?: string
  created_at: string
  updated_at: string
}

// View enriquecida
export interface ContratoView extends Contrato {
  empreendimento_nome: string
  contratada_nome?: string
  contratada_cnpj?: string
  contratante_nome?: string
  dias_para_vencer?: number
  urgencia: Urgencia
  total_documentos: number
  total_filhos: number
}

export interface Documento {
  id: string
  contrato_id: string
  tipo_doc: TipoDocumento
  nome_arquivo: string
  storage_path: string
  mime_type?: string
  tamanho_bytes?: number
  versao: number
  status_ocr: string
  status_extracao: string
  confianca_media?: number
  uploaded_by?: string
  uploaded_at: string
}

export interface EventoCicloVida {
  id: string
  contrato_id: string
  tipo_evento: string
  descricao?: string
  documento_id?: string
  usuario_id?: string
  usuario_nome?: string
  created_at: string
}

export interface DashboardKPIs {
  empreendimento_id: string
  empreendimento: string
  total_contratos: number
  vigentes: number
  criticos: number
  atencao: number
  valor_mensal_total: number
  total_comercial: number
  total_compras: number
  total_prestacao: number
}

// Labels para exibição
export const LABELS_TIPO: Record<TipoContrato, string> = {
  locacao_loja: 'Locação de Loja',
  quiosque: 'Quiosque',
  antena_telecom: 'Antena/Telecom',
  evento: 'Evento',
  licenca_espaco: 'Licença de Espaço',
  servico_continuo: 'Serviço Contínuo',
  compra_fornecimento: 'Compra/Fornecimento',
  manutencao: 'Manutenção',
  administracao: 'Administração',
  prestacao_servicos: 'Prestação de Serviços',
  comercializacao: 'Comercialização',
  csc: 'CSC',
}

export const LABELS_AREA: Record<AreaContrato, string> = {
  comercial: 'Comercial',
  compras_servicos: 'Compras & Serviços',
  prestacao_servicos: 'Prestação de Serviços',
}

export const LABELS_STATUS: Record<StatusContrato, string> = {
  vigente: 'Vigente',
  em_renovacao: 'Em Renovação',
  encerrado: 'Encerrado',
  distratado: 'Distratado',
  suspenso: 'Suspenso',
  vencido: 'Vencido',
  rascunho: 'Rascunho',
}

export const LABELS_INDICE: Record<IndiceReajuste, string> = {
  igpm: 'IGPM', ipca: 'IPCA', inpc: 'INPC', incc: 'INCC', fixo: 'Fixo', outro: 'Outro',
}

export const TIPOS_POR_AREA: Record<AreaContrato, TipoContrato[]> = {
  comercial: ['locacao_loja', 'quiosque', 'antena_telecom', 'evento', 'licenca_espaco'],
  compras_servicos: ['servico_continuo', 'compra_fornecimento', 'manutencao'],
  prestacao_servicos: ['administracao', 'prestacao_servicos', 'comercializacao', 'csc'],
}
