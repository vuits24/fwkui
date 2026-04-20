import { describe, it, expect } from 'vitest'
import { xcss } from '../src/core'

describe('xcss exclude', () => {
    it('should ignore multiple wildcard excludes and keep original class names', async () => {
        const instance = xcss({ excludes: ['bs-*', 'rs-*'] })
        const { clsx, getCssString } = instance.buildCss()
        const result = clsx('bs-btn rs-open m10px')
        const parts = result.split(' ')

        expect(parts).toContain('bs-btn')
        expect(parts).toContain('rs-open')
        expect(parts.some((p) => /^D[A-Z0-9]+$/.test(p))).toBe(true)
        await instance.ready
        await Promise.resolve()

        const css = getCssString()
        expect(css).toContain('margin:10px')
        expect(css).not.toContain('bs-btn')
        expect(css).not.toContain('rs-open')
    })

    it('should support excludes with wildcard patterns', async () => {
        const instance = xcss({ excludes: ['bs-*'] })
        const { clsx, getCssString } = instance.buildCss()
        const result = clsx('bs-card p8px')
        const parts = result.split(' ')

        expect(parts).toContain('bs-card')
        expect(parts.some((p) => /^D[A-Z0-9]+$/.test(p))).toBe(true)
        await instance.ready
        await Promise.resolve()
        expect(getCssString()).toContain('padding:8px')
    })

    it('should support excludePrefixes for startsWith filtering', async () => {
        const instance = xcss({ excludePrefixes: ['bs-', 'rs-'] })
        const { clsx, getCssString } = instance.buildCss()
        const result = clsx('bs-form rs-toggle p10px')
        const parts = result.split(' ')

        expect(parts).toContain('bs-form')
        expect(parts).toContain('rs-toggle')
        expect(parts.some((p) => /^D[A-Z0-9]+$/.test(p))).toBe(true)
        await instance.ready
        await Promise.resolve()

        const css = getCssString()
        expect(css).toContain('padding:10px')
        expect(css).not.toContain('bs-form')
        expect(css).not.toContain('rs-toggle')
    })
})
