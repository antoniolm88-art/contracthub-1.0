// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente para uso no browser (Client Components)
export const createBrowserClient = () =>
  createClientComponentClient({ supabaseUrl, supabaseKey: supabaseAnonKey })

// Cliente para uso no servidor (Server Components e API Routes)
export const createServerClient = () =>
  createServerComponentClient({ cookies }, { supabaseUrl, supabaseKey: supabaseAnonKey })

// Cliente admin com service role (só para API Routes que precisam bypassar RLS)
export const createAdminClient = () =>
  createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

// Helpers de formatação
export function formatCurrency(value?: number | null): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export function urgenciaLabel(urgencia: string): string {
  const map: Record<string, string> = {
    critico: 'Crítico',
    atencao: 'Atenção',
    ok: 'OK',
    vencido: 'Vencido',
    sem_data: 'Sem data',
  }
  return map[urgencia] ?? urgencia
}

export function urgenciaColor(urgencia: string): string {
  const map: Record<string, string> = {
    critico: 'text-red-600 bg-red-50',
    atencao: 'text-amber-700 bg-amber-50',
    ok: 'text-green-700 bg-green-50',
    vencido: 'text-red-800 bg-red-100',
    sem_data: 'text-gray-500 bg-gray-100',
  }
  return map[urgencia] ?? 'text-gray-500 bg-gray-100'
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    vigente: 'text-green-700 bg-green-50 border-green-200',
    em_renovacao: 'text-blue-700 bg-blue-50 border-blue-200',
    encerrado: 'text-gray-600 bg-gray-100 border-gray-200',
    distratado: 'text-purple-700 bg-purple-50 border-purple-200',
    suspenso: 'text-orange-700 bg-orange-50 border-orange-200',
    vencido: 'text-red-700 bg-red-50 border-red-200',
    rascunho: 'text-gray-500 bg-gray-50 border-gray-200',
  }
  return map[status] ?? 'text-gray-500 bg-gray-100 border-gray-200'
}

export function areaColor(area: string): string {
  const map: Record<string, string> = {
    comercial: 'text-navy bg-navy-bg',
    compras_servicos: 'text-amber-800 bg-amber-50',
    prestacao_servicos: 'text-green-800 bg-green-50',
  }
  return map[area] ?? 'text-gray-600 bg-gray-100'
}
