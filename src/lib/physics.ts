import type { PushBlockParams } from '../types/lesson'

const G = 9.8

export function pushBlockEnergy(params: PushBlockParams) {
  const { force, distance, mass, muK } = params
  const friction = muK * mass * G
  const netForce = force - friction
  const workNet = netForce * distance
  const deltaKe = Math.max(0, workNet)
  const thermal = netForce < 0 ? 0 : muK > 0 ? friction * distance : 0

  return {
    workNet,
    deltaKe,
    thermal,
    friction,
    netForce,
  }
}

export function formatJ(value: number): string {
  return `${value.toFixed(1)} J`
}
