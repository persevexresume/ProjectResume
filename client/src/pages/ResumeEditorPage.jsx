import { useSearchParams } from 'react-router-dom'
import ResumeEditor from '../components/templates/ResumeEditor'

export default function ResumeEditorPage() {
  const [searchParams] = useSearchParams()
  const templateId = searchParams.get('template') || 'neo-minimal'

  return <ResumeEditor templateId={templateId} />
}
