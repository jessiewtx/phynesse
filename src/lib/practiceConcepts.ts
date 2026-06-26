import type { ConceptId } from './physics'

/**
 * Which generated-practice concept backs each lesson. Conservation (L5) is a
 * multi-concept synthesis with no single closed-form generator, so it is
 * intentionally left out of infinite practice.
 */
export const LESSON_CONCEPT: Record<string, ConceptId> = {
  L1: 'work',
  L2: 'kinetic',
  L3: 'grav_pe',
  L4: 'elastic_pe',
  L6: 'power',
}

export const CONCEPT_COLOR: Record<ConceptId, string> = {
  work: '#6366f1',
  kinetic: '#0ea5e9',
  grav_pe: '#f59e0b',
  elastic_pe: '#10b981',
  power: '#ef4444',
}
