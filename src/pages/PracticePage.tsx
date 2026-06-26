import { Link, useParams } from 'react-router-dom'
import { CONCEPTS, type ConceptId } from '../lib/physics'
import { PracticeSession } from '../components/PracticeSession'

export function PracticePage() {
  const { conceptId } = useParams<{ conceptId: string }>()
  const valid = !!conceptId && conceptId in CONCEPTS

  if (!valid) {
    return (
      <div className="practice practice--empty">
        <p>That practice topic doesn't exist.</p>
        <Link to="/" className="btn btn--primary">
          Back to course
        </Link>
      </div>
    )
  }

  return <PracticeSession conceptId={conceptId as ConceptId} />
}
