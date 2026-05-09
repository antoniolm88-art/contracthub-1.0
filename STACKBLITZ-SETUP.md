# 🚀 Guia Passo a Passo — ContractHub no StackBlitz

## Tempo estimado: 10–15 minutos

---

## PARTE 1 — Configurar o Supabase (5 min)

### 1. Criar conta e projeto
1. Acesse **https://supabase.com** → clique em **Start your project**
2. Entre com GitHub ou crie uma conta
3. Clique em **New project**
4. Preencha:
   - **Name:** `contracthub`
   - **Database Password:** escolha uma senha forte e **guarde em lugar seguro**
   - **Region:** `South America (São Paulo)`
5. Clique em **Create new project** e aguarde ~2 minutos

### 2. Criar o banco de dados
1. No menu lateral, clique em **SQL Editor**
2. Clique em **New query**
3. Abra o arquivo `supabase/schema.sql` deste projeto
4. Cole todo o conteúdo no editor
5. Clique em **Run** (ou Ctrl+Enter)
6. Você deve ver: `Success. No rows returned`

### 3. Configurar o Storage (para upload de arquivos)
1. No menu lateral, clique em **Storage**
2. Clique em **New bucket**
3. Nome: `contratos`
4. Marque **Public bucket**: ❌ (deixar privado)
5. Clique em **Save**

### 4. Pegar as credenciais
1. No menu lateral, clique em **Settings** → **API**
2. Copie e guarde:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** (em Project API Keys) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (em Project API Keys) → `SUPABASE_SERVICE_ROLE_KEY`

### 5. Habilitar autenticação por e-mail
1. No menu lateral, clique em **Authentication** → **Providers**
2. Certifique-se que **Email** está habilitado (já vem por padrão)
3. Em **Authentication** → **URL Configuration**, defina:
   - **Site URL:** `https://seu-projeto.stackblitz.io` (você vai preencher depois)

---

## PARTE 2 — Abrir no StackBlitz (5 min)

### 1. Criar o projeto
1. Acesse **https://stackblitz.com**
2. Clique em **New Project** → selecione **Next.js**
3. O StackBlitz vai criar um projeto Next.js básico

### 2. Copiar os arquivos
Você precisa criar cada arquivo da estrutura abaixo.
Use o explorador de arquivos do StackBlitz (painel esquerdo).

**Estrutura completa:**
```
├── package.json          ← substituir pelo fornecido
├── next.config.js        ← criar
├── tailwind.config.js    ← criar
├── postcss.config.js     ← criar
└── src/
    ├── lib/
    │   ├── supabase.ts   ← criar
    │   └── types.ts      ← criar
    ├── app/
    │   ├── globals.css   ← criar
    │   ├── layout.tsx    ← criar
    │   ├── page.tsx      ← criar (login)
    │   ├── dashboard/
    │   │   └── page.tsx  ← criar
    │   ├── contratos/
    │   │   ├── page.tsx  ← criar
    │   │   ├── novo/
    │   │   │   └── page.tsx ← criar
    │   │   └── [id]/
    │   │       └── page.tsx ← criar
    │   ├── alertas/
    │   │   └── page.tsx  ← criar
    │   ├── relatorios/
    │   │   └── page.tsx  ← criar
    │   └── api/
    │       ├── agente/
    │       │   └── route.ts ← criar
    │       └── contratos/
    │           └── route.ts ← criar
    └── components/
        └── Sidebar.tsx   ← criar
```

### 3. Criar o arquivo .env.local
No StackBlitz, crie um arquivo chamado `.env.local` na raiz:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ANTHROPIC_API_KEY=sk-ant-api03-...
```

> ⚠️ Substitua os valores pelas suas credenciais reais do Supabase.
> A ANTHROPIC_API_KEY pode ser deixada como `sk-ant-configure-depois` por enquanto.

### 4. Instalar dependências
O StackBlitz instala automaticamente ao detectar o package.json.
Se necessário, abra o terminal e execute:
```bash
npm install
```

### 5. Iniciar o servidor
```bash
npm run dev
```

A aplicação vai abrir no preview do StackBlitz em `localhost:3000`.

---

## PARTE 3 — Primeiro acesso (2 min)

1. Na tela de login, clique em **Criar agora** para criar sua conta
2. Use qualquer e-mail e senha (mínimo 6 caracteres)
3. Após criar a conta, faça login com as mesmas credenciais
4. Você vai ver o **Dashboard** com os dados de exemplo já carregados

---

## PARTE 4 — Configurar o Agente de IA (opcional)

1. Acesse **https://console.anthropic.com**
2. Crie uma conta e vá em **API Keys**
3. Clique em **Create Key** e copie a chave
4. No arquivo `.env.local`, substitua:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-SUA-CHAVE-AQUI
   ```
5. Reinicie o servidor (`Ctrl+C` e `npm run dev`)
6. Abra qualquer contrato → aba **Agente IA** → o chat estará funcional

---

## O que funciona no protótipo

| Funcionalidade | Status |
|---|---|
| Login e cadastro de usuários | ✅ Funcional |
| Dashboard com KPIs reais do banco | ✅ Funcional |
| Listagem de contratos com filtros | ✅ Funcional |
| Cadastro de novo contrato | ✅ Funcional |
| Detalhe do contrato com timeline | ✅ Funcional |
| Hierarquia: original → aditivos | ✅ Funcional |
| Alertas de vencimento | ✅ Funcional |
| Relatórios por empreendimento | ✅ Funcional |
| Agente de IA (chat com Claude) | ✅ Funcional (requer API key) |
| Upload de documentos | 🔧 Interface pronta, storage configurado |
| OCR + extração por IA | 📅 Módulo 2 (próxima fase) |
| Notificações por e-mail/Teams | 📅 Módulo 1 backend (próxima fase) |

---

## Próximos passos após o protótipo

1. **Migrar dados reais** das planilhas usando o formulário de cadastro
2. **Configurar alertas por e-mail** via Supabase Edge Functions + Resend
3. **Implementar upload** de PDFs no Supabase Storage
4. **Adicionar pipeline OCR** com Google Cloud Vision ou AWS Textract
5. **Deploy em produção** com `vercel deploy` (gratuito no plano Hobby)

---

## Problemas comuns

**"Module not found: @supabase/auth-helpers-nextjs"**
→ Execute `npm install` no terminal do StackBlitz

**"Invalid API Key"**
→ Verifique se as variáveis no `.env.local` correspondem exatamente às do Supabase

**"relation v_contratos does not exist"**
→ O schema SQL não foi executado completamente. Tente executar novamente no SQL Editor

**Login não redireciona**
→ Configure o Site URL no Supabase Authentication → URL Configuration

---

## Suporte
Qualquer dúvida sobre a configuração, basta perguntar!
