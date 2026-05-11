# fwkui-rs

Rust workspace cho `@fwkui/x-css`.

## Crates

1. `x-core` / package `fwkui-x-core`
   - Parser contract tương thích cú pháp x-css hiện tại.
   - Resolve property/value cơ bản.
   - Registry sinh class name ổn định và CSS text.

2. `x-css` / package `fwkui-x-css`
   - Facade crate cho app/framework dùng chung.
   - Re-export `fwkui-x-core`.
   - Giữ feature placeholders `yew`, `leptos`, `sycamore` để thêm adapter mỏng sau mà không đổi crate layout.

## Raw class name

Mặc định registry trả class hash dạng `D...`. Nếu muốn giữ nguyên token x-css ở output:

```rust
use fwkui_x_css::{XCoreConfig, XCss};

let mut config = XCoreConfig::default();
config.hash_class_name = false;

let mut xcss = XCss::with_config(config);
let class_name = xcss.clsx("dF aiC p10px");
assert_eq!(class_name, "dF aiC p10px");
```

Viết gọn hơn:

```rust
use fwkui_x_css::XCss;

let xcss = XCss::raw();
let class_name = xcss.c("dF aiC p10px");
let css = xcss.style();
```

Ví dụ runnable:

```bash
cargo run --manifest-path fwkui-rs/Cargo.toml -p fwkui-x-css --example hash_modes
cargo run --manifest-path fwkui-rs/Cargo.toml -p fwkui-x-css --example raw_prefix_breakpoint
```

## Test

```bash
cargo test --manifest-path fwkui-rs/Cargo.toml
```

## Framework examples

Ví dụ sử dụng với Yew, Leptos, Sycamore nằm trong:

```text
fwkui-rs/examples/
```

Mỗi ví dụ là app Trunk độc lập:

```bash
cd fwkui-rs/examples/yew-basic
trunk serve
```

Ví dụ đầy đủ cho hash mode:

```bash
cd fwkui-rs/examples/leptos-hash-complete
trunk serve
```

Ví dụ viết class trực tiếp, không gọi `xcss.c(...)` trong markup:

```bash
cd fwkui-rs/examples/leptos-direct-class
trunk serve
```

Ví dụ `leptos-hash-complete` có thêm `leptos_router` với 3 route:

- `/`
- `/login`
- `/register`
