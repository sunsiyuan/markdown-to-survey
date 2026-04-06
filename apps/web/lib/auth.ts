import { createHash } from 'node:crypto'

import { NextResponse } from 'next/server'

import { supabase } from '@/lib/supabase'

export type AuthResult = {
  keyId: string
}

export async function requireAuth(request: Request): Promise<AuthResult | Response> {
  const header = request.headers.get('Authorization')

  if (!header?.startsWith('Bearer mts_sk_')) {
    return NextResponse.json(
      { error: 'Missing or invalid Authorization header' },
      { status: 401 },
    )
  }

  const { data, error } = await supabase
    .from('api_keys')
    .select('id')
    .eq('key_hash', hashApiKey(header.slice(7)))
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  void supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)

  return { keyId: data.id }
}

export function hashApiKey(value: string) {
  return createHash('sha256').update(value).digest('hex')
}
