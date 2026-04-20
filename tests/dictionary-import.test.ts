import { describe, it, expect } from 'vitest'
import { xcss } from '../src/core'

describe('xcss dictionary import', () => {
    it('should disable built-in dictionary when dictionaryImport is false', () => {
        const { clsx, getCssString } = xcss({ dictionaryImport: false }).buildCss()
        const result = clsx('m10px')
        expect(result).toMatch(/^D[A-Z0-9]+$/)

        const css = getCssString()
        expect(css).not.toContain('margin:10px')
    })

    it('should import external dictionary when dictionaryImport is a URL string', async () => {
        const dictionaryModule = `
            export const SHORT_PROPERTIES = { m: 'margin' };
            export const COMMON_VALUES = {};
            export const SPECIFIC_VALUES = {};
        `
        const dictionaryUrl =
            'data:text/javascript;charset=utf-8,' +
            encodeURIComponent(dictionaryModule)

        const instance = xcss({ dictionaryImport: dictionaryUrl })
        const { clsx, getCssString } = instance.buildCss()

        clsx('m10px')
        expect(getCssString()).not.toContain('margin:10px')

        await instance.ready
        await Promise.resolve()

        expect(getCssString()).toContain('margin:10px')
    })

    it('should import generated dic.js file', async () => {
        const dictionaryUrl = new URL('../dic.js', import.meta.url).href
        const instance = xcss({ dictionaryImport: dictionaryUrl })
        const { clsx, getCssString } = instance.buildCss()

        clsx('m10px')
        await instance.ready
        await Promise.resolve()

        expect(getCssString()).toContain('margin:10px')
    })
})
