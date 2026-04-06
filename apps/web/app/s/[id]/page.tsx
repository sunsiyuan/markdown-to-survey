import { notFound } from 'next/navigation'

import type { Survey } from '@mts/parser'

import { SurveyClosed } from '@/components/survey/SurveyClosed'
import { isSurveyClosed } from '@/lib/lifecycle'
import { SurveyForm } from '@/components/survey/SurveyForm'
import { supabase } from '@/lib/supabase'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function SurveyPage({ params }: PageProps) {
  const { id } = await params
  const { data, error } = await supabase
    .from('surveys')
    .select('id, title, schema, status, response_count, max_responses, expires_at')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) {
    notFound()
  }

  if (isSurveyClosed(data)) {
    return <SurveyClosed title={data.title} />
  }

  return <SurveyForm surveyId={data.id} survey={data.schema as Survey} />
}
