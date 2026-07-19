import { describe, expect, it } from 'vitest'
import { matrix } from './matrix'

const { keyCount, physicalToMatrix, matrixToPhysical, checkIntegrity } = matrix

describe('dax3 matrix', () => {
  it('counts 46 physical keys', () => {
    expect(keyCount).toBe(46)
  })

  it('physical 0 = R0C0', () => {
    expect(physicalToMatrix(0)).toEqual({ row: 0, col: 0 })
  })

  it('physical 6 = R0C8 (first R side cell on R0)', () => {
    expect(physicalToMatrix(6)).toEqual({ row: 0, col: 8 })
  })

  it('physical 30 = R2C6 (extra L outer cell on R2)', () => {
    expect(physicalToMatrix(30)).toEqual({ row: 2, col: 6 })
  })

  it('physical 31 = R2C7 (extra R outer cell on R2)', () => {
    expect(physicalToMatrix(31)).toEqual({ row: 2, col: 7 })
  })

  it('physical 38 = R3C2 (first R3 cell)', () => {
    expect(physicalToMatrix(38)).toEqual({ row: 3, col: 2 })
  })

  it('physical 45 = R3C11 (last cell, sparse R thumb outer)', () => {
    expect(physicalToMatrix(45)).toEqual({ row: 3, col: 11 })
  })

  it('matrixToPhysical inverts physicalToMatrix', () => {
    for (let i = 0; i < keyCount; i++) {
      const m = physicalToMatrix(i)
      expect(matrixToPhysical(m.row, m.col)).toBe(i)
    }
  })

  it('matrixToPhysical returns null for cells the layout does not include', () => {
    expect(matrixToPhysical(0, 7)).toBeNull()
    expect(matrixToPhysical(1, 7)).toBeNull()
    expect(matrixToPhysical(3, 0)).toBeNull()
    expect(matrixToPhysical(3, 13)).toBeNull()
  })

  it('checkIntegrity is true for 46, false otherwise', () => {
    expect(checkIntegrity(46)).toBe(true)
    expect(checkIntegrity(48)).toBe(false)
  })

  it('out-of-range physical index throws', () => {
    expect(() => physicalToMatrix(46)).toThrow(/out of range/)
    expect(() => physicalToMatrix(-1)).toThrow(/out of range/)
  })
})
