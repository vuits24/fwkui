use fwkui_x_css::XCss;
use sycamore::prelude::*;

#[component]
fn App() -> View {
    let xcss = XCss::raw();

    let page = xcss.c("dF aiC jcC p24px bgc#f6f7fb");
    let panel =
        xcss.c("dF fxdC g16px p24px bdN bdra8px bgcWhite bxsh[0;16px;40px;rgba(15,23,42,0.12)]");
    let title = xcss.c("m0 fs24px fw700 c#111827");
    let body = xcss.c("m0 fs14px lh1.6 c#4b5563");
    let actions = xcss.c("dF aiC g10px");
    let primary =
        xcss.c("dF aiC jcC p10px;16px bdN bdra8px bgc#0a64e8 cWhite crP tran0.2s opc0.9@:hover");
    let secondary = xcss.c("dF aiC jcC p10px;16px bdN bdra8px bgc#e5e7eb c#111827 crP");
    let css = xcss.style();

    view! {
        section(class=page) {
            article(class=panel) {
                h1(class=title) { "Sycamore + fwkui x-css" }
                p(class=body) {
                    "Ví dụ tạo class bằng fwkui-x-css Rust core và inject CSS trực tiếp trong component Sycamore."
                }
                div(class=actions) {
                    button(class=primary) { "Lưu" }
                    button(class=secondary) { "Hủy" }
                }
            }
        }
        style { (css) }
    }
}

fn main() {
    sycamore::render(App);
}
