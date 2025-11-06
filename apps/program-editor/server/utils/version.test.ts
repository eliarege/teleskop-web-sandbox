import { describe, expect, it } from 'vitest'
import { isVersionAbove } from './version'

describe('isVersionAbove', () => {
  describe('standard version comparisons', () => {
    it('should return true when numeric version is higher', () => {
      expectStandard('3.22.120').toBeHigherOrEqual('3.22.118')
      expectStandard('3.23.1').toBeHigherOrEqual('3.22.999')
      expectStandard('4.0.0').toBeHigherOrEqual('3.99.99')
    })

    it('should return false when numeric version is lower', () => {
      expectStandard('3.22.6').toBeLower('3.22.118')
      expectStandard('3.21').toBeLower('3.22')
      expectStandard('2.9.9').toBeLower('3.0.0')
      expectStandard('3.22.1').toBeLower('3.22.1.4')
    })

    it('should return true when numeric versions are equal', () => {
      expectStandard('3.22.118').toBeHigherOrEqual('3.22.118')
      expectStandard('3.22').toBeHigherOrEqual('3.22.0')
    })

    it('should ignore RIO and other labels', () => {
      expectStandard('3.22.8-RIO').toBeHigherOrEqual('3.22.7')
      expectStandard('3.22.4 - RIO').toBeLower('3.22.8')
    })
  })

  describe('smart version comparisons', () => {
    it('compare smart versions correctly', () => {
      expectSmart('3.22.7-Smart62').toBeHigherOrEqual('3.22.7-Smart60')
      expectSmart('3.22.7-Smart58').toBeLower('3.22.7-Smart60')
      expectSmart('3.22.7-Smart60').toBeHigherOrEqual('3.22.7-Smart60')
    })

    it('should ignore RIO and other labels', () => {
      expectSmart('3.22.8-Smart64 RIO').toBeHigherOrEqual('3.22.8-Smart63 RIO')
      expectSmart('3.22.8-Smart62 RIO').toBeLower('3.22.8-Smart63')
      expectSmart('3.22.8-Smart63').toBeHigherOrEqual('3.22.8-Smart63 RIO')
    })
  })

  describe('production cases', () => {
    it('additional process code support version', () => {
      const minimumRequiredVersions = {
        standardVersion: '3.22.118',
        smartVersion: '3.22.7-Smart62',
      }
      expect(isVersionAbove('3.22.119', minimumRequiredVersions)).toBe(true)
      expect(isVersionAbove('3.22.117', minimumRequiredVersions)).toBe(false)
      expect(isVersionAbove('3.10.119', minimumRequiredVersions)).toBe(false)
      expect(isVersionAbove('3.22.7-Smart63', minimumRequiredVersions)).toBe(true)
      expect(isVersionAbove('3.22.7-Smart61', minimumRequiredVersions)).toBe(false)
    })
  })
})

function expectStandard(version: string) {
  const highSmart = '999.999.999-Smart999'
  const lowSmart = '0.0.0-Smart0'
  const e = new Error('.')

  Error.captureStackTrace(e, expectStandard)
  return {
    toBeHigherOrEqual(targetStandard: string) {
      try {
        expect(isVersionAbove(version, { standardVersion: targetStandard, smartVersion: lowSmart })).toBe(true)
      } catch (err) {
        if (err instanceof Error) {
          err.stack = e.stack
        }
        throw err
      }
    },
    toBeLower(targetStandard: string) {
      try {
        expect(isVersionAbove(version, { standardVersion: targetStandard, smartVersion: highSmart })).toBe(false)
      } catch (err) {
        if (err instanceof Error) {
          err.stack = e.stack
        }
        throw err
      }
    },
  }
}

function expectSmart(version: string) {
  const highStandard = '999.999.999'
  const lowStandard = '0.0.0'
  const e = new Error('.')

  Error.captureStackTrace(e, expectSmart)
  return {
    toBeHigherOrEqual(targetSmart: string) {
      try {
        expect(isVersionAbove(version, { standardVersion: lowStandard, smartVersion: targetSmart })).toBe(true)
      } catch (err) {
        if (err instanceof Error) {
          err.stack = e.stack
        }
        throw err
      }
    },
    toBeLower(targetSmart: string) {
      try {
        expect(isVersionAbove(version, { standardVersion: highStandard, smartVersion: targetSmart })).toBe(false)
      } catch (err) {
        if (err instanceof Error) {
          err.stack = e.stack
        }
        throw err
      }
    },
  }
}
