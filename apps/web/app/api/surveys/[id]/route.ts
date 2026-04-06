import { NextResponse } from 'next/server'

import { supabase } from '@/lib/supabase'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const { data, error } = await supabase
    .from('surveys')
    .select('id, title, description, schema, response_count')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
