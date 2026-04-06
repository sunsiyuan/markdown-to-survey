import { notFound } from 'next/navigation'

import type { Survey } from '@mts/parser'

import { SurveyForm } from '@/components/survey/SurveyForm'
import { supabase } from '@/lib/supabase'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function SurveyPage({ params }: PageProps) {
  const { id } = await params
  const { data, error } = await supabase
    .from('surveys')
    .select('id, schema')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) {
    notFound()
  }

  return <SurveyForm surveyId={data.id} survey={data.schema as Survey} />
}
