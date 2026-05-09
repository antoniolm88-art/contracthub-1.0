-- ============================================================
-- ContractHub — Schema Supabase (PostgreSQL)
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Habilitar extensões
create extension if not exists "uuid-ossp";

-- ── ENUMS ──────────────────────────────────────────────────

create type status_contrato as enum (
  'vigente', 'em_renovacao', 'encerrado', 'distratado', 'suspenso', 'vencido', 'rascunho'
);

create type tipo_contrato as enum (
  'locacao_loja', 'quiosque', 'antena_telecom', 'evento', 'licenca_espaco',
  'servico_continuo', 'compra_fornecimento', 'manutencao',
  'administracao', 'prestacao_servicos', 'comercializacao', 'csc'
);

create type area_contrato as enum (
  'comercial', 'compras_servicos', 'prestacao_servicos'
);

create type subarea_contrato as enum (
  'lojas', 'quiosques', 'antenas', 'eventos',
  'operacoes', 'marketing', 'rh', 'financas', 'engenharia', 'tecnologia',
  'administracao', 'comercializacao', 'csc'
);

create type indice_reajuste as enum (
  'igpm', 'ipca', 'inpc', 'incc', 'fixo', 'outro'
);

create type tipo_documento as enum (
  'original', 'aditivo', 'renovacao', 'distrato', 'suspensao', 'retomada', 'outro'
);

create type papel_usuario as enum ('admin', 'editor', 'leitor');

create type canal_alerta as enum ('email', 'teams', 'inapp');

create type tipo_evento as enum (
  'criado', 'aditivo', 'renovacao', 'encerramento',
  'distrato', 'suspensao', 'retomada', 'status_alterado', 'documento_adicionado'
);

-- ── EMPREENDIMENTOS ────────────────────────────────────────

create table empreendimentos (
  id          uuid primary key default uuid_generate_v4(),
  nome        text not null,
  cnpj        text,
  cidade      text,
  uf          char(2),
  ativo       boolean default true,
  created_at  timestamptz default now()
);

insert into empreendimentos (nome, cnpj, cidade, uf) values
  ('Shopping Morumbi', '60.746.948/0001-12', 'São Paulo', 'SP'),
  ('Shopping Vila Olímpia', '12.345.678/0001-90', 'São Paulo', 'SP'),
  ('Shopping Anália Franco', '98.765.432/0001-11', 'São Paulo', 'SP');

-- ── PERFIS DE USUÁRIO ─────────────────────────────────────
-- Tabela de perfis vinculada ao auth.users do Supabase

