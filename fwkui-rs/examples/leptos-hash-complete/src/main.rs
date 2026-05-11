use fwkui_x_css::{bp, XCoreConfig, XCss};
use leptos::prelude::*;
use leptos_router::components::{Route, Router, Routes, A};
use leptos_router::path;

const BASE_CSS: &str = r#"
:root {
  --brand: #0a64e8;
  --brand-soft: #e8f1ff;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #f6f7fb;
}
"#;

#[component]
fn App() -> impl IntoView {
    let mut config = XCoreConfig::default();
    config
        .breakpoints
        .push(bp("tablet", "screen and (min-width: 900px)"));

    let xcss = XCss::with_config(config);

    let mut prefixed_config = XCoreConfig::default();
    prefixed_config.prefix = Some("fk-".to_string());
    let prefixed = XCss::with_config(prefixed_config);

    let active = true;
    let action_class = xcss.clsx(format!(
        "{} {}",
        "dF aiC jcC p10px;16px bdN bdra8px crP tran0.2s opc0.88@:hover",
        if active {
            "bgc--brand cWhite"
        } else {
            "bgc#e5e7eb c#111827"
        }
    ));

    let nav_xcss = xcss.clone();
    let home_xcss = xcss.clone();
    let login_xcss = xcss.clone();
    let register_xcss = xcss.clone();
    let not_found_xcss = xcss.clone();
    let style_xcss = xcss.clone();
    let style_prefixed = prefixed.clone();

    let main_class = xcss.c("dF jcC p24px bgc#f6f7fb");
    let shell_class = xcss.c("dF fxdC g20px w100% tablet:w[960px]");
    let footer_class = xcss.c("dF fxdC g10px p16px bdN bdra8px bgc#111827 cWhite");
    let footer_note_class = xcss.c("m0 fs14px opc0.8");
    let prefixed_box_class = prefixed
        .c("fk-dF fk-aiC fk-jcSp fk-g10px fk-p10px;12px fk-bdN fk-bdra8px fk-bgcTr fk-cWhite");
    let prefixed_note_class = prefixed.c("fk-fs13px fk-opc0.8");
    let prefixed_strong_class = prefixed.c("fk-fs13px fk-fw700");

    view! {
        <Router>
            <main class=main_class>
                <section class=shell_class>
                    <AppHeader xcss=nav_xcss/>

                    <Routes fallback=move || view! { <NotFoundPage xcss=not_found_xcss.clone()/> }>
                        <Route
                            path=path!("")
                            view=move || view! { <HomePage xcss=home_xcss.clone() action_class=action_class.clone()/> }
                        />
                        <Route
                            path=path!("login")
                            view=move || view! { <LoginPage xcss=login_xcss.clone()/> }
                        />
                        <Route
                            path=path!("register")
                            view=move || view! { <RegisterPage xcss=register_xcss.clone()/> }
                        />
                    </Routes>

                    <footer class=footer_class>
                        <p class=footer_note_class>"Prefixed input vẫn hash output"</p>
                        <div class=prefixed_box_class>
                            <span class=prefixed_note_class>"prefix: fk-"</span>
                            <span class=prefixed_strong_class>"hash_class_name: true"</span>
                        </div>
                    </footer>
                </section>
            </main>
        </Router>

        <style>{BASE_CSS}</style>
        <AppStyle xcss=style_xcss prefixed=style_prefixed/>
    }
}

#[component]
fn AppStyle(xcss: XCss, prefixed: XCss) -> impl IntoView {
    view! {
        <style>{format!("{}{}", xcss.style(), prefixed.style())}</style>
    }
}

