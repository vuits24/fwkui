use fwkui_x_css::{bp, XCoreConfig, XCss};

fn main() {
    let mut config = XCoreConfig::default();
    config.hash_class_name = false;
    config.prefix = Some("fk-".to_string());
    config
        .breakpoints
        .push(bp("tablet", "screen and (min-width: 900px)"));

    let xcss = XCss::with_config(config);

    let class_name = xcss.clsx("m10px fk-dF fk-aiC fk-tablet:p8px fk-bgc#0a64e8 fk-cWhite");

    println!("class: {class_name}");
    println!("css:\n{}", xcss.css_text());
}
