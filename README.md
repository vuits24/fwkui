# @fwkui/x-css

`@fwkui/x-css` là utility CSS engine siêu nhẹ, parse class theo cú pháp ngắn và sinh CSS runtime theo layer + media.

Mục tiêu của README này:
1. Người dùng có thể tích hợp ngay.
2. AI có thể suy luận đúng cú pháp để sinh class dùng được ngay.
3. QA có thể kiểm thử parser theo vector cố định.

![License](https://img.shields.io/npm/l/@fwkui/x-css)
![Version](https://img.shields.io/npm/v/@fwkui/x-css)

## Cài Đặt Nhanh

### 1) NPM

```bash
npm install @fwkui/x-css
```

### 2) Dùng trực tiếp qua URL (không cần bundler)

Lưu ý:
1. `dist/index.js` là CommonJS (Node).
2. Trình duyệt dùng `dist/index.mjs` hoặc `dist/index-auto.mjs`.

Option A: chủ động khởi tạo

```html
<script type="module">
  import xcss from 'https://unpkg.com/@fwkui/x-css@latest/dist/index.mjs';

  xcss.cssObserve(document, {
    dictionaryImport: true
  });
</script>
```

Option B: auto observe khi import

```html
<script type="module" src="https://unpkg.com/@fwkui/x-css@latest/dist/index-auto.mjs"></script>
```

CDN thay thế:
`https://cdn.jsdelivr.net/npm/@fwkui/x-css@latest/dist/index.mjs`

## Dùng Trong 60 Giây

```js
import xcss from '@fwkui/x-css';

xcss.cssObserve(document);
```

```html
<button class="dF aiC jcC p10px;16px bdN bdra8px bgc#0a64e8 cWhite">
  Đăng nhập
</button>
```

## Contract Cú Pháp

Mỗi utility class theo form:

`[Media]:[Layer][Property][Value][@Selector]`

Thứ tự parse bắt buộc:
1. `selector` (hậu tố `@...`, nằm ngoài `[]`).
2. `media` (tiền tố trước `:`).
3. `layer` (chuỗi số liên tiếp ở đầu).
4. `property`.
5. `value`.

Ý nghĩa từng phần:
1. `Media` (tùy chọn): key media như `sm`, `md`, `lg`, hoặc key custom.
2. `Layer` (tùy chọn): số ưu tiên cascade.
3. `Property` (bắt buộc): alias thuộc dictionary hoặc CSS property hợp lệ.
4. `Value` (bắt buộc với utility chuẩn): giá trị CSS, alias value hoặc arbitrary value.
5. `@Selector` (tùy chọn): ví dụ `@:hover`, `@::before`.

Ngoại lệ parser (special syntax):
1. `[AliasName]`: class group alias (không dùng value trực tiếp).
2. `&...`: nhánh selector đặc biệt theo parser hiện tại.

### Media Mặc Định Và Thứ Tự Nội Bộ

Engine nạp media theo thứ tự:

| Thứ tự | Key | Query |
| :--- | :--- | :--- |
| 1 | `default` | Không bọc `@media` |
| 2 | `xs` | `screen and (max-width: 575px)` |
| 3 | `sm` | `screen and (min-width: 576px)` |
| 4 | `md` | `screen and (min-width: 768px)` |
| 5 | `lg` | `screen and (min-width: 992px)` |
| 6 | `xl` | `screen and (min-width: 1200px)` |
| 7 | `2xl` | `screen and (min-width: 1400px)` |
| 8 | `sma` | `screen and (max-width: 768px)` |
| 9 | `mda` | `screen and (max-width: 992px)` |
| 10 | `lga` | `screen and (max-width: 1200px)` |
| 11 | `xla` | `screen and (max-width: 1400px)` |

Quy tắc custom breakpoint:
1. `breakpoints` được nối vào sau danh sách mặc định.
2. Nếu trùng key, key khai báo sau cùng ghi đè key trước (`last write wins`).

Ví dụ:

```js
xcss.cssObserve(document, {
  breakpoints: [
    { tablet: 'screen and (min-width: 768px)' }
  ]
});
```

Dùng class: `tablet:dB`.

### Layer Mặc Định

1. Nếu không khai báo layer, engine dùng `0`.
2. Engine tạo sẵn 24 layer: `l0 -> l23`.
3. Nên dùng dải `0-23` để giữ thứ tự ổn định.
4. Số layer lớn hơn có ưu tiên cascade cao hơn trong cùng media.

## Quy Tắc Điểm Ngắt Đầy Đủ (Theo Parser Hiện Tại)

Mục tiêu là tách class thành tuple:
`{ media, layer, property, value, selector }`

Thứ tự suy luận bắt buộc:
1. Tách `selector`: lấy phần sau ký tự `@` cuối cùng, chỉ khi `@` nằm ngoài `[]`.
2. Tách `media`: nếu còn `:` thì phần trước `:` là `media`.
3. Tách `layer`: đọc chuỗi số liên tiếp ở đầu phần còn lại.
4. Tách `property/value`: quét trái -> phải và dừng `property` theo bảng quyết định.
5. Nếu phần còn lại bắt đầu bằng `&` hoặc `[` thì đi vào nhánh special syntax.

### Bảng Quyết Định Khi Quét `property`

| Ký tự đang xét | Điều kiện | Hành động |
| :--- | :--- | :--- |
| `a-z` | luôn đúng | vẫn là `property` |
| `-` hoặc `.` | ký tự kế tiếp là số | dừng `property`, phần còn lại là `value` |
| `-` | gặp `--` và đã có ít nhất 1 ký tự property | dừng `property`, bắt đầu `value` (CSS variable) |
| `-` hoặc `.` | không rơi vào 2 điều kiện trên | vẫn là `property` |
| ký tự khác (`A-Z`, `0-9`, `#`, `!`, `[`, `(`, `%`, ...) | luôn đúng | dừng `property`, phần còn lại là `value` |

### Chuẩn Hóa `value` Sau Khi Tách

1. Value bắt đầu bằng `!` -> thêm hậu tố `!important`.
2. Value bắt đầu bằng `--` -> đổi thành `var(--...)`.
3. Value dạng `[...]` -> bỏ `[` `]`, rồi thay `;` thành khoảng trắng.
4. Ký tự `#` trong value giữ nguyên (hex color).

Pseudo-flow cho AI:

```text
class -> selector -> media -> layer -> property -> value
if value startsWith('!') => important
if value startsWith('--') => var(value)
if value is bracketed [..] => strip brackets + replace ';' with ' '
```

### Test Vector Mini (10 input -> expected tuple)

| # | Input | Expected tuple |
| :--- | :--- | :--- |
| 1 | `m10px` | `{ media: '', layer: '', property: 'm', value: '10px', selector: '' }` |
| 2 | `md:w100%` | `{ media: 'md', layer: '', property: 'w', value: '100%', selector: '' }` |
| 3 | `sm:3bgWhite` | `{ media: 'sm', layer: '3', property: 'bg', value: 'White', selector: '' }` |
| 4 | `cBlue@:hover` | `{ media: '', layer: '', property: 'c', value: 'Blue', selector: ':hover' }` |
| 5 | `m-10px` | `{ media: '', layer: '', property: 'm', value: '-10px', selector: '' }` |
| 6 | `opc0.8` | `{ media: '', layer: '', property: 'opc', value: '0.8', selector: '' }` |
| 7 | `bgc--brand` | `{ media: '', layer: '', property: 'bgc', value: '--brand', selector: '' }` |
| 8 | `c!#0a64e8` | `{ media: '', layer: '', property: 'c', value: '!#0a64e8', selector: '' }` |
| 9 | `w[calc(100%;-;10px)]` | `{ media: '', layer: '', property: 'w', value: '[calc(100%;-;10px)]', selector: '' }` |
| 10 | `[btnPrimary]` | `{ media: '', layer: '', property: '[btnPrimary]', value: '', selector: '' }` |

## Bảng Sai -> Đúng (Những Lỗi Gây Vỡ Parse)

| Sai | Đúng | Giải thích |
| :--- | :--- | :--- |
| `bdn` | `bdN` | Value viết tắt dạng chữ cái phải viết hoa ký tự đầu (`N` = none). |
| `df` | `dF` | `F` là value viết tắt của `flex`. |
| `posa` | `posA` | `A` là value viết tắt của `absolute`. |
| `tr0.2s` | `tran0.2s` | Property `transition` là `tran`, không phải `tr`. |
| `op0.8` | `opc0.8` | `op` là `object-position`; `opc` mới là `opacity`. |
| `3:bgWhite` | `3bgWhite` | Layer là số đứng liền trước property, không có `:` sau layer. |
| `hover:cRed` | `cRed@:hover` | Selector modifier dùng hậu tố `@Selector`. |
| `tablet:dB` (chưa khai báo) | `tablet:dB` + `breakpoints` config | Media custom phải được khai báo trước trong config. |
| `m--10px` | `m-10px` | Số âm dùng `-`; `--` dành cho CSS variable (`bgc--brand`). |
| `bgcbrand` | `bgcBrand` hoặc `bgc--brand` | Cần điểm ngắt rõ ràng để parser tách đúng value. |
| `wcalc(100%-10px)` | `w[calc(100%;-;10px)]` | Value phức tạp nên bọc `[]`, dùng `;` để biểu diễn khoảng trắng. |
| `!cRed` | `c!Red` | `!` phải đứng trong phần value (sau property), không đứng đầu class. |

## Ví Dụ Chính Xác Theo Dictionary

Danh sách đầy đủ alias xem tại [DICTIONARY.md](./DICTIONARY.md).

Một số alias dễ nhầm:
1. `op` = `object-position`
2. `opc` = `opacity`
3. `tran` = `transition`
4. `tr` = `transparent` (value alias, không phải property transition)

Ví dụ:

```html
<div class="dF aiC jcSB p12px;16px bdN bgcWhite"></div>
<div class="tran0.2s opc0.8@:hover"></div>
<div class="c!#0a64e8"></div>
<div class="w[calc(100%;-;10px)]"></div>
```

Chuỗi thuộc tính bằng `&` (đúng):
1. `fk-dF&fxdC@;li`
2. `fk-md:dF&fxdC`
3. `md:[row]&[col]@;li` (với `aliases.row`, `aliases.col`)

Quy ước `aliases` khuyến nghị (đầy đủ declaration):
```js
aliases: {
  row: ['display:flex', 'padding:5px'],
  col: ['flex-direction: column', 'margin:5px']
}
```

Sai -> Đúng:
1. `aliases: { row:['dF'], col:['fxdC'] }` -> sai (không còn hỗ trợ).
2. `aliases: { row:['display:flex'], col:['flex-direction: column'] }` -> đúng.

## Dùng Trong React / Component

```jsx
import { clsx } from '@fwkui/x-css';

export function Button({ primary, children }) {
  return (
    <button
      className={clsx(
        'dF aiC jcC p10px;16px bdN bdra8px tran0.2s',
        primary ? 'bgc#0a64e8 cWhite' : 'bgc#e5e7eb c#111827',
        'opc0.9@:hover'
      )}
    >
      {children}
    </button>
  );
}
```

## Shared Instance (Khởi Tạo Một Lần)

Nếu bạn muốn tái sử dụng cùng một instance, dùng factory.
Khuyến nghị mặc định cho app chạy thật:
1. Không đặt `prefix`.
2. Không bật `cache`.
3. Chỉ bật `cache` hoặc `prefix` khi bạn chủ động chấp nhận tradeoff vận hành.

```ts
import { createSharedInstance } from '@fwkui/x-css';

export const fx = createSharedInstance();

// Browser: gọi 1 lần khi app khởi động
fx.observe(document);

// Dùng ở mọi nơi
const className = fx.clsx('dF aiC jcC p10px;16px');

// Nếu dictionaryImport là true/string và cần chắc chắn CSS đã sẵn sàng:
await fx.ready();

// SSR / debug
const cssText = fx.getCss();
```

## Tailwind Migration Helper

`@fwkui/x-css` có helper bán tự động để hỗ trợ migration từ chuỗi utility Tailwind sang token `x-css`.

Public API:

```ts
import {
  assessTailwindMigrationReadiness,
  classifyTailwindToken,
  convertTailwindClasses,
  convertTailwindToken,
  getTailwindCoverageMatrix
} from '@fwkui/x-css';

const result = convertTailwindClasses(
  'flex items-center justify-between gap-4 p-4 bg-white text-slate-900 rounded-lg border border-slate-200'
);

console.log(result.output);
// dF ai[center] jc[space-between] gap16px p16px bgc#ffffff c#0f172a bdra8px bdw1px bds[solid] bdcCurrentColor bdc#e2e8f0

console.log(classifyTailwindToken('md:fxd[row]'));
// 'xcss'

const readiness = assessTailwindMigrationReadiness(
  'transition flex group-hover:bg-slate-50 md:fxd[row]'
);

console.log(readiness.releaseDecision);
// 'blocked'

console.log(readiness.autoApplyOutput);
// dF md:fxd[row]
```

Contract hiện tại:
1. Helper ưu tiên các utility Tailwind phổ biến cho layout, spacing, color, typography, border, shadow, width/height.
2. Responsive/state variants phổ biến như `sm:`, `md:`, `hover:`, `focus:` được chuyển sang format `x-css`.
3. Token đầu vào được phân loại thành `tailwind`, `xcss`, `ambiguous`, hoặc `unknown`.
4. Đây là migration helper, không phải promise “convert 100% Tailwind không cần review”.
5. Khi publish hoặc migrate codebase thật, nên ưu tiên `mode: 'safe'` thay vì `legacy`.
6. Helper này làm việc trên raw utility string và bỏ qua config `prefix`; khi migrate Tailwind, nên coi `prefix` là rỗng.

Ví dụ:

```ts
const converted = convertTailwindToken('md:hover:bg-slate-50');

console.log(converted.outputs);
// ['md:bgc#f8fafc@:hover']

const safe = convertTailwindClasses('md:fxd[row] p-2.5', { mode: 'safe' });
console.log(safe.passthrough); // ['md:fxd[row]']
console.log(safe.converted);   // ['p10px']
console.log(safe.ambiguous);   // ['p-2.5']
```

### Mode

`convertTailwindToken()` và `convertTailwindClasses()` nhận option:

```ts
type TailwindConversionMode = 'legacy' | 'safe' | 'strict'
```

Ý nghĩa:
1. `legacy`:
   giữ hành vi tương thích cũ.
   Token không convert được có thể được passthrough nếu `preserveUnknown !== false`.
2. `safe`:
   chỉ passthrough token đã được xác nhận là `x-css`.
   Token `ambiguous` hoặc `unknown` sẽ không được giữ nguyên mù.
3. `strict`:
   dùng cùng `preserveUnknown: false` để ép toàn bộ token không chắc chắn đi vào `unsupported`.
   Đây là mode phù hợp cho codemod, CI, hoặc review trước khi deploy.

Ví dụ khuyến nghị:

```ts
const result = convertTailwindClasses(source, {
  mode: 'safe',
  preserveUnknown: false
});
```

### Kết Quả Trả Về

`convertTailwindToken()` trả:

```ts
{
  input: string
  outputs: string[]
  status: 'converted' | 'passthrough' | 'unsupported'
  classification: 'tailwind' | 'xcss' | 'ambiguous' | 'unknown'
  exact: boolean
  warnings: Array<{ token: string; message: string }>
}
```

`convertTailwindClasses()` trả:

```ts
{
  input: string
  output: string
  details: TailwindTokenConversion[]
  converted: string[]
  passthrough: string[]
  unsupported: string[]
  ambiguous: string[]
  warnings: TailwindConversionWarning[]
}
```

Ý nghĩa thực tế:
1. `converted`: token đã map sang `x-css`.
2. `passthrough`: token được giữ nguyên vì là `x-css` thật, hoặc vì caller vẫn bật giữ token gốc.
3. `unsupported`: token chưa có mapping an toàn.
4. `ambiguous`: token có hình thức dễ nhầm giữa Tailwind và `x-css`, cần review.

### Readiness API Cho Sản Phẩm Thật

Nếu dùng framework này để migrate code chạy production, không nên dùng mỗi `convertTailwindClasses()` làm quyết định release.
Hãy chạy preflight bằng `assessTailwindMigrationReadiness()`:

```ts
const report = assessTailwindMigrationReadiness(source);

if (report.releaseDecision === 'safe') {
  // Chỉ còn exact conversion hoặc x-css thật
  apply(report.autoApplyOutput);
}

if (report.releaseDecision === 'review') {
  // Có output gần đúng như `transition -> tran0.2s`
  review(report.approximateConverted);
}

if (report.releaseDecision === 'blocked') {
  // Có utility không an toàn để tự động migrate
  fail(report.blocked);
}
```

Contract của report:
1. `autoApplyOutput`: chỉ chứa token exact-converted và token `x-css` thật, theo đúng thứ tự gốc.
2. `approximateConverted`: token đã convert nhưng không đủ an toàn để áp thẳng production.
3. `reviewRequired`: tất cả token cần con người xem lại.
4. `blocked`: token không nên auto-apply trong flow migration thật.
5. `safeToAutoApply`: chỉ `true` khi không còn token phải review.

Coverage machine-readable:

```ts
const matrix = getTailwindCoverageMatrix();
```

`matrix` dùng được cho codemod, CI gate, dashboard coverage, hoặc rule riêng của team sản phẩm.

### Canonical Output

Khi helper sinh token `x-css`, nên coi các output dưới đây là canonical:
1. `inline-flex -> dIf`
2. `inline-block -> dIb`
3. `inline-grid -> dIg`
4. `border -> bdw1px bds[solid] bdcCurrentColor`
5. `text-transparent -> cTransparent`
6. `border-transparent -> bdcTransparent`
7. `bg-[currentColor] -> bgcCurrentColor`

Không nên dựa vào việc runtime parser “vẫn hiểu được” để sinh các biến thể khác như `dIF`, `dIB`, `bdctransparent`.

### Coverage Hiện Tại

Nhóm utility đã hỗ trợ tốt:
1. display / position / flex cơ bản
2. spacing / size / fraction / width scale / `mx-auto` / `inset-x-*` / `inset-y-*`
3. color cơ bản (`bg-*`, `text-*`, `border-*`)
4. rounded / border / shadow / `appearance-none`
5. font-size / font-weight / line-height / letter-spacing / `basis-*` / `order-*`
6. object-fit / object-position cơ bản
7. align / place / justify / content helpers phổ biến
8. một phần responsive + selector variants (`sm`, `md`, `hover`, `focus`, `before`, `after`, `placeholder`, `selection`)

Nhóm nên coi là cần review thủ công hoặc fallback riêng:
1. `group-hover:*`, `group-focus:*`, `peer-*`
2. `dark:*`
3. `divide-*`
4. `duration-*`, `ease-*`, `delay-*`
5. transform chain phức hợp như `translate-*`, `scale-*`, `rotate-*`

### Quy Trình Dùng An Toàn

Khi migrate project thật:
1. Chạy converter với `mode: 'safe'`.
2. Áp dụng trực tiếp các token trong `converted`.
3. Giữ nguyên các token trong `passthrough` chỉ khi chúng là `x-css` thật.
4. Review bắt buộc các token trong `ambiguous` và `unsupported`.
5. Chạy lại app, build, và kiểm tra giao diện thực tế sau mỗi đợt chuyển đổi.

Khuyến nghị:
1. Không chạy codemod toàn repo ở `legacy mode` rồi deploy thẳng.
2. Không dùng parser `x-css` như bằng chứng rằng token Tailwind “đã an toàn”.
3. Nếu output chứa nhiều `ambiguous`, hãy dừng batch hiện tại và bổ sung mapping trước khi chuyển tiếp.

Alias tương đương:

```ts
import { createSharedClsx } from '@fwkui/x-css';
const fx = createSharedClsx();
```

Quy tắc dùng ổn định:
1. Tạo shared instance đúng 1 lần ở bootstrap.
2. Không khởi tạo lại instance ở mỗi lần render component.
3. Mặc định để `prefix` rỗng và `cache` tắt.
4. Nếu bạn tự bật `cache` hoặc `prefix`, giữ nguyên cấu hình đó trong suốt vòng đời app.

## Cấu Hình

```js
import xcss from '@fwkui/x-css';

xcss.cssObserve(document, {
  theme: {
    brand: '#0a64e8',
    danger: '#ef4444'
  },
  breakpoints: [
    { tablet: 'screen and (min-width: 768px)' }
  ],
  base: 'body{margin:0;font-family:system-ui,sans-serif;}',
  excludePrefixes: ['bs-', 'rs-'],
  excludes: ['legacy-*'],
  dictionaryImport: true
});
```

Sau đó dùng class: `cBrand tablet:dB`.

Gợi ý tối ưu bỏ qua parse:
1. Ưu tiên `excludePrefixes` để bỏ qua nhanh theo tiền tố, ví dụ `bs-`, `rs-`.
2. Dùng `excludes` khi cần rule chính xác hoặc wildcard (`*`), ví dụ `legacy-*`, `tmp-debug`.
3. Không nên lấy `prefix` làm cấu hình mặc định; chỉ dùng khi bạn thật sự cần tách namespace class.

Ví dụ đầu vào cho `excludes`:

| Cấu hình | Input class | Kết quả mong đợi |
| :--- | :--- | :--- |
| `excludes: ['container']` | `container m10px` | `container` giữ nguyên; chỉ `m10px` được parse thành CSS |
| `excludes: ['bs-*']` | `bs-btn m10px` | `bs-btn` bị bỏ qua parse; `m10px` vẫn parse |
| `excludes: ['*-debug']` | `card-debug p8px` | `card-debug` bị bỏ qua parse; `p8px` vẫn parse |
| `excludes: ['tmp-*', 'legacy-*']` | `tmp-a legacy-card dF` | `tmp-a`, `legacy-card` bị bỏ qua; `dF` vẫn parse |
| `excludePrefixes: ['bs-', 'rs-']` | `bs-modal rs-open h100%` | `bs-modal`, `rs-open` bị bỏ qua nhanh; `h100%` vẫn parse |

Ví dụ output thực tế của `clsx`:

| Config | Gọi `clsx(...)` | Output | Ghi chú |
| :--- | :--- | :--- | :--- |
| `excludePrefixes: ['bs-'], excludes: ['abc*']` | `clsx('bs-a', 'abcde')` | `bs-a abcde` | Cả hai bị bỏ qua, giữ nguyên class gốc. |
| `excludePrefixes: ['bs-'], excludes: ['abc*']` | `clsx('bs-a', 'abcde', 'm10px')` | `bs-a abcde D0` | Chỉ `m10px` parse thành class hash. |
| `excludes: ['bs-', 'abc*']` | `clsx('bs-a', 'abcde', 'm10px')` | `bs-a abcde D0` | `bs-` là exact match nên không bắt `bs-a`; `bs-a` vẫn giữ nguyên vì token không sinh CSS hợp lệ. |
| `excludes: ['abc*def']` | `clsx('abcXYZdef', 'm10px')` | `abcXYZdef D0` | Wildcard giữa chuỗi hoạt động bình thường. |
| `excludes: ['*-abc']` | `clsx('foo-abc', 'm10px')` | `foo-abc D0` | Wildcard cuối chuỗi hoạt động bình thường. |

Lưu ý format output:
1. `clsx` trả chuỗi class phân tách bằng khoảng trắng, không dùng dấu phẩy.
2. Token không parse được hoặc bị exclude sẽ giữ nguyên ở output.

Lưu ý khi dùng cùng `prefix`:
1. Engine kiểm tra `excludes`/`excludePrefixes` trước, sau đó mới kiểm tra `prefix`.
2. Nếu token match exclude thì giữ nguyên class gốc và không parse tiếp.
3. Nếu có `prefix: 'fk-'`, token không bắt đầu bằng `fk-` sẽ giữ nguyên class gốc.
4. `prefix` là cấu hình tùy chọn, không phải khuyến nghị mặc định.


`dictionaryImport`:
1. `true` (mặc định): dùng ngay built-in dictionary từ `src/dictionary.ts`/bundle hiện tại, không self-import `dictionary.js` nội bộ nữa.
2. `false`: tắt dictionary.
3. `string` URL/path: import dictionary ngoài.

Lưu ý:
1. `dictionaryImport: true` là đồng bộ, có thể parse built-in dictionary ngay khi khởi tạo.
2. Chỉ trường hợp `dictionaryImport` là `string` URL/path mới cần import bất đồng bộ.
3. Nếu cần chắc chắn dictionary ngoài đã sẵn sàng trước khi render quan trọng, dùng `await engine.ready`.

`cache`:
1. Mặc định `cache` đang tắt (`loadOnInit: false`).
2. `styleId` (mặc định `fwkui`): id thẻ `<style>` runtime.
3. `version` (mặc định `v1`): tham gia vào cache key để chủ động invalidate.
4. `compression` (mặc định `true`): nén cache trước khi lưu `localStorage`.
5. `debounceMs` (mặc định `1000`): debounce chu kỳ nén + lưu cache.
6. `sizeLast` (mặc định `1000`): seed mặc định cho bộ sinh key `D...`.

Khuyến nghị:
1. Không bật `cache` mặc định cho mọi app.
2. Không bật/tắt `cache` lặp lại theo route, component, hoặc session ngắn.
3. Chỉ bật `cache` khi bạn chủ động muốn tối ưu first paint hoặc SSR/MPA hydration.
4. Nếu đã bật `cache`, hãy cấu hình ổn định và giữ nguyên trong toàn app.

Khi `compression: true`:
1. Ưu tiên `CompressionStream` (deflate-raw + base64) nếu runtime hỗ trợ.
2. Tự động fallback về LZW nếu runtime không hỗ trợ stream.

Đồng bộ nhiều tab:
1. Khi phát sinh key mới, engine gửi delta `{ class -> key }` sang tab khác qua `BroadcastChannel` nếu môi trường hỗ trợ.
2. Nếu không có `BroadcastChannel`, engine fallback về sự kiện `storage`.
3. `localStorage` cache vẫn giữ vai trò snapshot đầy đủ cho lần mở tab mới hoặc reload sau đó.

Quy tắc cache key:
`cacheKey = styleId + "_cache_" + version`

Ví dụ mặc định:
`fwkui_cache_v1`

Nếu import dictionary ngoài:

```js
const engine = xcss.css({ dictionaryImport: 'https://cdn.example.com/xcss-dict.mjs' });
await engine.ready;
const { clsx, observe } = engine.buildCss(document);
observe();
```

Mẫu file để thay thế trực tiếp URL `https://cdn.example.com/xcss-dict.mjs`:

```js
// xcss-dict.mjs
// Có thể public lên CDN của bạn rồi truyền URL vào dictionaryImport

export const SHORT_PROPERTIES = {
  d: 'display',
  c: 'color',
  bgc: 'background-color',
  bd: 'border',
  w: 'width',
  h: 'height',
  p: 'padding',
  m: 'margin',
  tran: 'transition',
  opc: 'opacity'
};

export const COMMON_VALUES = {
  n: 'none',
  b: 'block',
  f: 'flex',
  t: 'transparent',
  i: 'inherit'
};

export const SPECIFIC_VALUES = {
  d: {
    f: 'flex',
    b: 'block',
    ib: 'inline-block'
  },
  bd: {
    n: 'none'
  },
  c: {
    pri: '#0a64e8',
    danger: '#ef4444'
  },
  bgc: {
    pri: '#0a64e8',
    soft: '#e8f1ff'
  }
};

export default {
  SHORT_PROPERTIES,
  COMMON_VALUES,
  SPECIFIC_VALUES
};
```

Lưu ý format:
1. Nên export theo đúng mẫu trên với object tĩnh/plain object.
2. Không nên tạo dictionary bằng biểu thức động, function, hoặc biến trung gian phức tạp.
3. `export default` là tùy chọn; 3 named export `SHORT_PROPERTIES`, `COMMON_VALUES`, `SPECIFIC_VALUES` mới là phần quan trọng nhất.

Quy trình thay link:
1. Tạo file `xcss-dict.mjs` theo mẫu trên.
2. Upload lên CDN/public URL của bạn.
3. Thay `dictionaryImport` bằng URL thật.
4. Chờ `await engine.ready` trước khi render class.

## Bootloader Từ Cache (Tùy Chọn)

Chỉ dùng helper `getBootloaderScript` khi bạn chủ động bật `cache` và muốn lấy CSS từ `localStorage` trước khi bundle chạy.

### Dùng helper `getBootloaderScript`

```js
import { getBootloaderScript } from '@fwkui/x-css';

const styleId = 'fwkui';
const version = 'v1';

const bootloaderScript = getBootloaderScript(styleId, version, { loadOnInit: true });
const bootloaderScriptCompact = getBootloaderScript(styleId, version, {
  compact: true,
  loadOnInit: true
});
```

### Cấu trúc chèn vào `<head>` (khuyến nghị)

```html
<head>
  <!-- 1) Bootloader từ cache: chạy sớm nhất để giảm FOUC -->
  <script>
    /* nội dung từ getBootloaderScript(styleId, version, { loadOnInit: true }) */
  </script>

  <!-- 2) Bundle/module của app -->
  <script type="module" src="/assets/main.js"></script>
</head>
```

### Đoạn dán thủ công vào `<head>` (copy/paste)

Thay 2 biến ngay đầu script nếu cần:
1. `sid = 'fwkui'` -> đổi theo `cache.styleId`.
2. `ver = 'v1'` -> đổi theo `cache.version`.

```html
<script>
  (async()=>{const sid='fwkui',ver='v1',k=sid+'_cache_'+ver;const L=s=>{if(!s)return'';const d={};let z=256;for(let i=0;i<256;i++)d[i]=String.fromCharCode(i);const c=[...s].map(ch=>ch.charCodeAt(0));let p=c[0],ph=d[p]||'',r=ph;for(let i=1;i<c.length;i++){const x=c[i];let e=d[x];if(!e)e=x===z?ph+ph[0]:'';r+=e;d[z++]=ph+e[0];ph=e;}return r};const S=()=>typeof DecompressionStream!=='undefined'&&typeof Blob!=='undefined'&&typeof Response!=='undefined';const B=b=>{if(typeof atob==='function'){const s=atob(b),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u;}if(typeof Buffer!=='undefined')return new Uint8Array(Buffer.from(b,'base64'));throw new Error('base64');};const D=async p=>{if(!S())return null;try{return await new Response(new Blob([B(p)]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();}catch{return null;}};const P=async raw=>{if(!raw)return null;try{let j=JSON.parse(raw);if(j&&j.__xcss_cache_v===3&&j.compressed===true&&j.algorithm==='deflate-raw'&&j.encoding==='base64'&&typeof j.payload==='string'){const ex=await D(j.payload);if(!ex)return null;j=JSON.parse(ex);}else if(j&&j.__xcss_cache_v===2&&j.compressed===true&&typeof j.payload==='string'){const ex=L(j.payload);if(!ex)return null;j=JSON.parse(ex);}return j&&j.cssText?j:null;}catch{return null;}};try{if(typeof window==='undefined'||!window.localStorage)return;let p=await P(localStorage.getItem(k));if(!p)return;let st=document.getElementById(sid);if(!st){st=document.createElement('style');st.id=sid;document.head.appendChild(st);}let css=p.cssText.root?p.cssText.root+'\\n':'';for(const n in p.cssText)if(n!=='root')css+=(p.cssText[n]||'')+'\\n';st.textContent=css;}catch{}})();
</script>
```

Ví dụ render HTML từ server:

```js
import { getBootloaderScript } from '@fwkui/x-css';

const styleId = 'fwkui';
const version = 'v1';
const bootloaderScript = getBootloaderScript(styleId, version, {
  compact: true,
  loadOnInit: true
});

const html = `
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <script>${bootloaderScript}</script>
    <script type="module" src="/assets/main.js"></script>
  </head>
  <body><div id="app"></div></body>
</html>`;
```

Lưu ý:
1. Đồng bộ `styleId` + `version` giữa bootloader và cấu hình `xcss.css(...)`.
2. Script tạo từ `getBootloaderScript` ưu tiên `DecompressionStream` (cache deflate-raw) và fallback LZW.
3. Sau bootloader vẫn cần gọi `xcss.cssObserve(...)` như bình thường.
4. Mặc định `loadOnInit` đang tắt; chỉ bật bằng `{ loadOnInit: true }` khi bạn thật sự dùng cache runtime.
5. Dùng `{ compact: true }` khi muốn script trả về ở dạng nén gọn để nhúng HTML.
6. Nếu dữ liệu cache dưới key hiện tại bị lỗi/không decode được, engine sẽ tự xóa key đó để lần chạy sau lưu lại dữ liệu mới.
7. Cache runtime chỉ khởi tạo khi browser dùng được `localStorage` writable; nếu không có thì engine/bootloader sẽ bỏ qua load-save cache.

### Khi nào nên dùng `getBootloaderScript`

1. SSR/MPA hoặc trang tĩnh cần giảm FOUC ngay từ first paint.
2. Ứng dụng có cache CSS trong `localStorage` và muốn render gần như tức thì trước khi bundle chạy.
3. Khi bạn chủ động kiểm soát thứ tự script trong `<head>`.

Không bắt buộc dùng khi:
1. Trang không cần tối ưu first paint.
2. Không dùng cache runtime.
3. CSP không cho inline script (trừ khi đã cấu hình nonce/hash phù hợp).

## SSR Và Static Extraction

SSR:

```js
import { getCss } from '@fwkui/x-css';

const styles = getCss();
// <style dangerouslySetInnerHTML={{ __html: styles }} />
```

Static extraction:

```js
import xcss from '@fwkui/x-css';
import fs from 'node:fs';

const { clsx, getCssString } = xcss.css({
  theme: { brand: '#0a64e8' }
}).buildCss();

clsx('m10px p20px cBrand dF');

fs.writeFileSync('./public/styles.css', getCssString());
```

## Prompt Mẫu Cho AI (Dùng Thẳng)

Bạn có thể đưa block này vào prompt system/project rules:

```markdown
You are using @fwkui/x-css.
Generate class names strictly with syntax: [Media]:[Layer][Property][Value][@Selector].

Rules:
1. Value is required for normal utility classes.
2. Layer must be numeric and placed directly before Property (e.g. 3bgWhite).
3. Selector must be suffix @Selector (e.g. cBlue@:hover).
4. Use dictionary aliases from DICTIONARY.md.
5. Keep abbreviation values capitalized when needed (bdN, dF, posA).
6. For complex CSS values, use bracket notation, and use ';' as space placeholder:
   w[calc(100%;-;10px)].
7. Use opc for opacity, tran for transition, op for object-position.

Before final answer:
- Validate each class can be parsed into {media, layer, property, value, selector}.
- Avoid invalid forms like bdn, tr0.2s, op0.8, 3:bgWhite, hover:cRed.
```

Template giao việc cho AI thiết kế UI:

```markdown
Thiết kế giao diện [màn hình] bằng @fwkui/x-css.
Yêu cầu:
1. Trả về HTML/JSX hoàn chỉnh.
2. Chỉ dùng class theo cú pháp [Media]:[Layer][Property][Value][@Selector].
3. Với value phức tạp, dùng [] và ';' thay cho khoảng trắng.
4. Không dùng class sai quy tắc (bdn, tr0.2s, op0.8, hover:cRed...).
5. Cuối câu trả lời thêm bảng kiểm:
   - class
   - parsed tuple {media, layer, property, value, selector}
   - css dự kiến
```

## Checklist QA Trước Khi Build

1. Không còn class sai viết hoa value (`bdn`, `df`, `posa`).
2. Không dùng nhầm alias (`op`/`opc`, `tr`/`tran`).
3. Các value phức tạp đều bọc `[]`.
4. Media custom đã khai báo trong `breakpoints`.
5. Không có dạng sai layer/selector (`3:bg`, `hover:cRed`).
6. Test parser với ít nhất bộ 10 test vector ở trên.

## Tài Liệu Liên Quan

1. Dictionary đầy đủ: [DICTIONARY.md](./DICTIONARY.md)
2. Source code: [https://github.com/vuits24/fwkui](https://github.com/vuits24/fwkui)

## License

Licensed under MIT. See [LICENSE](./LICENSE).

Updated: 2026-03-18
