import { useState } from 'react'
import { WorkEnergyRace } from '../demos/WorkEnergyRace'
import { KineticEnergyExplorer } from '../demos/KineticEnergyExplorer'
import { AngleWorkExplorer } from '../demos/AngleWorkExplorer'
import { WorkOrNotExplorer } from '../demos/WorkOrNotExplorer'
import { WorkDragExplorer } from '../demos/WorkDragExplorer'
import { GravityPEExplorer } from '../demos/GravityPEExplorer'
import { ElasticPEExplorer } from '../demos/ElasticPEExplorer'
import { ConservationExplorer } from '../demos/ConservationExplorer'
import { CoasterExplorer } from '../demos/CoasterExplorer'
import { PowerExplorer } from '../demos/PowerExplorer'
import {
  WorkAngleDiagram,
  ZeroWorkDiagram,
  WorkSignDiagram,
  NetWorkDiagram,
  KEToolDiagram,
  RampHeightDiagram,
  PEZeroDiagram,
  PEKETradeDiagram,
  EnergyChainDiagram,
  VDerivationDiagram,
  FrictionEnergyDiagram,
  BrakingEnergyDiagram,
  PowerSpeedDiagram,
} from '../diagrams/ConceptDiagrams'
import { KineticEnergyDiagram } from '../diagrams/KineticEnergyDiagram'
import { GravitationalPEDiagram } from '../diagrams/GravitationalPEDiagram'
import { ElasticPEDiagram } from '../diagrams/ElasticPEDiagram'
import { ConservationDiagram } from '../diagrams/ConservationDiagram'
import { PowerDiagram } from '../diagrams/PowerDiagram'
import { PhysicsEquation, PhysicsText } from '../../lib/physicsText'
import { useEnterAdvance } from '../../lib/useEnterAdvance'
import type { ConceptStep } from '../../types/lesson'

type Props = {
  step: ConceptStep
  onContinue: () => void
}

export function ConceptStepView({ step, onContinue }: Props) {
  const needsDemo = step.demo === 'work_energy_race'
  const [demoDone, setDemoDone] = useState(!needsDemo)

  useEnterAdvance(onContinue, demoDone)

  return (
    <div className="step step--concept">
      {step.title && <h2 className="step__title">{step.title}</h2>}

      <PhysicsText text={step.body} block className="step__body" />

      {step.equation && <PhysicsEquation text={step.equation} />}

      {needsDemo && <WorkEnergyRace onLaunched={() => setDemoDone(true)} />}

      {step.demo === 'work_or_not' && <WorkOrNotExplorer />}

      {step.demo === 'work_drag' && <WorkDragExplorer />}

      {step.demo === 'angle_explorer' && <AngleWorkExplorer />}

      {step.demo === 'ke_explorer' && <KineticEnergyExplorer />}

      {step.demo === 'gravity_explorer' && <GravityPEExplorer />}

      {step.demo === 'elastic_explorer' && <ElasticPEExplorer />}

      {step.demo === 'conservation_explorer' && <ConservationExplorer />}

      {step.demo === 'coaster_explorer' && <CoasterExplorer />}

      {step.demo === 'power_explorer' && <PowerExplorer />}

      {step.visual === 'work_angle' && <WorkAngleDiagram />}

      {step.visual === 'zero_work' && <ZeroWorkDiagram />}

      {step.visual === 'work_sign' && <WorkSignDiagram />}

      {step.visual === 'net_work' && <NetWorkDiagram />}

      {step.visual === 'ke_tool' && <KEToolDiagram />}

      {step.visual === 'ramp_height' && <RampHeightDiagram />}

      {step.visual === 'pe_zero' && <PEZeroDiagram />}

      {step.visual === 'pe_ke_trade' && <PEKETradeDiagram />}

      {step.visual === 'energy_chain' && <EnergyChainDiagram />}

      {step.visual === 'v_derivation' && <VDerivationDiagram />}

      {step.visual === 'friction_energy' && <FrictionEnergyDiagram />}

      {step.visual === 'braking_energy' && <BrakingEnergyDiagram />}

      {step.visual === 'power_speed' && <PowerSpeedDiagram />}

      {step.visual === 'kinetic_energy' && <KineticEnergyDiagram />}

      {step.visual === 'gravitational_pe' && <GravitationalPEDiagram />}

      {step.visual === 'elastic_pe' && <ElasticPEDiagram />}

      {step.visual === 'conservation' && <ConservationDiagram />}

      {step.visual === 'power' && <PowerDiagram />}

      <button
        type="button"
        className="btn btn--primary"
        onClick={onContinue}
        disabled={!demoDone}
      >
        {demoDone ? 'Continue' : 'Launch the block to continue'}
      </button>
    </div>
  )
}