#[component]
fn AppHeader(xcss: XCss) -> impl IntoView {
    view! {
        <header class=xcss.c("dF fxdC g16px p22px bdN bdra8px bgcWhite bxsh[0;16px;40px;rgba(15,23,42,0.12)]")>
            <div class=xcss.c("dF fxdC g8px")>
                <p class=xcss.c("m0 fs13px fw700 c--brand")>"HASH MODE + ROUTER"</p>
                <h1 class=xcss.c("m0 fs28px lh1.2 c#111827")>"Leptos Router + fwkui-x-css"</h1>
                <p class=xcss.c("m0 fs15px lh1.6 c#4b5563 w[calc(100%;-;24px)]")>
                    "Ví dụ 3 route: trang chủ, đăng nhập, đăng ký. DOM nhận class hash dạng D..., CSS sinh từ token x-css trong Rust."
                </p>
            </div>

            <nav class=xcss.c("dF fxdC tablet:fxdR g10px")>
                <A href="/" exact=true attr:class=xcss.c(r#"dF aiC jcC p10px;14px bdN bdra8px bgc#f3f4f6 bgc--brand-soft@[aria-current="page"] c#111827 c--brand@[aria-current="page"] fw700@[aria-current="page"] tran0.2s"#)>
                    "Trang chủ"
                </A>
                <A href="/login" exact=true attr:class=xcss.c(r#"dF aiC jcC p10px;14px bdN bdra8px bgc#f3f4f6 bgc--brand-soft@[aria-current="page"] c#111827 c--brand@[aria-current="page"] fw700@[aria-current="page"] tran0.2s"#)>
                    "Đăng nhập"
                </A>
                <A href="/register" exact=true attr:class=xcss.c(r#"dF aiC jcC p10px;14px bdN bdra8px bgc#f3f4f6 bgc--brand-soft@[aria-current="page"] c#111827 c--brand@[aria-current="page"] fw700@[aria-current="page"] tran0.2s"#)>
                    "Đăng ký"
                </A>
            </nav>
        </header>
    }
}

#[component]
fn HomePage(xcss: XCss, action_class: String) -> impl IntoView {
    let items = [
        (
            "Bản tin sản phẩm",
            "Cập nhật hash mode và raw mode cho Rust adapter.",
        ),
        (
            "Tài liệu routing",
            "Cấu trúc Router, Routes, Route và style seed.",
        ),
        (
            "Checklist UI",
            "Breakpoint, selector, arbitrary value, CSS variable.",
        ),
    ];

    let style_xcss = xcss.clone();

    view! {
        <section class=xcss.c("dF fxdC g16px")>
            <div class=xcss.c("dF fxdC tablet:fxdR g16px")>
                <article class=xcss.c("dF fxdC g14px p18px bdN bdra8px bgcWhite")>
                    <h2 class=xcss.c("m0 fs18px c#111827")>"Trang chủ"</h2>
                    <p class=xcss.c("m0 fs14px lh1.6 c#4b5563")>
                        "Route / hiển thị danh sách nội dung. Các class vẫn viết trực tiếp bằng xcss.c(...)."
                    </p>
                    <button class=action_class>"Lưu thay đổi"</button>
                </article>

                <article class=xcss.c("dF fxdC g14px p18px bdN bdra8px bgcWhite")>
                    <h2 class=xcss.c("m0 fs18px c#111827")>"Selector + state"</h2>
                    <button
                        data-state="active"
                        class=xcss.c(r#"dF aiC jcC p10px;16px bdN bdra8px bgc#f9fafb c#111827 crP tran0.2s bgc--brand@[data-state="active"] cWhite@[data-state="active"] bxsh[0;10px;24px;rgba(10,100,232,0.25)]@:focus"#)
                    >
                        "Active"
                    </button>
                    <span class=xcss.c("dF aiC jcC p6px;10px bdN bdra8px bgc--brand-soft c!#0a64e8")>
                        "Important color"
                    </span>
                </article>
            </div>

            <div class=xcss.c("dF fxdC g12px")>
                {items.into_iter().map(|(title, body)| {
                    view! {
                        <article class=xcss.c("dF fxdC g6px p16px bdN bdra8px bgcWhite")>
                            <h3 class=xcss.c("m0 fs16px c#111827")>{title}</h3>
                            <p class=xcss.c("m0 fs14px lh1.6 c#4b5563")>{body}</p>
                        </article>
                    }
                }).collect_view()}
            </div>
            <style>{style_xcss.style()}</style>
        </section>
    }
}

#[component]
fn LoginPage(xcss: XCss) -> impl IntoView {
    let style_xcss = xcss.clone();

    view! {
        <section class=xcss.c("dF jcC")>
            <form class=xcss.c("dF fxdC g14px p22px bdN bdra8px bgcWhite w100% tablet:w[420px]")>
                <h2 class=xcss.c("m0 fs22px c#111827")>"Đăng nhập"</h2>
                <label class=xcss.c("dF fxdC g6px fs14px c#374151")>
                    "Email"
                    <input class=xcss.c("p10px;12px bd1px;solid;#d1d5db bdra8px fs14px") type="email" placeholder="you@example.com"/>
                </label>
                <label class=xcss.c("dF fxdC g6px fs14px c#374151")>
                    "Mật khẩu"
                    <input class=xcss.c("p10px;12px bd1px;solid;#d1d5db bdra8px fs14px") type="password" placeholder="••••••••"/>
                </label>
                <button class=xcss.c("dF aiC jcC p10px;16px bdN bdra8px bgc--brand cWhite crP tran0.2s opc0.9@:hover") type="button">
                    "Đăng nhập"
                </button>
            </form>
            <style>{style_xcss.style()}</style>
        </section>
    }
}

#[component]
fn RegisterPage(xcss: XCss) -> impl IntoView {
    let style_xcss = xcss.clone();

    view! {
        <section class=xcss.c("dF jcC")>
            <form class=xcss.c("dF fxdC g14px p22px bdN bdra8px bgcWhite w100% tablet:w[460px]")>
                <h2 class=xcss.c("m0 fs22px c#111827")>"Đăng ký"</h2>
                <label class=xcss.c("dF fxdC g6px fs14px c#374151")>
                    "Tên hiển thị"
                    <input class=xcss.c("p10px;12px bd1px;solid;#d1d5db bdra8px fs14px") type="text" placeholder="Nguyễn Văn A"/>
                </label>
                <label class=xcss.c("dF fxdC g6px fs14px c#374151")>
                    "Email"
                    <input class=xcss.c("p10px;12px bd1px;solid;#d1d5db bdra8px fs14px") type="email" placeholder="you@example.com"/>
                </label>
                <button class=xcss.c("dF aiC jcC p10px;16px bdN bdra8px bgc--brand cWhite crP tran0.2s opc0.9@:hover") type="button">
                    "Tạo tài khoản"
                </button>
            </form>
            <style>{style_xcss.style()}</style>
        </section>
    }
}

#[component]
fn NotFoundPage(xcss: XCss) -> impl IntoView {
    let style_xcss = xcss.clone();

    view! {
        <section class=xcss.c("dF fxdC g10px p22px bdN bdra8px bgcWhite")>
            <h2 class=xcss.c("m0 fs22px c#111827")>"Không tìm thấy trang"</h2>
            <A href="/" attr:class=xcss.c("dF aiC jcC p10px;16px bdN bdra8px bgc--brand cWhite")>
                "Về trang chủ"
            </A>
            <style>{style_xcss.style()}</style>
        </section>
    }
}

fn main() {
    leptos::mount::mount_to_body(App);
}
