import { describe, expect, it } from 'vitest'

import { xcss } from '../src/core'
import { classifyTailwindToken, convertTailwindClasses, convertTailwindToken } from '../src/tailwind'

describe('tailwind -> xcss converter', () => {
    it('converts common layout, spacing, and color utilities', () => {
        const result = convertTailwindClasses(
            'flex items-center justify-between gap-4 p-4 bg-white text-slate-900 rounded-lg border border-slate-200',
        )

        expect(result.output).toContain('dF')
        expect(result.output).toContain('ai[center]')
        expect(result.output).toContain('jc[space-between]')
        expect(result.output).toContain('gap16px')
        expect(result.output).toContain('p16px')
        expect(result.output).toContain('bgc#ffffff')
        expect(result.output).toContain('c#0f172a')
        expect(result.output).toContain('bdra8px')
        expect(result.output).toContain('bdw1px')
        expect(result.output).toContain('bds[solid]')
        expect(result.output).toContain('bdcCurrentColor')
        expect(result.output).toContain('bdc#e2e8f0')
        expect(result.unsupported).toEqual([])
    })

    it('applies responsive and selector variants to converted output', () => {
        const result = convertTailwindClasses(
            'md:hover:bg-slate-50 focus:text-blue-600',
        )

        expect(result.output).toContain('md:bgc#f8fafc@:hover')
        expect(result.output).toContain('c#2563eb@:focus')
        expect(result.unsupported).toEqual([])
    })

    it('supports arbitrary values, fractions, and max-width scale', () => {
        const result = convertTailwindClasses(
            'w-[calc(100%-1rem)] max-w-7xl w-1/2 text-[#111827]',
        )

        expect(result.output).toContain('w[calc(100%-1rem)]')
        expect(result.output).toContain('mw[80rem]')
        expect(result.output).toContain('w[50%]')
        expect(result.output).toContain('c#111827')
    })

    it('converts common alignment, basis, order, and inset helpers exactly', () => {
        const result = convertTailwindClasses(
            'items-baseline content-between place-items-center justify-self-end basis-1/2 order-last mx-auto inset-x-4 appearance-none object-cover',
            { mode: 'safe' },
        )

        expect(result.output).toContain('ai[baseline]')
        expect(result.output).toContain('ac[space-between]')
        expect(result.output).toContain('pli[center]')
        expect(result.output).toContain('js[end]')
        expect(result.output).toContain('fxb[50%]')
        expect(result.output).toContain('ord9999')
        expect(result.output).toContain('mx[auto]')
        expect(result.output).toContain('l16px')
        expect(result.output).toContain('r16px')
        expect(result.output).toContain('ap[none]')
        expect(result.output).toContain('of[cover]')
        expect(result.unsupported).toEqual([])
    })

    it('maps safe pseudo-element and pseudo-selector variants directly', () => {
        const result = convertTailwindClasses(
            'before:bg-slate-50 after:text-slate-900 placeholder:text-slate-400 selection:bg-blue-600',
            { mode: 'safe' },
        )

        expect(result.output).toContain('bgc#f8fafc@::before')
        expect(result.output).toContain('c#0f172a@::after')
        expect(result.output).toContain('c#94a3b8@::placeholder')
        expect(result.output).toContain('bgc#2563eb@::selection')
        expect(result.unsupported).toEqual([])
    })

    it('keeps unsupported utilities when preserveUnknown is enabled', () => {
        const result = convertTailwindClasses(
            'bg-gradient-to-r from-sky-500 to-cyan-500',
        )

        expect(result.passthrough).toContain('bg-gradient-to-r')
        expect(result.passthrough).toContain('from-sky-500')
        expect(result.passthrough).toContain('to-cyan-500')
        expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('marks transition helpers as approximate or unsupported honestly', () => {
        const transition = convertTailwindToken('transition')
        const duration = convertTailwindToken('duration-200')

        expect(transition.status).toBe('converted')
        expect(transition.classification).toBe('tailwind')
        expect(transition.exact).toBe(false)
        expect(transition.outputs).toEqual(['tran0.2s'])

        expect(duration.status).toBe('passthrough')
        expect(duration.classification).toBe('ambiguous')
        expect(duration.warnings.some((warning) => warning.message.includes('requires manual review'))).toBe(true)
    })

    it('uses canonical display aliases and safe keyword encoding', () => {
        const display = convertTailwindClasses('inline-flex inline-block inline-grid')
        const keywords = convertTailwindClasses('border text-transparent bg-[currentColor] border-transparent')

        expect(display.output).toContain('dIf')
        expect(display.output).toContain('dIb')
        expect(display.output).toContain('dIg')

        expect(keywords.output).toContain('bdcCurrentColor')
        expect(keywords.output).toContain('cTransparent')
        expect(keywords.output).toContain('bgcCurrentColor')
        expect(keywords.output).toContain('bdcTransparent')
    })

    it('emits tokens that the xcss runtime parses into correct CSS', async () => {
        const result = convertTailwindClasses('inline-flex inline-block border text-transparent bg-[currentColor]')
        const instance = xcss()
        const { clsx, getCssString } = instance.buildCss()

        const hashed = clsx(result.output)
        expect(hashed).toMatch(/^D[A-Z0-9]+(?:\s+D[A-Z0-9]+)*$/)

        await instance.ready
        await Promise.resolve()

        const css = getCssString()
        expect(css).toContain('display:inline-flex')
        expect(css).toContain('display:inline-block')
        expect(css).toContain('border-width:1px')
        expect(css).toContain('border-style:solid')
        expect(css).toContain('border-color:CurrentColor')
        expect(css).toContain('color:Transparent')
        expect(css).toContain('background-color:CurrentColor')
    })

    it('classifies xcss tokens separately from tailwind-like and ambiguous tokens', () => {
        expect(classifyTailwindToken('md:fxd[row]')).toBe('xcss')
        expect(classifyTailwindToken('hover:bg-slate-50')).toBe('ambiguous')
        expect(classifyTailwindToken('p-2.5')).toBe('ambiguous')
        expect(classifyTailwindToken('legacy-btn')).toBe('unknown')
    })

    it('safe mode preserves real xcss and rejects ambiguous passthroughs', () => {
        const result = convertTailwindClasses('md:fxd[row] p-2.5 duration-200 legacy-btn', {
            mode: 'safe',
        })

        expect(result.converted).toContain('p10px')
        expect(result.passthrough).toEqual(['md:fxd[row]'])
        expect(result.unsupported).toEqual(['duration-200', 'legacy-btn'])
        expect(result.ambiguous).toEqual(['p-2.5', 'duration-200'])
    })

    it('keeps ambiguous variant conversions raw in legacy mode instead of stripping variants', () => {
        const result = convertTailwindToken('group-hover:bg-slate-50')

        expect(result.status).toBe('passthrough')
        expect(result.classification).toBe('ambiguous')
        expect(result.outputs).toEqual(['group-hover:bg-slate-50'])
        expect(result.warnings.some((warning) => warning.message.includes('not mapped safely'))).toBe(true)
    })
})
