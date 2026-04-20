import { afterEach, describe, it, expect } from 'vitest'
import { xcss } from '../src/core'
import { getBootloaderScript } from '../src/bootloader'

describe('xcss user repro', () => {
    it('should handle fk-dF@;li', async () => {
        const instance = xcss({ prefix: 'fk-' })
        const { clsx, getCssString } = instance.buildCss()
        const res = clsx('fk-dF@;li')
        console.log('Result 1:', res)
        expect(res).toMatch(/^D[A-Z0-9]+$/)
        await instance.ready
        await Promise.resolve()

        const css = getCssString()
        console.log('CSS 1:', css)
        // dF -> display: flex. @;li -> " li" selector
        expect(css).toContain('display:flex')
        expect(css).toContain(' li{')
    })

    it('should handle fk-fxdC@;li', async () => {
        const instance = xcss({ prefix: 'fk-' })
        const { clsx, getCssString } = instance.buildCss()
        const res = clsx('fk-fxdC@;li')
        console.log('Result 2:', res)
        await instance.ready
        await Promise.resolve()

        const css = getCssString()
        console.log('CSS 2:', css)
        // fxdC -> flex-direction: column
        expect(css).toContain('flex-direction:column')
        expect(css).toContain(' li{')
    })

    it('should handle fk-dF&fk-fxdC@;li', async () => {
        const instance = xcss({ prefix: 'fk-' })
        const { clsx, getCssString } = instance.buildCss()
        const res = clsx('fk-dF&fk-fxdC@;li')
        console.log('Result 3:', res)
        await instance.ready
        await Promise.resolve()

        const css = getCssString()
        console.log('CSS 3:', css)
        expect(css).toContain('display:flex')
        expect(css).toContain('flex-direction:column')
        expect(css).toContain(' li{')
    })

    it('should support fk-md:dF&fxdC chain with inherited media', async () => {
        const instance = xcss({ prefix: 'fk-' })
        const { clsx, getCssString } = instance.buildCss()
        const res = clsx('fk-md:dF&fxdC')
        expect(res).toMatch(/^D[A-Z0-9]+$/)
        await instance.ready
        await Promise.resolve()

        const css = getCssString()
        expect(css).toContain('@media screen and (min-width: 768px)')
        expect(css).toContain('display:flex')
        expect(css).toContain('flex-direction:column')
    })

    it('should support md:[group]&[group]@;li chain aliases', async () => {
        const instance = xcss({
            aliases: {
                row: ['display:flex', 'padding:5px'],
                col: ['flex-direction: column', 'margin:5px'],
            },
        })
        const { clsx, getCssString } = instance.buildCss()
        const res = clsx('md:[row]&[col]@;li')
        expect(res).toMatch(/^D[A-Z0-9]+$/)
        await instance.ready
        await Promise.resolve()

        const css = getCssString()
        expect(css).toContain('@media screen and (min-width: 768px)')
        expect(css).toContain('display:flex')
        expect(css).toContain('padding:5px')
        expect(css).toContain('flex-direction:column')
        expect(css).toContain('margin:5px')
        expect(css).toContain(' li{')
    })

    it('should keep utility-style aliases raw because aliases require full declarations', async () => {
        const instance = xcss({
            aliases: {
                row: ['dF'],
                col: ['fxdC'],
            },
        })
        const { clsx, getCssString } = instance.buildCss()
        const res = clsx('md:[row]&[col]@;li', 'm10px')
        const parts = res.split(' ')

        expect(parts).toContain('md:[row]&[col]@;li')
        expect(parts.some((p) => /^D[A-Z0-9]+$/.test(p))).toBe(true)
        await instance.ready
        await Promise.resolve()

        const css = getCssString()
        expect(css).toContain('margin:10px')
        expect(css).not.toContain('display:flex')
        expect(css).not.toContain('flex-direction:column')
    })

    it('should handle css variable value fk-bgc--red', async () => {
        const instance = xcss({ prefix: 'fk-' })
        const { clsx, getCssString } = instance.buildCss()
        const res = clsx('fk-bgc--red')
        console.log('Result 4:', res)
        expect(res).toMatch(/^D[A-Z0-9]+$/)
        await instance.ready
        await Promise.resolve()

        const css = getCssString()
        console.log('CSS 4:', css)
        expect(css).toContain('background-color:var(--red)')
    })

    it('should handle arbitrary value brackets w[calc(100%;-;10px)]', async () => {
        const instance = xcss()
        const { clsx, getCssString } = instance.buildCss()
        const res = clsx('w[calc(100%;-;10px)]')
        console.log('Result 5:', res)
        expect(res).toMatch(/^D[A-Z0-9]+$/)
        await instance.ready
        await Promise.resolve()

        const css = getCssString()
        console.log('CSS 5:', css)
        expect(css).toContain('width:calc(100% - 10px)')
    })

    it('should not split media by colon inside arbitrary brackets', async () => {
        const instance = xcss()
        const { clsx, getCssString } = instance.buildCss()
        const res = clsx('w[calc(100%;-;var(--x:y))]')
        expect(res).toMatch(/^D[A-Z0-9]+$/)
        await instance.ready
        await Promise.resolve()

        const css = getCssString()
        expect(css).toContain('width:calc(100% - var(--x:y))')
    })

    it('should parse selector suffix with attribute brackets and colon', async () => {
        const instance = xcss()
        const { clsx, getCssString } = instance.buildCss()
        const res = clsx('dF@[data-kind="x:y"]')
        expect(res).toMatch(/^D[A-Z0-9]+$/)
        await instance.ready
        await Promise.resolve()

        const css = getCssString()
        expect(css).toContain('[data-kind="x:y"]{display:flex}')
    })

    it('should support full property name syntax colorRed@#abc:hover', async () => {
        const instance = xcss()
        const { clsx, getCssString } = instance.buildCss()
        const res = clsx('colorRed@#abc:hover')
        expect(res).toMatch(/^D[A-Z0-9]+$/)
        await instance.ready
        await Promise.resolve()

        const css = getCssString()
        expect(css).toContain('#abc:hover{color:Red}')
    })

    it('should parse chained utilities with bracket selector suffix', async () => {
        const instance = xcss()
        const { clsx, getCssString } = instance.buildCss()
        const res = clsx('dF&fxdC@[data-kind="x:y"]')
        expect(res).toMatch(/^D[A-Z0-9]+$/)
        await instance.ready
        await Promise.resolve()

        const css = getCssString()
        expect(css).toContain('[data-kind="x:y"]{display:flex;flex-direction:column}')
    })

    it('should handle important + hex value c!#0a64e8', async () => {
        const instance = xcss()
        const { clsx, getCssString } = instance.buildCss()
        const res = clsx('c!#0a64e8')
        console.log('Result 6:', res)
        expect(res).toMatch(/^D[A-Z0-9]+$/)
        await instance.ready
        await Promise.resolve()

        const css = getCssString()
        console.log('CSS 6:', css)
        expect(css).toContain('color:#0a64e8 !important')
    })

    it('should keep invalid token as raw class (bs-a) and still parse valid token', async () => {
        const instance = xcss()
        const { clsx, getCssString } = instance.buildCss()
        const res = clsx('bs-a', 'abcde', 'm10px')
        console.log('Result 7:', res)

        const parts = res.split(' ')
        expect(parts).toContain('bs-a')
        expect(parts).toContain('abcde')
        expect(parts.some((p) => /^D[A-Z0-9]+$/.test(p))).toBe(true)
        await instance.ready
        await Promise.resolve()

        const css = getCssString()
        console.log('CSS 7:', css)
        expect(css).toContain('margin:10px')
        expect(css).not.toContain('bs-a')
        expect(css).not.toContain('abcde')
    })

    it('should keep malformed tokens raw (&span, missing closing bracket)', async () => {
        const instance = xcss()
        const { clsx, getCssString } = instance.buildCss()
        const res = clsx('&span', 'w[calc(100%;-;10px)', 'm10px')

        const parts = res.split(' ')
        expect(parts).toContain('&span')
        expect(parts).toContain('w[calc(100%;-;10px)')
        expect(parts.some((p) => /^D[A-Z0-9]+$/.test(p))).toBe(true)
        await instance.ready
        await Promise.resolve()

        const css = getCssString()
        expect(css).toContain('margin:10px')
        expect(css).not.toContain('&:span')
        expect(css).not.toContain('calc(100% - 10px)')
    })

    it('should keep invalid media token raw (mdx:w10px)', async () => {
        const instance = xcss()
        const { clsx, getCssString } = instance.buildCss()
        const res = clsx('mdx:w10px', 'm10px')
        const parts = res.split(' ')

        expect(parts).toContain('mdx:w10px')
        expect(parts.some((p) => /^D[A-Z0-9]+$/.test(p))).toBe(true)
        await instance.ready
        await Promise.resolve()

        const css = getCssString()
        expect(css).toContain('margin:10px')
        expect(css).not.toContain('width:10px')
        expect(css).not.toContain('undefined@layer')
    })

    it('should remove prefix then validate token and keep invalid media raw', async () => {
        const instance = xcss({ prefix: 'fk-' })
        const { clsx, getCssString } = instance.buildCss()
        const res = clsx('fk-mdx:w10px', 'fk-m10px')
        const parts = res.split(' ')

        expect(parts).toContain('fk-mdx:w10px')
        expect(parts.some((p) => /^D[A-Z0-9]+$/.test(p))).toBe(true)
        await instance.ready
        await Promise.resolve()

        const css = getCssString()
        expect(css).toContain('margin:10px')
        expect(css).not.toContain('width:10px')
        expect(css).not.toContain('undefined@layer')
    })

    it('should keep obviously invalid selector suffix raw without CSS.supports', async () => {
        const instance = xcss()
        const { clsx, getCssString } = instance.buildCss()
        const res = clsx('dF@)', 'dF@(', 'dF@#', 'm10px')
        const parts = res.split(' ')

        expect(parts).toContain('dF@)')
        expect(parts).toContain('dF@(')
        expect(parts).toContain('dF@#')
        expect(parts.some((p) => /^D[A-Z0-9]+$/.test(p))).toBe(true)
        await instance.ready
        await Promise.resolve()

        const css = getCssString()
        expect(css).toContain('margin:10px')
        expect(css).not.toContain('){display:flex}')
        expect(css).not.toContain('({display:flex}')
        expect(css).not.toContain('#{display:flex}')
    })

    it('should keep unknown property raw when dictionary is enabled', async () => {
        const instance = xcss()
        const { clsx, getCssString } = instance.buildCss()
        await instance.ready
        await Promise.resolve()
        const res = clsx('unknown10', 'm10px')
        const parts = res.split(' ')

        expect(parts).toContain('unknown10')
        expect(parts.some((p) => /^D[A-Z0-9]+$/.test(p))).toBe(true)

        const css = getCssString()
        expect(css).toContain('margin:10px')
        expect(css).not.toContain('unknown:10')
    })

    it('should resolve full declaration aliases in prefix mode', async () => {
        const instance = xcss({
            prefix: 'fk-',
            aliases: {
                row: ['display:flex', 'padding:5px'],
                col: ['flex-direction: column', 'margin:5px'],
            },
        })
        const { clsx, getCssString } = instance.buildCss()
        const res = clsx('fk-md:[row]&[col]@;li')
        expect(res).toMatch(/^D[A-Z0-9]+$/)
        await instance.ready
        await Promise.resolve()

        const css = getCssString()
        expect(css).toContain('@media screen and (min-width: 768px)')
        expect(css).toContain('display:flex')
        expect(css).toContain('padding:5px')
        expect(css).toContain('flex-direction:column')
        expect(css).toContain('margin:5px')
        expect(css).toContain(' li{')
        expect(css).not.toContain('dF;fxdC')
    })
})

