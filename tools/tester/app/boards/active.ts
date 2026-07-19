import type { BoardProfile } from './types'
import { PROFILE as DAX3_PROFILE } from './dax3'

let active: BoardProfile = DAX3_PROFILE

export function getBoard(): BoardProfile {
  return active
}

export function setBoardForTest(profile: BoardProfile): void {
  active = profile
}

export function resetBoardForTest(): void {
  active = DAX3_PROFILE
}
