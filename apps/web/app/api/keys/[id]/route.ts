import { NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth'
import { sql } from '@/lib/db'

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

  try {
    // Soft-delete: a hard DELETE would violate the surveys.api_key_id foreign key
    // for any key that has created a survey. Stamping revoked_at makes requireAuth
    // reject the key while leaving survey ownership records intact.
    await sql`
      UPDATE api_keys
      SET revoked_at = now()
      WHERE id = ${auth.keyId}
        AND revoked_at IS NULL
    `

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Database error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
