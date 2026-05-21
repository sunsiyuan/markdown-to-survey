import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import type { Survey } from '@/lib/survey'

import { SurveyClosed } from '@/components/survey/SurveyClosed'
import { isSurveyClosed } from '@/lib/lifecycle'
import { SurveyForm } from '@/components/survey/SurveyForm'
import { sql, parseJsonValue } from '@/lib/db'
import { extractTagsFromSearchParams } from '@/lib/metadata'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function SurveyPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const query = await searchParams
  const embedded = query.embed === '1'
  // Custom (non-reserved) query params are captured as response metadata for tagging.
  const tags = extractTagsFromSearchParams(query)

  const rows = (await sql`
    SELECT id, title, schema, status, response_count, max_responses, expires_at
    FROM surveys
    WHERE id = ${id}
    LIMIT 1
  `) as Array<{
    id: string
    title: string
    schema: unknown
    status: string
    response_count: number
    max_responses: number | null
    expires_at: string | null
  }>

  const data = rows[0]

  if (!data) {
    notFound()
  }

  // Embed-only: an inline script that posts `mounting` to the host the instant the
  // iframe HTML is parsed — well before the React bundle downloads and hydrates
  // (which is when `loaded` fires). Lets the host swap its blank spinner for a
  // skeleton during the cold load instead of waiting seconds for `loaded`.
  const mountingSignal = embedded ? (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{parent.postMessage({source:'humansurvey',type:'mounting',surveyId:${JSON.stringify(
          data.id,
        )}},'*')}catch(e){}})()`,
      }}
    />
  ) : null

  if (isSurveyClosed(data)) {
    return (
      <>
        {mountingSignal}
        <SurveyClosed title={data.title} surveyId={data.id} embedded={embedded} />
      </>
    )
  }

  return (
    <>
      {mountingSignal}
      <SurveyForm
        surveyId={data.id}
        survey={parseJsonValue<Survey>(data.schema)}
        embedded={embedded}
        metadata={tags}
      />
    </>
  )
}