type FakeBrowserEnv = {
    document: any
    localStorage: Storage
    restore: () => void
}

type FakeBroadcastChannelEvent = {
    data: unknown
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const waitForStorageKey = async (
    storage: Storage,
    key: string,
    timeoutMs: number = 1000,
): Promise<string | null> => {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
        const value = storage.getItem(key)
        if (value) return value
        await wait(20)
    }
    return storage.getItem(key)
}

const waitForCacheContains = async (
    readCache: () => any,
    needle: string,
    timeoutMs: number = 1200,
) => {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
        const cache = readCache()
        const text = Object.values(cache?.cssText || {}).join('\n')
        if (text.includes(needle)) return cache
        await wait(20)
    }
    return readCache()
}

const createFakeBroadcastChannel = () => {
    const registry = new Map<string, Set<FakeBroadcastChannel>>()

    class FakeBroadcastChannel {
        name: string
        onmessage: ((event: FakeBroadcastChannelEvent) => void) | null = null
        private listeners = new Set<(event: FakeBroadcastChannelEvent) => void>()

        constructor(name: string) {
            this.name = name
            if (!registry.has(name)) registry.set(name, new Set())
            registry.get(name)!.add(this)
        }

        postMessage(data: unknown) {
            const peers = registry.get(this.name)
            if (!peers) return

            peers.forEach((peer) => {
                if (peer === this) return
                const event = { data }
                if (typeof peer.onmessage === 'function') {
                    peer.onmessage(event)
                }
                peer.listeners.forEach((listener) => listener(event))
            })
        }

        addEventListener(type: string, listener: (event: FakeBroadcastChannelEvent) => void) {
            if (type === 'message') {
                this.listeners.add(listener)
            }
        }

        removeEventListener(type: string, listener: (event: FakeBroadcastChannelEvent) => void) {
            if (type === 'message') {
                this.listeners.delete(listener)
            }
        }

        close() {
            registry.get(this.name)?.delete(this)
        }
    }

    return FakeBroadcastChannel
}

