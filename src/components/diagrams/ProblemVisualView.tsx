import type { ProblemVisual } from '../../types/lesson'
import {
  SimplePushProblem,
  AnglePullProblem,
  PushFrictionProblem,
  ForceDistanceProblem,
  BrakingProblem,
  RampProblem,
  RampFrictionProblem,
  SpringLaunchProblem,
  PowerCarProblem,
  StairsProblem,
} from './ProblemDiagrams'

export function ProblemVisualView({ visual }: { visual: ProblemVisual }) {
  switch (visual) {
    case 'push':
      return <SimplePushProblem />
    case 'angle_pull':
      return <AnglePullProblem />
    case 'push_friction':
      return <PushFrictionProblem />
    case 'force_distance':
      return <ForceDistanceProblem />
    case 'braking':
      return <BrakingProblem />
    case 'ramp':
      return <RampProblem />
    case 'ramp_friction':
      return <RampFrictionProblem />
    case 'spring_launch':
      return <SpringLaunchProblem />
    case 'power_car':
      return <PowerCarProblem />
    case 'stairs':
      return <StairsProblem />
    default:
      return null
  }
}
