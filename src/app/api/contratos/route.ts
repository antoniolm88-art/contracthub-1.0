// src/app/api/contratos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)
  const area = searchParams.get('area')
  const status = searchParams.get('status')
  const search = searchParams.get('q')
  const limit = parseInt(searchParams.get('limit') ?? '50')

  let query = supabase.from('v_contratos').select('*').order('created_at', { ascending: false }).limit(limit)
  if (area) query = query.eq('area', area)
  if (status) query = query.eq('status', status)
  if (search) query = query.or(`numero.ilike.%${search}%,marca.ilike.%${search}%,contratada_nome.ilike.%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const body = await req.json()
  const { data, error } = await supabase.from('contratos').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
