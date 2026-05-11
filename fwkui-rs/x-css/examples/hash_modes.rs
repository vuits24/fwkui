use fwkui_x_css::{XCoreConfig, XCss};

fn main() {
    let input = "dF aiC jcC p10px;16px bdN bdra8px bgc#0a64e8 cWhite opc0.9@:hover";

    let hashed = XCss::new();
    let hashed_class = hashed.clsx(input);

    println!("== Hash mode ==");
    println!("input:  {input}");
    println!("class:  {hashed_class}");
    println!("css:\n{}\n", hashed.css_text());

    let mut raw_config = XCoreConfig::default();
    raw_config.hash_class_name = false;

    let raw = XCss::with_config(raw_config);
    let raw_class = raw.clsx(input);

    println!("== Raw mode ==");
    println!("input:  {input}");
    println!("class:  {raw_class}");
    println!("css:\n{}", raw.css_text());
}
