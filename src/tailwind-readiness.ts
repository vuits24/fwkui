import {
    type TailwindConversionOptions,
    type TailwindConversionResult,
    type TailwindTokenConversion,
    convertTailwindClasses,
} from './tailwind'

export type TailwindCoverageSupport = 'exact' | 'partial' | 'manual'

export interface TailwindCoverageEntry {
    group: string
    support: TailwindCoverageSupport
    examples: string[]
    notes: string
}

export interface TailwindMigrationReadinessOptions extends TailwindConversionOptions {}

export interface TailwindMigrationReadinessReport {
    input: string
    conversion: TailwindConversionResult
    autoApplyOutput: string
    exactConverted: string[]
    approximateConverted: string[]
    passthroughXcss: string[]
    reviewRequired: string[]
    blocked: string[]
    safeToAutoApply: boolean
    releaseDecision: 'safe' | 'review' | 'blocked'
}

export const TAILWIND_COVERAGE_MATRIX: readonly TailwindCoverageEntry[] = [
    {
        group: 'layout-core',
        support: 'exact',
        examples: ['flex', 'inline-flex', 'grid', 'block', 'hidden', 'relative', 'absolute'],
        notes: 'display, position, flex-direction, flex-wrap, and core layout helpers map 1:1 to x-css tokens.',
    },
    {
        group: 'spacing-size',
        support: 'exact',
        examples: ['p-4', 'gap-4', 'mx-auto', 'w-1/2', 'max-w-7xl', 'inset-x-4', 'inset-y-2'],
        notes: 'spacing scale, fractions, width/height keywords, auto margins, and axis inset helpers are safe to auto-apply.',
    },
    {
        group: 'color-border-shadow',
        support: 'exact',
        examples: ['bg-white', 'text-slate-900', 'border', 'border-slate-200', 'shadow-lg'],
        notes: 'core color, border, rounded, and shadow utilities are exact when the target token is supported in the built-in dictionary.',
    },
    {
        group: 'typography',
        support: 'exact',
        examples: ['font-semibold', 'text-sm', 'leading-6', 'tracking-wide', 'uppercase', 'truncate'],
        notes: 'font family, weight, size, line-height, letter-spacing, casing, whitespace, and overflow text helpers are mapped directly.',
    },
    {
        group: 'alignment-placement',
        support: 'exact',
        examples: ['items-baseline', 'justify-between', 'place-items-center', 'content-between', 'justify-self-end'],
        notes: 'align, justify, place, self, and content helpers are safe to auto-apply.',
    },
    {
        group: 'object-appearance',
        support: 'exact',
        examples: ['appearance-none', 'object-cover', 'object-center', 'aspect-video', 'basis-1/2', 'order-last'],
        notes: 'appearance, object-fit/object-position, aspect-ratio, flex-basis, and order helpers are mapped exactly.',
    },
    {
        group: 'state-variants-safe',
        support: 'exact',
        examples: ['hover:bg-slate-50', 'focus:text-blue-600', 'before:bg-slate-50', 'placeholder:text-slate-400'],
        notes: 'responsive variants and safe pseudo/pseudo-element variants are supported directly: hover, focus, active, visited, disabled, checked, before, after, placeholder, selection, first, last, odd, even.',
    },
    {
        group: 'motion-basic',
        support: 'partial',
        examples: ['transition'],
        notes: 'transition currently degrades to a generic 200ms x-css transition and should be reviewed before release.',
    },
    {
        group: 'motion-detailed',
        support: 'manual',
        examples: ['duration-200', 'ease-out', 'delay-150'],
        notes: 'timing-specific motion helpers are not auto-mapped safely and should block blind migration.',
    },
    {
        group: 'contextual-variants',
        support: 'manual',
        examples: ['group-hover:bg-slate-50', 'peer-focus:text-blue-600', 'dark:bg-slate-900'],
        notes: 'group, peer, and dark-mode variants need product-specific rewrite strategy and should not be auto-applied.',
    },
    {
        group: 'generated-content-and-dividers',
        support: 'manual',
        examples: ['divide-x', 'before:content-[\"\"]'],
        notes: 'divide helpers and arbitrary generated-content flows need manual implementation review.',
    },
    {
        group: 'transform-effects',
        support: 'manual',
        examples: ['translate-x-4', 'scale-95', 'rotate-45', 'ring-2', 'outline-none', 'bg-gradient-to-r'],
        notes: 'transforms, rings, advanced outlines, and gradients are not mapped safely enough for production auto-migration.',
    },
] as const

const DEFAULT_READINESS_OPTIONS: Required<TailwindMigrationReadinessOptions> = {
    mode: 'safe',
    preserveUnknown: false,
}

const isSafeDetailForAutoApply = (detail: TailwindTokenConversion): boolean => {
    if (detail.status === 'converted') return detail.exact
    return detail.status === 'passthrough' && detail.classification === 'xcss'
}

export const getTailwindCoverageMatrix = (): readonly TailwindCoverageEntry[] => {
    return TAILWIND_COVERAGE_MATRIX
}

export const assessTailwindMigrationReadiness = (
    input: string,
    options?: TailwindMigrationReadinessOptions,
): TailwindMigrationReadinessReport => {
    const normalizedOptions: TailwindMigrationReadinessOptions = {
        ...DEFAULT_READINESS_OPTIONS,
        ...options,
    }

    const conversion = convertTailwindClasses(input, normalizedOptions)
    const exactConverted = conversion.details
        .filter((detail) => detail.status === 'converted' && detail.exact)
        .flatMap((detail) => detail.outputs)
    const approximateConverted = conversion.details
        .filter((detail) => detail.status === 'converted' && !detail.exact)
        .flatMap((detail) => detail.outputs)
    const passthroughXcss = conversion.details
        .filter((detail) => detail.status === 'passthrough' && detail.classification === 'xcss')
        .flatMap((detail) => detail.outputs)

    const reviewRequired = conversion.details
        .filter((detail) => !isSafeDetailForAutoApply(detail))
        .map((detail) => detail.input)

    const blocked = conversion.details
        .filter((detail) => {
            if (isSafeDetailForAutoApply(detail)) return false
            if (detail.status === 'converted') return false
            return detail.status === 'unsupported' || detail.classification === 'ambiguous' || detail.classification === 'unknown'
        })
        .map((detail) => detail.input)

    const autoApplyOutput = conversion.details
        .flatMap((detail) => (isSafeDetailForAutoApply(detail) ? detail.outputs : []))
        .join(' ')

    const safeToAutoApply = reviewRequired.length === 0
    const releaseDecision =
        blocked.length > 0
            ? 'blocked'
            : safeToAutoApply
                ? 'safe'
                : 'review'

    return {
        input,
        conversion,
        autoApplyOutput,
        exactConverted,
        approximateConverted,
        passthroughXcss,
        reviewRequired,
        blocked,
        safeToAutoApply,
        releaseDecision,
    }
}
