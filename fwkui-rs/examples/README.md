# fwkui-rs examples

Các ví dụ này là app độc lập, không nằm trong workspace members. Mục tiêu là cho người dùng copy/chạy nhanh bằng Trunk mà không kéo dependency framework vào `x-core` hoặc `x-css`.

## Chuẩn bị

```bash
rustup target add wasm32-unknown-unknown
cargo install trunk
```

## Yew

```bash
cd fwkui-rs/examples/yew-basic
trunk serve
```

## Leptos

```bash
cd fwkui-rs/examples/leptos-basic
trunk serve
```

Direct class literal, không gọi `xcss.c(...)` trong markup:

```bash
cd fwkui-rs/examples/leptos-direct-class
trunk serve
```

Hash mode đầy đủ:

```bash
cd fwkui-rs/examples/leptos-hash-complete
trunk serve
```

## Sycamore

```bash
cd fwkui-rs/examples/sycamore-basic
trunk serve
```

## Pattern chung

1. Tạo `XCss::raw()` nếu muốn giữ nguyên class, hoặc `XCss::new()` / `XCss::with_config(...)` nếu muốn hash.
2. Với Yew/Leptos, gọi `xcss.c("...")` trực tiếp trong `class`.
3. Đặt `<style>{xcss.style()}</style>` sau các node đã dùng `xcss.c(...)`.
4. Riêng Sycamore nên precompute class vào biến vì macro attribute của Sycamore move expression vào closure.

```rust
let xcss = fwkui_x_css::XCss::raw();

view! {
    <button class=xcss.c("dF aiC jcC p10px;16px bdN bdra8px bgc#0a64e8 cWhite")>
        "Lưu"
    </button>
    <style>{xcss.style()}</style>
}
```

Nếu muốn viết class trực tiếp như HTML/Rust framework bình thường, dùng raw mode + DOM observer:

```rust
let mut config = fwkui_x_css::XCoreConfig::default();
config.hash_class_name = false;
let xcss = fwkui_x_css::XCss::with_config(config);

Effect::new(move |_| {
    xcss.observe_document().unwrap();
});

view! {
    <button class="dF aiC jcC p10px;16px bgc--brand cWhite">
        "Đăng nhập"
    </button>
}
```

Pattern này dành cho `hash_class_name = false`. Với hash mode, vẫn nên dùng `xcss.c("...")`.

Hash mode với breakpoint custom, selector, arbitrary value, CSS variable, important, layer và prefix nằm tại:

```text
fwkui-rs/examples/leptos-hash-complete/src/main.rs
```

Project này cũng có ví dụ 3 route bằng `leptos_router`:

- `/` cho trang chủ chứa danh sách nội dung.
- `/login` cho trang đăng nhập.
- `/register` cho trang đăng ký.

Với app nhiều route, pattern đơn giản là mỗi route gọi `xcss.c(...)` trực tiếp trong view và đặt `<style>{xcss.style()}</style>` ở cuối route đó. Không cần tạo danh sách seed class riêng.
