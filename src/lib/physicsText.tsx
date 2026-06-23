import type { ReactNode } from 'react'

const PHYS =
  /(Δ)([A-Z])_([a-z0-9]+)|(Δ)([A-Z]+)|([A-Z])_([a-z0-9]+)|(μ)_([a-z0-9]+)/g

function parsePhysicsTokens(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let last = 0
  let i = 0
  let match: RegExpExecArray | null

  PHYS.lastIndex = 0
  while ((match = PHYS.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index))
    }

    const key = `${keyPrefix}-${i++}`

    if (match[1] && match[2] && match[3]) {
      nodes.push(
        <span key={key} className="phys">
          <span className="phys-delta">Δ</span>
          {match[2]}
          <sub className="phys-sub">{match[3]}</sub>
        </span>,
      )
    } else if (match[4] && match[5]) {
      nodes.push(
        <span key={key} className="phys">
          <span className="phys-delta">Δ</span>
          {match[5]}
        </span>,
      )
    } else if (match[6] && match[7]) {
      nodes.push(
        <span key={key} className="phys">
          {match[6]}
          <sub className="phys-sub">{match[7]}</sub>
        </span>,
      )
    } else if (match[8] && match[9]) {
      nodes.push(
        <span key={key} className="phys">
          <span className="phys-mu">μ</span>
          <sub className="phys-sub">{match[9]}</sub>
        </span>,
      )
    }

    last = match.index + match[0].length
  }

  if (last < text.length) {
    nodes.push(text.slice(last))
  }

  return nodes
}

function parseInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  let i = 0

  for (const part of parts) {
    if (!part) continue
    if (part.startsWith('**') && part.endsWith('**')) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${i++}`}>
          {parsePhysicsTokens(part.slice(2, -2), `${keyPrefix}-b${i}`)}
        </strong>,
      )
    } else {
      nodes.push(...parsePhysicsTokens(part, `${keyPrefix}-t${i++}`))
    }
  }

  return nodes
}

type PhysicsTextProps = {
  text: string
  className?: string
  block?: boolean
}

export function PhysicsText({ text, className, block = false }: PhysicsTextProps) {
  if (!block) {
    return <span className={className}>{parseInline(text, 'inline')}</span>
  }

  const paragraphs = text.split(/\n\n+/)
  return (
    <div className={className}>
      {paragraphs.map((para, idx) => (
        <p key={idx} className="phys-para">
          {parseInline(para, `p${idx}`)}
        </p>
      ))}
    </div>
  )
}

export function PhysicsEquation({ text }: { text: string }) {
  return (
    <div className="phys-equation" aria-label={text.replace(/_/g, ' sub ')}>
      {parseInline(text, 'eq')}
    </div>
  )
}
