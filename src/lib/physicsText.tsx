import type { ReactNode } from 'react'

const PHYS =
  /(Δ)([A-Z]{1,3})_([A-Za-z0-9]+)|(Δ)([A-Z]+)|([A-Z]{1,3})_([A-Za-z0-9]+)|(μ)_([A-Za-z0-9]+)/g

function parsePhysicsTokens(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let last = 0
  let i = 0
  let op = 0
  let match: RegExpExecArray | null

  // Push plain text, but give the multiplication dot (·) breathing room so
  // symbols like "F_f·d" don't crowd together.
  const pushText = (str: string) => {
    if (!str) return
    const parts = str.split('·')
    parts.forEach((part, idx) => {
      if (part) nodes.push(part)
      if (idx < parts.length - 1) {
        nodes.push(
          <span key={`${keyPrefix}-op-${op++}`} className="phys-op">
            ·
          </span>,
        )
      }
    })
  }

  PHYS.lastIndex = 0
  while ((match = PHYS.exec(text)) !== null) {
    if (match.index > last) {
      pushText(text.slice(last, match.index))
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
    pushText(text.slice(last))
  }

  return nodes
}

function parseInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  let i = 0

  for (const part of parts) {
    if (!part) continue
    if (part.startsWith('**') && part.endsWith('**')) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${i++}`}>
          {parsePhysicsTokens(part.slice(2, -2), `${keyPrefix}-b${i}`)}
        </strong>,
      )
    } else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      nodes.push(
        <em key={`${keyPrefix}-i-${i++}`}>
          {parsePhysicsTokens(part.slice(1, -1), `${keyPrefix}-i${i}`)}
        </em>,
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

const BULLET_RE = /^\s*[•\-]\s+/

function renderParagraph(para: string, key: string): ReactNode {
  const lines = para.split('\n')
  if (!lines.some((l) => BULLET_RE.test(l))) {
    return (
      <p key={key} className="phys-para">
        {parseInline(para, key)}
      </p>
    )
  }

  // Mixed text + bullets: group consecutive bullet lines into a <ul>, and any
  // surrounding plain lines into their own <p>.
  const out: ReactNode[] = []
  let bullets: string[] = []
  let textBuf: string[] = []
  let n = 0

  const flushBullets = () => {
    if (!bullets.length) return
    const items = bullets
    out.push(
      <ul key={`${key}-ul${n++}`} className="phys-list">
        {items.map((b, j) => (
          <li key={j}>{parseInline(b.replace(BULLET_RE, ''), `${key}-li${n}-${j}`)}</li>
        ))}
      </ul>,
    )
    bullets = []
  }
  const flushText = () => {
    const joined = textBuf.join(' ').trim()
    if (joined) {
      out.push(
        <p key={`${key}-p${n++}`} className="phys-para">
          {parseInline(joined, `${key}-pt${n}`)}
        </p>,
      )
    }
    textBuf = []
  }

  for (const line of lines) {
    if (BULLET_RE.test(line)) {
      flushText()
      bullets.push(line)
    } else if (line.trim()) {
      flushBullets()
      textBuf.push(line)
    }
  }
  flushBullets()
  flushText()

  return <div key={key}>{out}</div>
}

export function PhysicsText({ text, className, block = false }: PhysicsTextProps) {
  if (!block) {
    return <span className={className}>{parseInline(text, 'inline')}</span>
  }

  const paragraphs = text.split(/\n\n+/)
  return (
    <div className={className}>
      {paragraphs.map((para, idx) => renderParagraph(para, `p${idx}`))}
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
