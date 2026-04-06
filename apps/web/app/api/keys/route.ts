import { nanoid } from 'nanoid'
import { NextResponse } from 'next/server'

import { hashApiKey, requireAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { name?: string } | null
  const name = body?.name?.trim() || null
  const id = nanoid(12)
  const key = `mts_sk_${nanoid(32)}`

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      id,
      key_hash: hashApiKey(key),
      name,
    })
    .select('id, name, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    {
      id: data.id,
      key,
      name: data.name,
      created_at: data.created_at,
    },
    { status: 201 },
  )
}

export async function GET(request: Request) {
  const auth = await requireAuth(request)
  if (auth instanceof Response) {
    return auth
  }

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, name, created_at, last_used_at')
    .eq('id', auth.keyId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
