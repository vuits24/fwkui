import { describe, expect, it } from 'vitest'

import {
    TAILWIND_COVERAGE_MATRIX,
    assessTailwindMigrationReadiness,
    getTailwindCoverageMatrix,
} from '../src/tailwind-readiness'

describe('tailwind migration readiness', () => {
    it('returns a machine-readable coverage matrix for production tooling', () => {
        const matrix = getTailwindCoverageMatrix()

        expect(matrix).toBe(TAILWIND_COVERAGE_MATRIX)
        expect(matrix.some((entry) => entry.group === 'layout-core' && entry.support === 'exact')).toBe(true)
        expect(matrix.some((entry) => entry.group === 'motion-detailed' && entry.support === 'manual')).toBe(true)
        expect(matrix.some((entry) => entry.group === 'transform-effects' && entry.support === 'manual')).toBe(true)
    })

    it('marks fully supported classes as safe to auto-apply', () => {
        const report = assessTailwindMigrationReadiness(
            'flex items-center justify-between gap-4 p-4 bg-white text-slate-900 rounded-lg border border-slate-200',
        )

        expect(report.releaseDecision).toBe('safe')
        expect(report.safeToAutoApply).toBe(true)
        expect(report.blocked).toEqual([])
        expect(report.reviewRequired).toEqual([])
        expect(report.autoApplyOutput).toContain('dF')
        expect(report.autoApplyOutput).toContain('ai[center]')
        expect(report.autoApplyOutput).toContain('jc[space-between]')
        expect(report.autoApplyOutput).toContain('p16px')
    })

    it('keeps approximate conversions out of auto-apply output for real-product usage', () => {
        const report = assessTailwindMigrationReadiness('transition flex')

        expect(report.releaseDecision).toBe('review')
        expect(report.safeToAutoApply).toBe(false)
        expect(report.autoApplyOutput).toBe('dF')
        expect(report.approximateConverted).toEqual(['tran0.2s'])
        expect(report.reviewRequired).toEqual(['transition'])
        expect(report.blocked).toEqual([])
    })

    it('blocks unsupported or ambiguous utilities in safe migration mode', () => {
        const report = assessTailwindMigrationReadiness(
            'group-hover:bg-slate-50 duration-200 md:fxd[row] p-4',
        )

        expect(report.releaseDecision).toBe('blocked')
        expect(report.safeToAutoApply).toBe(false)
        expect(report.autoApplyOutput).toBe('md:fxd[row] p16px')
        expect(report.blocked).toEqual(['group-hover:bg-slate-50', 'duration-200'])
        expect(report.reviewRequired).toEqual(['group-hover:bg-slate-50', 'duration-200'])
        expect(report.passthroughXcss).toEqual(['md:fxd[row]'])
        expect(report.exactConverted).toEqual(['p16px'])
    })
})
