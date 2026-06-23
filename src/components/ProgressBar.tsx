type ProgressBarProps = {
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  return (
    <div className="step-dots" aria-label={`Step ${current + 1} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`step-dot ${i < current ? 'step-dot--done' : i === current ? 'step-dot--active' : ''}`}
        />
      ))}
    </div>
  )
}
