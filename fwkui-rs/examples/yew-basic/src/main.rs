use fwkui_x_css::XCss;
use yew::prelude::*;

#[function_component(App)]
fn app() -> Html {
    let xcss = XCss::raw();

    html! {
        <>
            <section class={xcss.c("dF aiC jcC p24px bgc#f6f7fb")}>
                <article class={xcss.c("dF fxdC g16px p24px bdN bdra8px bgcWhite bxsh[0;16px;40px;rgba(15,23,42,0.12)]")}>
                    <h1 class={xcss.c("m0 fs24px fw700 c#111827")}>{ "Yew + fwkui x-css" }</h1>
                    <p class={xcss.c("m0 fs14px lh1.6 c#4b5563")}>
                        { "Ví dụ tạo class bằng fwkui-x-css Rust core và inject CSS trực tiếp trong component Yew." }
                    </p>
                    <div class={xcss.c("dF aiC g10px")}>
                        <button class={xcss.c("dF aiC jcC p10px;16px bdN bdra8px bgc#0a64e8 cWhite crP tran0.2s opc0.9@:hover")}>{ "Lưu" }</button>
                        <button class={xcss.c("dF aiC jcC p10px;16px bdN bdra8px bgc#e5e7eb c#111827 crP")}>{ "Hủy" }</button>
                    </div>
                </article>
            </section>
            <style>{ xcss.style() }</style>
        </>
    }
}

fn main() {
    yew::Renderer::<App>::new().render();
}