const createFakeBrowserEnv = (): FakeBrowserEnv => {
    const g = globalThis as any
    const prev = {
        window: g.window,
        document: g.document,
        CSSStyleSheet: g.CSSStyleSheet,
        ShadowRoot: g.ShadowRoot,
        BroadcastChannel: g.BroadcastChannel,
    }

    const store = new Map<string, string>()
    const localStorage = {
        getItem(key: string) {
            return store.has(key) ? String(store.get(key)) : null
        },
        setItem(key: string, value: string) {
            store.set(key, String(value))
        },
        removeItem(key: string) {
            store.delete(key)
        },
        clear() {
            store.clear()
        },
        key(index: number) {
            return Array.from(store.keys())[index] || null
        },
        get length() {
            return store.size
        },
    } as Storage

    class FakeCSSStyleSheet {
        cssRules: string[] = []
        media: string

        constructor(options?: { media?: string }) {
            this.media = options?.media || ''
        }

        insertRule(rule: string) {
            this.cssRules.push(rule)
        }

        replaceSync(_text: string) {
            // no-op for unit test
        }
    }

    class FakeStyleElement {
        id = ''
        sheet = new FakeCSSStyleSheet()
        removed = false
        textContent = ''

        remove() {
            this.removed = true
        }
    }

    const styles: FakeStyleElement[] = []
    const fakeDocument: any = {
        adoptedStyleSheets: [],
        head: {
            append(style: FakeStyleElement) {
                styles.push(style)
            },
            appendChild(style: FakeStyleElement) {
                styles.push(style)
            },
        },
        createElement(tag: string) {
            if (tag !== 'style') throw new Error(`Unsupported tag ${tag}`)
            return new FakeStyleElement()
        },
        querySelector(selector: string) {
            const match = /style\[id="(.+)"\]/.exec(selector)
            if (!match) return null
            const id = match[1]
            return styles.find((style) => style.id === id && !style.removed) || null
        },
        getRootNode() {
            return fakeDocument
        },
    }

    g.window = {
        localStorage,
        addEventListener() {},
        removeEventListener() {},
    }
    g.document = fakeDocument
    g.CSSStyleSheet = FakeCSSStyleSheet
    g.ShadowRoot = class FakeShadowRoot {}

    return {
        document: fakeDocument,
        localStorage,
        restore: () => {
            g.window = prev.window
            g.document = prev.document
            g.CSSStyleSheet = prev.CSSStyleSheet
            g.ShadowRoot = prev.ShadowRoot
            g.BroadcastChannel = prev.BroadcastChannel
        },
    }
}

