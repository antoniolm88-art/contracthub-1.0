# ContractHub — Protótipo Next.js + Supabase

## Stack
- **Frontend + API Routes:** Next.js 14 (App Router)
- **Banco de dados + Auth:** Supabase (PostgreSQL)
- **IA:** Claude API (Anthropic) — configurar depois
- **Estilos:** Tailwind CSS
- **Upload de arquivos:** Supabase Storage

---

## Passo 1 — Criar projeto no Supabase

1. Acesse https://supabase.com e crie uma conta gratuita
2. Clique em **New Project**
3. Defina nome: `contracthub`, senha forte, região: `South America (São Paulo)`
4. Aguarde ~2 minutos até o banco ficar pronto
5. Vá em **Settings → API** e copie:
   - `Project URL` → será sua `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → será sua `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → será sua `SUPABASE_SERVICE_ROLE_KEY`

---

## Passo 2 — Executar o schema SQL

No Supabase, vá em **SQL Editor** e cole o conteúdo do arquivo `supabase/schema.sql`.
Clique em **Run**. Isso cria todas as tabelas, índices e políticas RLS.

---

## Passo 3 — Abrir no StackBlitz

1. Acesse https://stackblitz.com/fork/nextjs
2. Delete todos os arquivos gerados automaticamente
3. Copie a estrutura de arquivos deste projeto conforme descrito abaixo
4. Crie o arquivo `.env.local` com suas variáveis (ver seção abaixo)

### Variáveis de ambiente (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...   # configurar depois
NEXTAUTH_SECRET=qualquer-string-aleatoria-longa
NEXTAUTH_URL=http://localhost:3000
```

---

## Estrutura de arquivos

```
contracthub/
├── .env.local
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── supabase/
│   └── schema.sql
└── src/
    ├── lib/
    │   ├── supabase.ts
    │   └── types.ts
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx                    ← login
    │   ├── dashboard/
    │   │   └── page.tsx
    │   ├── contratos/
    │   │   ├── page.tsx                ← listagem
    │   │   ├── novo/page.tsx           ← cadastro
    │   │   └── [id]/page.tsx           ← detalhe
    │   ├── alertas/page.tsx
    │   ├── relatorios/page.tsx
    │   └── api/
    │       ├── contratos/route.ts
    │       ├── contratos/[id]/route.ts
    │       ├── documentos/route.ts
    │       ├── alertas/route.ts
    │       └── agente/route.ts         ← Claude API
    └── components/
        ├── Layout.tsx
        ├── Sidebar.tsx
        ├── ContractCard.tsx
        ├── AlertBadge.tsx
        ├── AgentChat.tsx
        └── UploadZone.tsx
```
