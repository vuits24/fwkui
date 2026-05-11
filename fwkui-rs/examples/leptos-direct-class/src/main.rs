use fwkui_x_css::{bp, XCoreConfig, XCss};
use leptos::prelude::*;

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
    config.hash_class_name = false;
    config
        .breakpoints
        .push(bp("tablet", "screen and (min-width: 900px)"));
    let xcss = XCss::with_config(config);

    Effect::new(move |_| {
        xcss.observe_document()
            .expect("fwkui x-css document observer failed");
    });

    view! {
        <main class="dF jcC p24px bgc#f6f7fb">
            <section class="dF fxdC g18px w100% tablet:w[920px]">
                <header class="dF fxdC g8px p22px bdN bdra8px bgcWhite bxsh[0;16px;40px;rgba(15,23,42,0.12)]">
                    <p class="m0 fs13px fw700 c--brand">"RAW DIRECT CLASS"</p>
                    <h1 class="m0 fs28px lh1.2 c#111827">"Leptos viết class trực tiếp"</h1>
                    <p class="m0 fs15px lh1.6 c#4b5563 w[calc(100%;-;24px)]">
                        "Không gọi xcss.c(...) trong markup. Rust scan DOM, giữ nguyên class và sinh CSS escaped selector."
                    </p>
                </header>

                <div class="dF fxdC tablet:fxdR g16px">
                    <article class="dF fxdC g14px p18px bdN bdra8px bgcWhite">
                        <h2 class="m0 fs18px c#111827">"Đăng nhập"</h2>
                        <label class="dF fxdC g6px fs14px c#374151">
                            "Email"
                            <input class="p10px;12px bd1px;solid;#d1d5db bdra8px fs14px" type="email" placeholder="you@example.com"/>
                        </label>
                        <button class="dF aiC jcC p10px;16px bdN bdra8px bgc--brand cWhite crP tran0.2s opc0.9@:hover" type="button">
                            "Đăng nhập"
                        </button>
                    </article>

                    <article class="dF fxdC g14px p18px bdN bdra8px bgcWhite">
                        <h2 class="m0 fs18px c#111827">"Danh sách nội dung"</h2>
                        <div class="dF fxdC g10px">
                            <p class="m0 p12px bdN bdra8px bgc--brand-soft c!#0a64e8">"CSS variable + important"</p>
                            <p class="m0 p12px bdN bdra8px bgc#f9fafb c#4b5563">"Arbitrary value: width calc ở đoạn mô tả"</p>
                            <p class="m0 p12px bdN bdra8px bgc#f9fafb c#4b5563">"Breakpoint custom: tablet đổi layout sang hàng ngang"</p>
                        </div>
                    </article>
                </div>
            </section>
        </main>
        <style>{BASE_CSS}</style>
    }
}

fn main() {
    leptos::mount::mount_to_body(App);
}