let currentEnv: FakeBrowserEnv | null = null

afterEach(() => {
    if (currentEnv) {
        currentEnv.restore()
        currentEnv = null
    }
})

describe('xcss cache', () => {
    it('should keep cache disabled by default unless loadOnInit is enabled explicitly', async () => {
        currentEnv = createFakeBrowserEnv()

        const instance = xcss()
        const { clsx } = instance.buildCss(currentEnv.document)

        clsx('m10px')
        await instance.ready
        await Promise.resolve()
        await wait(30)

        expect(currentEnv.localStorage.getItem('fwkui_cache_v1')).toBeNull()
    })

    it('should remove invalid cache content for the same key', async () => {
        currentEnv = createFakeBrowserEnv()

        const brokenKey = 'broken-style_cache_v1'
        currentEnv.localStorage.setItem(brokenKey, '{"configHash":')

        const instance = xcss({
            cache: {
                styleId: 'broken-style',
                version: 'v1',
                compression: true,
                debounceMs: 0,
                loadOnInit: true,
            },
        })

        instance.buildCss(currentEnv.document)
        await instance.ready
        await wait(30)

        expect(currentEnv.localStorage.getItem(brokenKey)).toBeNull()
    })

    it('should save compressed cache with configured key and export decompressed data', async () => {
        currentEnv = createFakeBrowserEnv()

        const instance = xcss({
            cache: {
                styleId: 'custom-style',
                version: 'v9',
                compression: true,
                debounceMs: 0,
                loadOnInit: true,
            },
        })
        const { clsx } = instance.buildCss(currentEnv.document)

        clsx('m10px')
        await instance.ready
        await Promise.resolve()
        const raw = await waitForStorageKey(currentEnv.localStorage, 'custom-style_cache_v9')
        expect(raw).toBeTruthy()

        const stored = JSON.parse(String(raw))
        expect([2, 3]).toContain(stored.__xcss_cache_v)
        expect(stored.compressed).toBe(true)
        expect(typeof stored.payload).toBe('string')

        if (stored.__xcss_cache_v === 3) {
            expect(stored.algorithm).toBe('deflate-raw')
            expect(stored.encoding).toBe('base64')
        }

        const exported = await waitForCacheContains(() => instance.exportCache(), 'margin:10px')
        expect(exported).toBeTruthy()
        const allCss = Object.values(exported?.cssText || {}).join('\n')
        expect(allCss).toContain('margin:10px')
    })


    it('should remove broken stream cache and rebuild', async () => {
        currentEnv = createFakeBrowserEnv()

        const currentKey = 'fwkui_cache_v1'
        const brokenStreamPayload = JSON.stringify({
            __xcss_cache_v: 3,
            compressed: true,
            algorithm: 'deflate-raw',
            encoding: 'base64',
            payload: 'not-a-valid-base64',
        })

        // Đặt cache bị hỏng
        currentEnv.localStorage.setItem(currentKey, brokenStreamPayload)

        const instance = xcss({
            cache: {
                styleId: 'fwkui',
                version: 'v1',
                compression: true,
                debounceMs: 0,
                loadOnInit: true,
            },
        })

        const { clsx } = instance.buildCss(currentEnv.document)
        clsx('p8px')
        await instance.ready
        await Promise.resolve()
        await wait(60)

        // Cache bị hỏng bị xóa, cache mới được ghi
        const newRaw = currentEnv.localStorage.getItem(currentKey)
        if (newRaw) {
            expect(newRaw).not.toBe(brokenStreamPayload)
        }
    })

    it('should build bootloader script from styleId + version', () => {
        const script = getBootloaderScript('xcss-style', 'v9')
        expect(script).toContain('"xcss-style"')
        expect(script).toContain('"xcss-style_cache_v9"')
        expect(script).toContain('if (!false) return;')
    })

    it('should build bootloader script from styleId + version with different versions', () => {
        const script = getBootloaderScript('xcss-style', 'v10')
        expect(script).toContain('"xcss-style_cache_v10"')
    })

    it('should return compact script when compact option is enabled', () => {
        const normal = getBootloaderScript('xcss-style', 'v9')
        const compact = getBootloaderScript('xcss-style', 'v9', { compact: true })

        expect(compact).toContain('"xcss-style_cache_v9"')
        expect(compact.length).toBeLessThan(normal.length)
        expect(compact.includes('\n')).toBe(false)
    })

    it('should allow bootloader only when loadOnInit is enabled explicitly', () => {
        const script = getBootloaderScript('xcss-style', 'v9', { loadOnInit: true })
        expect(script).toContain('if (!true) return;')
    })

    it('should honor configured cache.sizeLast seed for generated keys', async () => {
        currentEnv = createFakeBrowserEnv()

        const instance = xcss({
            cache: {
                styleId: 'seed-style',
                version: 'v1',
                sizeLast: 2048,
                debounceMs: 0,
                loadOnInit: true,
            },
        })
        const { clsx } = instance.buildCss(currentEnv.document)

        const key = clsx('m10px')
        await instance.ready
        await Promise.resolve()

        expect(key).toBe('D' + (2048).toString(32).toUpperCase())
    })

    it('should sync generated key mappings via BroadcastChannel', async () => {
        currentEnv = createFakeBrowserEnv()

        const g = globalThis as any
        g.BroadcastChannel = createFakeBroadcastChannel()

        const options = {
            cache: {
                styleId: 'sync-style',
                version: 'v1',
                sizeLast: 2048,
                compression: false,
                debounceMs: 0,
                loadOnInit: true,
            },
        }

        const instanceA = xcss(options)
        const instanceB = xcss(options)
        const tabA = instanceA.buildCss(currentEnv.document)
        const tabB = instanceB.buildCss(currentEnv.document)

        const first = tabA.clsx('m10px')
        const second = tabA.clsx('cRed')

        await instanceA.ready
        await instanceB.ready
        await Promise.resolve()
        await Promise.resolve()

        const mirrored = tabB.clsx('m10px')
        const third = tabB.clsx('p8px')

        expect(first).toBe('D' + (2048).toString(32).toUpperCase())
        expect(second).toBe('D' + (2049).toString(32).toUpperCase())
        expect(mirrored).toBe(first)
        expect(third).toBe('D' + (2050).toString(32).toUpperCase())
    })
})
