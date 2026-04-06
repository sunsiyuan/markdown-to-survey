import { NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireAuth(request)
  if (auth instanceof Response) {
    return auth
  }

  const { id } = await context.params

  if (id !== auth.keyId) {
    return NextResponse.json(
      { error: 'You can only revoke the current API key' },
      { status: 403 },
    )
  }

  const { error } = await supabase.from('api_keys').delete().eq('id', auth.keyId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