create table perfis (
  id              uuid primary key references auth.users(id) on delete cascade,
  nome            text not null,
  email           text not null,
  papel_global    papel_usuario default 'leitor',
  avatar_url      text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Permissões por empreendimento
create table perfil_empreendimento (
  perfil_id          uuid references perfis(id) on delete cascade,
  empreendimento_id  uuid references empreendimentos(id) on delete cascade,
  papel              papel_usuario default 'leitor',
  primary key (perfil_id, empreendimento_id)
);

-- ── PARTES (fornecedores, locatários etc.) ────────────────

create table partes (
  id              uuid primary key default uuid_generate_v4(),
  razao_social    text not null,
  nome_fantasia   text,
  cnpj_cpf        text,
  email           text,
  telefone        text,
  cidade          text,
  uf              char(2),
  created_at      timestamptz default now()
);

-- ── CONTRATOS ─────────────────────────────────────────────

create table contratos (
  id                    uuid primary key default uuid_generate_v4(),
  numero                text not null,
  empreendimento_id     uuid not null references empreendimentos(id),
  tipo                  tipo_contrato not null,
  area                  area_contrato not null,
  subarea               subarea_contrato,
  status                status_contrato default 'vigente',
  objeto                text,
  marca                 text,
  localizacao           text,           -- loja, quiosque, cobertura etc.
  abl_m2                numeric(10,2),  -- área bruta locável

  -- Partes
  contratante_id        uuid references partes(id),
  contratada_id         uuid references partes(id),

  -- Datas
  data_assinatura       date,
  data_inicio           date,
  data_termino          date,
  data_renovacao_prev   date,

  -- Valores
  valor_mensal          numeric(15,2),
  valor_total           numeric(15,2),
  indice_reajuste       indice_reajuste default 'igpm',
  periodicidade_reajuste text default 'anual',

  -- Cláusulas-chave (texto livre extraído)
  clausula_multa        text,
  clausula_rescisao     text,
  clausula_renovacao    text,

  -- Responsável interno
  responsavel_id        uuid references perfis(id),
  responsavel_nome      text,  -- fallback quando usuário não está no sistema

  -- Contrato pai (para aditivos, renovações, distratos)
  contrato_pai_id       uuid references contratos(id),
  tipo_vinculo          tipo_documento,  -- como este contrato se vincula ao pai

  -- Metadados
  created_by            uuid references perfis(id),
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create index idx_contratos_empreendimento on contratos(empreendimento_id);
create index idx_contratos_status on contratos(status);
create index idx_contratos_termino on contratos(data_termino);
create index idx_contratos_area on contratos(area);
create index idx_contratos_pai on contratos(contrato_pai_id);

-- ── DOCUMENTOS (arquivos) ─────────────────────────────────

create table documentos (
  id                uuid primary key default uuid_generate_v4(),
  contrato_id       uuid not null references contratos(id) on delete cascade,
  tipo_doc          tipo_documento default 'original',
  nome_arquivo      text not null,
  storage_path      text not null,   -- path no Supabase Storage
  mime_type         text,
  tamanho_bytes     bigint,
  hash_sha256       text,
  versao            int default 1,

  -- Status de processamento IA
  status_ocr        text default 'pendente',  -- pendente, processando, concluido, erro
  status_extracao   text default 'pendente',
  confianca_media   numeric(3,2),             -- 0.00 a 1.00

  uploaded_by       uuid references perfis(id),
  uploaded_at       timestamptz default now()
);

create index idx_documentos_contrato on documentos(contrato_id);

-- ── METADADOS EXTRAÍDOS POR IA ────────────────────────────

create table metadados_extraidos (
  id                uuid primary key default uuid_generate_v4(),
  documento_id      uuid not null references documentos(id) on delete cascade,
  campo             text not null,          -- ex: 'valor_mensal', 'data_termino'
  valor_extraido    text,
  confianca         numeric(3,2),           -- 0.00 a 1.00
  valor_confirmado  text,                   -- valor após revisão humana
  confirmado_por    uuid references perfis(id),
  confirmado_at     timestamptz,
  created_at        timestamptz default now()
);

-- ── ALERTAS ───────────────────────────────────────────────

create table alertas_config (
  id                    uuid primary key default uuid_generate_v4(),
  empreendimento_id     uuid references empreendimentos(id),
  tipo_contrato         tipo_contrato,         -- null = aplica a todos
  area                  area_contrato,         -- null = aplica a todas
  dias_antecedencia     int not null,
  canal                 canal_alerta not null,
  destinatarios         text[],               -- emails
  ativo                 boolean default true,
  created_at            timestamptz default now()
);

-- Alertas disparados (log)
create table alertas_log (
  id              uuid primary key default uuid_generate_v4(),
  contrato_id     uuid not null references contratos(id),
  config_id       uuid references alertas_config(id),
  canal           canal_alerta,
  destinatarios   text[],
  dias_restantes  int,
  enviado_at      timestamptz default now(),
  status          text default 'enviado'
);

-- Configurações padrão de alerta
insert into alertas_config (empreendimento_id, dias_antecedencia, canal, ativo) values
  (null, 90, 'inapp', true),
  (null, 60, 'email', true),
  (null, 30, 'email', true),
  (null, 30, 'inapp', true);

-- ── EVENTOS DO CICLO DE VIDA ──────────────────────────────

create table eventos_ciclo_vida (
  id              uuid primary key default uuid_generate_v4(),
  contrato_id     uuid not null references contratos(id) on delete cascade,
  tipo_evento     tipo_evento not null,
  descricao       text,
  documento_id    uuid references documentos(id),
  usuario_id      uuid references perfis(id),
  usuario_nome    text,
  created_at      timestamptz default now()
);

create index idx_eventos_contrato on eventos_ciclo_vida(contrato_id);

-- ── AUDIT LOG ─────────────────────────────────────────────

create table audit_log (
  id              bigserial primary key,
  entidade        text not null,
  entidade_id     uuid not null,
  campo           text,
  valor_anterior  text,
  valor_novo      text,
  usuario_id      uuid,
  usuario_email   text,
  ip              text,
  created_at      timestamptz default now()
);

create index idx_audit_entidade on audit_log(entidade, entidade_id);

-- ── VIEWS ÚTEIS ───────────────────────────────────────────

-- View de contratos com dados completos para listagem
create or replace view v_contratos as
select
  c.*,
  e.nome                as empreendimento_nome,
  p_contratada.razao_social  as contratada_nome,
  p_contratada.cnpj_cpf      as contratada_cnpj,
  p_contratante.razao_social as contratante_nome,
  -- Dias até vencimento
  case
    when c.data_termino is null then null
    else (c.data_termino - current_date)
  end as dias_para_vencer,
  -- Semáforo de urgência
  case
    when c.data_termino is null then 'sem_data'
    when (c.data_termino - current_date) <= 0 then 'vencido'
    when (c.data_termino - current_date) <= 30 then 'critico'
    when (c.data_termino - current_date) <= 90 then 'atencao'
    else 'ok'
  end as urgencia,
  -- Contagem de documentos vinculados
  (select count(*) from documentos d where d.contrato_id = c.id) as total_documentos,
  -- Contagem de filhos (aditivos, renovações etc.)
  (select count(*) from contratos filho where filho.contrato_pai_id = c.id) as total_filhos
from contratos c
left join empreendimentos e on e.id = c.empreendimento_id
left join partes p_contratada on p_contratada.id = c.contratada_id
left join partes p_contratante on p_contratante.id = c.contratante_id;

-- View de KPIs para dashboard
create or replace view v_dashboard_kpis as
select
  e.id as empreendimento_id,
  e.nome as empreendimento,
  count(*) filter (where c.status not in ('encerrado','distratado')) as total_contratos,
  count(*) filter (where c.status = 'vigente') as vigentes,
  count(*) filter (where (c.data_termino - current_date) <= 30 and c.status = 'vigente') as criticos,
  count(*) filter (where (c.data_termino - current_date) between 31 and 90 and c.status = 'vigente') as atencao,
  sum(c.valor_mensal) filter (where c.status = 'vigente') as valor_mensal_total,
  count(*) filter (where c.area = 'comercial') as total_comercial,
  count(*) filter (where c.area = 'compras_servicos') as total_compras,
  count(*) filter (where c.area = 'prestacao_servicos') as total_prestacao
from contratos c
join empreendimentos e on e.id = c.empreendimento_id
group by e.id, e.nome;

-- ── ROW LEVEL SECURITY ────────────────────────────────────

alter table contratos enable row level security;
alter table documentos enable row level security;
alter table empreendimentos enable row level security;
alter table partes enable row level security;
alter table eventos_ciclo_vida enable row level security;
alter table alertas_log enable row level security;

-- Política: usuários autenticados veem empreendimentos ativos
create policy "empreendimentos_leitura" on empreendimentos
  for select to authenticated using (ativo = true);

-- Política: usuários veem contratos dos seus empreendimentos
-- (simplificado para o protótipo — admins veem tudo)
create policy "contratos_leitura" on contratos
  for select to authenticated using (true);

create policy "contratos_escrita" on contratos
  for all to authenticated using (true) with check (true);

create policy "documentos_leitura" on documentos
  for select to authenticated using (true);

create policy "documentos_escrita" on documentos
  for all to authenticated using (true) with check (true);

create policy "partes_leitura" on partes
  for select to authenticated using (true);

create policy "partes_escrita" on partes
  for all to authenticated using (true) with check (true);

create policy "eventos_leitura" on eventos_ciclo_vida
  for select to authenticated using (true);

create policy "eventos_escrita" on eventos_ciclo_vida
  for insert to authenticated with check (true);

create policy "alertas_log_leitura" on alertas_log
  for select to authenticated using (true);

-- ── DADOS DE EXEMPLO ─────────────────────────────────────

-- Partes
insert into partes (id, razao_social, nome_fantasia, cnpj_cpf, cidade, uf) values
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Shopping Morumbi S.A.', 'Shopping Morumbi', '60.746.948/0001-12', 'São Paulo', 'SP'),
  ('a1b2c3d4-0001-0001-0001-000000000002', 'Arezzo Indústria e Comércio S.A.', 'Arezzo', '16.590.234/0001-76', 'Belo Horizonte', 'MG'),
  ('a1b2c3d4-0001-0001-0001-000000000003', 'Lojas Renner S.A.', 'Renner', '92.754.738/0001-62', 'Porto Alegre', 'RS'),
  ('a1b2c3d4-0001-0001-0001-000000000004', 'H.M. Hennes & Mauritz Ltda.', 'H&M', '05.907.963/0001-51', 'São Paulo', 'SP'),
  ('a1b2c3d4-0001-0001-0001-000000000005', 'TIM S.A.', 'TIM', '02.421.421/0001-11', 'Rio de Janeiro', 'RJ'),
  ('a1b2c3d4-0001-0001-0001-000000000006', 'CleanPro Serviços Ltda.', 'CleanPro', '12.345.678/0001-99', 'São Paulo', 'SP'),
  ('a1b2c3d4-0001-0001-0001-000000000007', 'Grupo Protege S.A.', 'Grupo Protege', '02.345.678/0001-90', 'São Paulo', 'SP'),
  ('a1b2c3d4-0001-0001-0001-000000000008', 'Kibon Alimentos Ltda.', 'Kibon', '04.235.767/0001-28', 'São Paulo', 'SP'),
  ('a1b2c3d4-0001-0001-0001-000000000009', 'ShopAdmin Administração Ltda.', 'ShopAdmin', '08.888.888/0001-00', 'São Paulo', 'SP'),
  ('a1b2c3d4-0001-0001-0001-000000000010', 'AgênciaW Comunicação Ltda.', 'AgênciaW', '22.333.444/0001-55', 'São Paulo', 'SP');

-- Contratos de exemplo
insert into contratos (
  numero, empreendimento_id, tipo, area, subarea, status, objeto, marca, localizacao, abl_m2,
  contratante_id, contratada_id,
  data_assinatura, data_inicio, data_termino,
  valor_mensal, valor_total, indice_reajuste,
  clausula_multa, clausula_rescisao, clausula_renovacao,
  responsavel_nome
) values
(
  'CTR-2025-0312',
  (select id from empreendimentos where nome = 'Shopping Morumbi'),
  'locacao_loja', 'comercial', 'lojas', 'vigente',
  'Locação de espaço comercial para operação de loja de calçados e acessórios',
  'Arezzo', 'Loja 312 — Piso L2', 124,
  'a1b2c3d4-0001-0001-0001-000000000001', 'a1b2c3d4-0001-0001-0001-000000000002',
  '2025-01-15', '2025-02-01', '2026-12-31',
  32400, 777600, 'igpm',
  '3 aluguéis vigentes em caso de rescisão antecipada pelo locatário',
  'Prazo de 90 dias para notificação de rescisão por qualquer das partes',
  'Renovação automática por igual período salvo notificação 90 dias antes do término',
  'Ana Moreira'
),
(
  'CTR-2025-0307',
  (select id from empreendimentos where nome = 'Shopping Morumbi'),
  'servico_continuo', 'compras_servicos', 'operacoes', 'vigente',
  'Prestação de serviços de vigilância e segurança patrimonial',
  'Grupo Protege', null, null,
  'a1b2c3d4-0001-0001-0001-000000000001', 'a1b2c3d4-0001-0001-0001-000000000007',
  '2025-03-01', '2025-03-01', '2026-02-28',
  89600, 1075200, 'igpm',
  '30% do valor total restante em caso de rescisão antecipada',
  'Prazo de 60 dias para notificação de rescisão',
  'Renovação mediante termo aditivo com negociação de valores',
  'Carlos Lima'
),
(
  'CTR-2025-0301',
  (select id from empreendimentos where nome = 'Shopping Morumbi'),
  'antena_telecom', 'comercial', 'antenas', 'vigente',
  'Licença de uso de espaço para instalação de antena de telecomunicações 5G',
  'TIM', 'Cobertura — Torre Principal', null,
  'a1b2c3d4-0001-0001-0001-000000000001', 'a1b2c3d4-0001-0001-0001-000000000005',
  '2024-06-10', '2024-07-01', '2027-05-31',
  14200, 511200, 'ipca',
  '6 mensalidades em caso de rescisão antecipada',
  'Prazo de 120 dias para notificação de rescisão',
  'Renovação automática por 36 meses salvo notificação prévia de 120 dias',
  'Ana Moreira'
),
(
  'CTR-2024-0189',
  (select id from empreendimentos where nome = 'Shopping Morumbi'),
  'locacao_loja', 'comercial', 'lojas', 'vigente',
  'Locação de espaço comercial para operação de loja de moda',
  'H&M', 'Loja 142A — Piso L1', 290,
  'a1b2c3d4-0001-0001-0001-000000000001', 'a1b2c3d4-0001-0001-0001-000000000004',
  '2024-01-10', '2024-02-01', '2026-05-16',
  48500, 1164000, 'igpm',
  '3 aluguéis vigentes em caso de rescisão antecipada',
  'Prazo de 90 dias para notificação de rescisão',
  'Renovação a ser negociada 120 dias antes do término',
  'Carlos Lima'
),
(
  'CTR-2025-0021',
  (select id from empreendimentos where nome = 'Shopping Morumbi'),
  'servico_continuo', 'compras_servicos', 'operacoes', 'vigente',
  'Prestação de serviços de limpeza, conservação e higienização',
  'CleanPro', null, null,
  'a1b2c3d4-0001-0001-0001-000000000001', 'a1b2c3d4-0001-0001-0001-000000000006',
  '2025-01-02', '2025-01-02', '2026-05-20',
  31200, 546000, 'inpc',
  '2 mensalidades em caso de rescisão sem justa causa',
  'Prazo de 30 dias para notificação de rescisão por qualquer das partes',
  'Renovação mediante nova licitação ou termo aditivo',
  'Carlos Lima'
),
(
  'CTR-2025-0291',
  (select id from empreendimentos where nome = 'Shopping Morumbi'),
  'quiosque', 'comercial', 'quiosques', 'em_renovacao',
  'Locação de quiosque para comercialização de sorvetes e gelados',
  'Kibon', 'Quiosque Q-03 — Piso L1', 12,
  'a1b2c3d4-0001-0001-0001-000000000001', 'a1b2c3d4-0001-0001-0001-000000000008',
  '2025-08-01', '2025-08-01', '2026-07-31',
  6800, 81600, 'igpm',
  '1 mensalidade em caso de rescisão antecipada',
  'Prazo de 30 dias para notificação de rescisão',
  'Renovação automática por 12 meses',
  'Ana Moreira'
),
(
  'CTR-2025-0298',
  (select id from empreendimentos where nome = 'Shopping Morumbi'),
  'administracao', 'prestacao_servicos', 'administracao', 'vigente',
  'Contrato de administração e gestão do Shopping Morumbi',
  'ShopAdmin', null, null,
  'a1b2c3d4-0001-0001-0001-000000000001', 'a1b2c3d4-0001-0001-0001-000000000009',
  '2023-12-20', '2024-01-01', '2026-12-31',
  220000, 7920000, 'ipca',
  '12 mensalidades em caso de rescisão antecipada pelo contratante',
  'Prazo de 180 dias para notificação de rescisão por qualquer das partes',
  'Renovação automática por 36 meses',
  'Patrícia Souza'
),
(
  'CTR-2024-0155',
  (select id from empreendimentos where nome = 'Shopping Morumbi'),
  'servico_continuo', 'compras_servicos', 'marketing', 'vigente',
  'Prestação de serviços de marketing digital e gestão de redes sociais',
  'AgênciaW', null, null,
  'a1b2c3d4-0001-0001-0001-000000000001', 'a1b2c3d4-0001-0001-0001-000000000010',
  '2024-03-15', '2024-04-01', '2027-03-31',
  42000, 1512000, 'ipca',
  '3 mensalidades em caso de rescisão antecipada',
  'Prazo de 60 dias para notificação de rescisão',
  'Renovação automática por igual período',
  'Fernanda Costa'
);

-- Adicionar evento de criação para cada contrato
insert into eventos_ciclo_vida (contrato_id, tipo_evento, descricao, usuario_nome)
select id, 'criado', 'Contrato cadastrado no sistema', 'Sistema (migração)'
from contratos;
