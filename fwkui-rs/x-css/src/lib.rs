use std::sync::{Arc, Mutex, MutexGuard};

pub use fwkui_x_core::{
    bp, default_breakpoints, escape_css_identifier, parse_class_name, stable_class_name,
    to_declarations, Breakpoint, CssRule, ParsedClass, XCoreConfig, XCoreRegistry,
};

#[cfg(all(target_arch = "wasm32", feature = "dom"))]
use wasm_bindgen::{JsCast, JsValue};

#[derive(Debug, Clone)]
pub struct XCss {
    registry: Arc<Mutex<XCoreRegistry>>,
}

impl Default for XCss {
    fn default() -> Self {
        Self::new()
    }
}

impl XCss {
    pub fn new() -> Self {
        Self::with_config(XCoreConfig::default())
    }

    pub fn raw() -> Self {
        let mut config = XCoreConfig::default();
        config.hash_class_name = false;
        Self::with_config(config)
    }

    pub fn with_config(config: XCoreConfig) -> Self {
        Self {
            registry: Arc::new(Mutex::new(XCoreRegistry::new(config))),
        }
    }

    pub fn clsx(&self, input: impl AsRef<str>) -> String {
        self.registry
            .lock()
            .expect("fwkui x-css registry lock poisoned")
            .clsx(input)
    }

    pub fn c(&self, input: impl AsRef<str>) -> String {
        self.clsx(input)
    }

    pub fn css_text(&self) -> String {
        self.registry
            .lock()
            .expect("fwkui x-css registry lock poisoned")
            .css_text()
    }

    pub fn style(&self) -> String {
        self.css_text()
    }

    pub fn registry(&self) -> MutexGuard<'_, XCoreRegistry> {
        self.registry
            .lock()
            .expect("fwkui x-css registry lock poisoned")
    }

    pub fn registry_mut(&self) -> MutexGuard<'_, XCoreRegistry> {
        self.registry
            .lock()
            .expect("fwkui x-css registry lock poisoned")
    }

    #[cfg(all(target_arch = "wasm32", feature = "dom"))]
    pub fn observe_document(&self) -> Result<(), JsValue> {
        self.observe_document_with_style_id("fwkui-xcss")
    }

    #[cfg(all(target_arch = "wasm32", feature = "dom"))]
    pub fn observe_document_with_style_id(&self, style_id: &str) -> Result<(), JsValue> {
        let document = web_sys::window()
            .and_then(|window| window.document())
            .ok_or_else(|| JsValue::from_str("document is not available"))?;

        self.collect_document_classes(&document)?;
        self.upsert_document_style(&document, style_id)
    }

    #[cfg(all(target_arch = "wasm32", feature = "dom"))]
    fn collect_document_classes(&self, document: &web_sys::Document) -> Result<(), JsValue> {
        let nodes = document.query_selector_all("[class]")?;

        for index in 0..nodes.length() {
            let Some(node) = nodes.item(index) else {
                continue;
            };
            let Some(element) = node.dyn_ref::<web_sys::Element>() else {
                continue;
            };

            self.clsx(element.class_name());
        }

        Ok(())
    }

    #[cfg(all(target_arch = "wasm32", feature = "dom"))]
    fn upsert_document_style(
        &self,
        document: &web_sys::Document,
        style_id: &str,
    ) -> Result<(), JsValue> {
        let style = match document.get_element_by_id(style_id) {
            Some(style) => style,
            None => {
                let style = document.create_element("style")?;
                style.set_id(style_id);
                let parent: web_sys::Node = document
                    .head()
                    .map(Into::into)
                    .or_else(|| document.body().map(Into::into))
                    .ok_or_else(|| JsValue::from_str("document head/body is not available"))?;
                parent.append_child(&style)?;
                style
            }
        };

        style.set_text_content(Some(&self.css_text()));
        Ok(())
    }
}

pub fn create() -> XCss {
    XCss::new()
}

pub fn clsx(input: impl AsRef<str>) -> String {
    let xcss = XCss::new();
    xcss.clsx(input)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn facade_reexports_core_runtime() {
        let xcss = XCss::new();
        let class_name = xcss.clsx("dF aiC");

        assert_eq!(class_name.split_whitespace().count(), 2);
        assert!(xcss.css_text().contains("display:flex"));
        assert!(xcss.css_text().contains("align-items:center"));
    }

    #[test]
    fn raw_constructor_keeps_source_classes() {
        let xcss = XCss::raw();
        let class_name = xcss.c("dF aiC p10px");

        assert_eq!(class_name, "dF aiC p10px");
        assert!(xcss.style().contains(".dF{display:flex}"));
        assert!(!xcss.style().contains(".D"));
    }
}
