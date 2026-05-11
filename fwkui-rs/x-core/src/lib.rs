use std::collections::BTreeMap;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParsedClass {
    pub mq: String,
    pub layer: String,
    pub prop: String,
    pub val: String,
    pub selector: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CssRule {
    pub class_name: String,
    pub media: String,
    pub layer: u8,
    pub selector: String,
    pub declarations: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Breakpoint {
    pub key: String,
    pub query: String,
}

#[derive(Debug, Clone)]
pub struct XCoreConfig {
    pub breakpoints: Vec<Breakpoint>,
    pub prefix: Option<String>,
    pub hash_class_name: bool,
}

impl Default for XCoreConfig {
    fn default() -> Self {
        Self {
            breakpoints: default_breakpoints(),
            prefix: None,
            hash_class_name: true,
        }
    }
}

#[derive(Debug, Clone)]
pub struct XCoreRegistry {
    config: XCoreConfig,
    rules: BTreeMap<String, CssRule>,
}

impl Default for XCoreRegistry {
    fn default() -> Self {
        Self::new(XCoreConfig::default())
    }
}

impl XCoreRegistry {
    pub fn new(config: XCoreConfig) -> Self {
        Self {
            config,
            rules: BTreeMap::new(),
        }
    }

    pub fn clsx(&mut self, input: impl AsRef<str>) -> String {
        input
            .as_ref()
            .split_whitespace()
            .map(|token| self.register_token(token))
            .collect::<Vec<_>>()
            .join(" ")
    }

    pub fn register_token(&mut self, token: &str) -> String {
        let parse_target = match self.strip_prefix(token) {
            Some(value) => value,
            None => return token.to_string(),
        };

        let Some(parsed) = parse_class_name(parse_target) else {
            return token.to_string();
        };

        if parsed.prop.starts_with('[') {
            return token.to_string();
        }

        let Some(media_query) = self.resolve_media(&parsed.mq) else {
            return token.to_string();
        };

        let Some(declarations) = to_declarations(&parsed.prop, &parsed.val) else {
            return token.to_string();
        };

        let class_name = if self.config.hash_class_name {
            stable_class_name(parse_target)
        } else {
            escape_css_identifier(token)
        };
        let output_class_name = if self.config.hash_class_name {
            class_name.clone()
        } else {
            token.to_string()
        };

        self.rules.entry(class_name.clone()).or_insert(CssRule {
            class_name: class_name.clone(),
            media: media_query,
            layer: parsed.layer.parse::<u8>().unwrap_or(0),
            selector: parsed.selector,
            declarations,
        });

        output_class_name
    }

    pub fn css_text(&self) -> String {
        let mut direct = Vec::new();
        let mut by_media: BTreeMap<&str, Vec<&CssRule>> = BTreeMap::new();

        for rule in self.rules.values() {
            if rule.media.is_empty() {
                direct.push(rule);
            } else {
                by_media.entry(&rule.media).or_default().push(rule);
            }
        }

        direct.sort_by_key(|rule| rule.layer);
        let mut output = direct
            .iter()
            .map(|rule| rule_to_css(rule))
            .collect::<Vec<_>>();

        for (media, mut rules) in by_media {
            rules.sort_by_key(|rule| rule.layer);
            let body = rules
                .iter()
                .map(|rule| rule_to_css(rule))
                .collect::<Vec<_>>()
                .join("");
            output.push(format!("@media {media}{{{body}}}"));
        }

        output.join("")
    }

    pub fn rules(&self) -> impl Iterator<Item = &CssRule> {
        self.rules.values()
    }

    fn strip_prefix<'a>(&self, token: &'a str) -> Option<&'a str> {
        match &self.config.prefix {
            Some(prefix) => token.strip_prefix(prefix),
            None => Some(token),
        }
    }

    fn resolve_media(&self, key: &str) -> Option<String> {
        if key.is_empty() {
            return Some(String::new());
        }

        self.config
            .breakpoints
            .iter()
            .rev()
            .find(|item| item.key == key)
            .map(|item| item.query.clone())
    }
}

pub fn default_breakpoints() -> Vec<Breakpoint> {
    vec![
        bp("xs", "screen and (max-width: 575px)"),
        bp("sm", "screen and (min-width: 576px)"),
        bp("md", "screen and (min-width: 768px)"),
        bp("lg", "screen and (min-width: 992px)"),
        bp("xl", "screen and (min-width: 1200px)"),
        bp("2xl", "screen and (min-width: 1400px)"),
        bp("sma", "screen and (max-width: 768px)"),
        bp("mda", "screen and (max-width: 992px)"),
        bp("lga", "screen and (max-width: 1200px)"),
        bp("xla", "screen and (max-width: 1400px)"),
    ]
}

pub fn bp(key: &str, query: &str) -> Breakpoint {
    Breakpoint {
        key: key.to_string(),
        query: query.to_string(),
    }
}

pub fn parse_class_name(class_name: &str) -> Option<ParsedClass> {
    if class_name.len() < 2 || !has_balanced_square_brackets(class_name, 0, class_name.len()) {
        return None;
    }

    let mut start = 0;
    let mut end = class_name.len();

    let mut selector = String::new();
    if let Some(at_index) = find_last_at_outside_brackets(class_name, start, end) {
        if at_index > start {
            selector = class_name[at_index + 1..end].to_string();
            end = at_index;
        }
    }

    let mut mq = String::new();
    if let Some(colon_index) = find_first_colon_outside_brackets(class_name, start, end) {
        if colon_index > 0 && colon_index < end {
            mq = class_name[start..colon_index].to_string();
            start = colon_index + 1;
        }
    }

    let digit_end = scan_while(class_name, start, end, |byte| byte.is_ascii_digit());
    let layer = if digit_end > start {
        let value = class_name[start..digit_end].to_string();
        start = digit_end;
        value
    } else {
        String::new()
    };

    if start >= end || class_name.as_bytes()[start] == b'&' {
        return None;
    }

    if class_name.as_bytes()[start] == b'[' {
        if let Some(close_index) = class_name[start..end].find(']') {
            let close_index = start + close_index;
            if close_index > start {
                return Some(ParsedClass {
                    mq,
                    layer,
                    prop: class_name[start..=close_index].to_string(),
                    val: String::new(),
                    selector,
                });
            }
        }
    }

    let mut prop_end = start;
    while prop_end < end {
        let byte = class_name.as_bytes()[prop_end];
        if byte == b'-' || byte == b'.' {
            if prop_end + 1 < end {
                let next = class_name.as_bytes()[prop_end + 1];
                if byte == b'-' && next == b'-' && prop_end > start {
                    break;
                }
                if next.is_ascii_digit() {
                    break;
                }
            }
            prop_end += 1;
            continue;
        }

        if !byte.is_ascii_lowercase() {
            break;
        }
        prop_end += 1;
    }

    if prop_end == start {
        return None;
    }

    Some(ParsedClass {
        mq,
        layer,
        prop: class_name[start..prop_end].to_string(),
        val: class_name[prop_end..end].to_string(),
        selector,
    })
}

pub fn to_declarations(prop: &str, value: &str) -> Option<String> {
    let property_name = property_name(prop);
    let value = normalize_value(prop, value)?;

    let declarations = match property_name {
        "mx" => vec![
            format!("margin-left:{value}"),
            format!("margin-right:{value}"),
        ],
        "my" => vec![
            format!("margin-top:{value}"),
            format!("margin-bottom:{value}"),
        ],
        "px" => vec![
            format!("padding-left:{value}"),
            format!("padding-right:{value}"),
        ],
        "py" => vec![
            format!("padding-top:{value}"),
            format!("padding-bottom:{value}"),
        ],
        "bdx" => vec![
            format!("border-left:{value}"),
            format!("border-right:{value}"),
        ],
        "bdy" => vec![
            format!("border-top:{value}"),
            format!("border-bottom:{value}"),
        ],
        other => vec![format!("{other}:{value}")],
    };

    Some(declarations.join(";"))
}

pub fn stable_class_name(input: &str) -> String {
    let mut hash = 0xcbf29ce484222325u64;
    for byte in input.as_bytes() {
        hash ^= u64::from(*byte);
        hash = hash.wrapping_mul(0x100000001b3);
    }

    format!("D{}", to_base36(hash))
}

pub fn escape_css_identifier(input: &str) -> String {
    let mut output = String::new();
    for ch in input.chars() {
        if ch.is_ascii_alphanumeric() || ch == '_' || ch == '-' {
            output.push(ch);
        } else {
            output.push('\\');
            output.push(ch);
        }
    }
    output
}

fn normalize_value(prop: &str, value: &str) -> Option<String> {
    let mut important = false;
    let mut value = value;

    if let Some(rest) = value.strip_prefix('!') {
        important = true;
        value = rest;
    }

    let mut normalized = if value.starts_with("--") {
        format!("var({value})")
    } else if value.starts_with('[') && value.ends_with(']') {
        value[1..value.len() - 1].to_string()
    } else if value.is_empty() {
        shorthand_empty_value(prop)?
    } else {
        let lookup_key = lowercase_first(value);
        specific_value(prop, &lookup_key)
            .or_else(|| specific_value(prop, &value.to_ascii_lowercase()))
            .or_else(|| common_value(&lookup_key))
            .or_else(|| common_value(&value.to_ascii_lowercase()))
            .unwrap_or_else(|| value.to_string())
    };

    normalized = normalized.replace("';", ";").replace(';', " ");
    if normalized.is_empty() {
        return None;
    }

    if important {
        normalized.push_str(" !important");
    }

    Some(normalized)
}

fn property_name(prop: &str) -> &str {
    match prop {
        "a" => "all",
        "ai" => "align-items",
        "as" => "align-self",
        "b" => "bottom",
        "bd" => "border",
        "bda" | "bdra" => "border-radius",
        "bdc" => "border-color",
        "bds" => "border-style",
        "bdw" => "border-width",
        "bg" => "background",
        "bgc" => "background-color",
        "bgi" => "background-image",
        "bgp" => "background-position",
        "bgs" => "background-size",
        "bxsh" | "bxshd" => "box-shadow",
        "c" => "color",
        "cr" => "cursor",
        "d" => "display",
        "ff" => "font-family",
        "fxd" => "flex-direction",
        "fs" => "font-size",
        "fw" => "font-weight",
        "g" => "gap",
        "h" => "height",
        "jc" => "justify-content",
        "ji" => "justify-items",
        "js" => "justify-self",
        "l" => "left",
        "lh" => "line-height",
        "m" => "margin",
        "mb" => "margin-bottom",
        "ml" => "margin-left",
        "mr" => "margin-right",
        "mt" => "margin-top",
        "opc" => "opacity",
        "ov" => "overflow",
        "ovx" => "overflow-x",
        "ovy" => "overflow-y",
        "p" => "padding",
        "pb" => "padding-bottom",
        "pl" => "padding-left",
        "pos" => "position",
        "pr" => "padding-right",
        "pt" => "padding-top",
        "r" => "right",
        "ta" => "text-align",
        "td" => "text-decoration",
        "t" => "top",
        "tran" => "transition",
        "w" => "width",
        "z" => "z-index",
        other => other,
    }
}

fn shorthand_empty_value(prop: &str) -> Option<String> {
    match prop {
        "flex" => Some("flex".to_string()),
        "block" => Some("block".to_string()),
        "hidden" => Some("hidden".to_string()),
        _ => None,
    }
}

fn common_value(key: &str) -> Option<String> {
    let value = match key {
        "in" => "inherit",
        "ini" => "initial",
        "un" => "unset",
        "rv" => "revert",
        "n" => "none",
        "a" => "auto",
        "t" => "top",
        "b" => "bottom",
        "l" => "left",
        "r" => "right",
        "c" => "center",
        "m" => "middle",
        "j" => "justify",
        "s" => "start",
        "e" => "end",
        "tr" => "transparent",
        "cc" => "currentColor",
        "minc" => "min-content",
        "maxc" => "max-content",
        "fitc" => "fit-content",
        "sol" => "solid",
        "das" => "dashed",
        "dot" => "dotted",
        "dub" => "double",
        "vis" => "visible",
        "h" => "hidden",
        "col" => "collapse",
        _ => return None,
    };
    Some(value.to_string())
}

fn specific_value(prop: &str, key: &str) -> Option<String> {
    let value = match prop {
        "d" => match key {
            "b" => "block",
            "f" => "flex",
            "g" => "grid",
            "i" => "inline",
            "ib" => "inline-block",
            "if" => "inline-flex",
            "ig" => "inline-grid",
            "n" => "none",
            _ => return None,
        },
        "ai" | "as" => match key {
            "n" => "normal",
            "c" => "center",
            "s" => "start",
            "e" => "end",
            "fs" => "flex-start",
            "fe" => "flex-end",
            "b" => "baseline",
            "st" => "stretch",
            _ => return None,
        },
        "jc" | "ji" | "js" => match key {
            "c" => "center",
            "s" => "start",
            "e" => "end",
            "fs" => "flex-start",
            "fe" => "flex-end",
            "sp" => "space-between",
            "sa" => "space-around",
            "se" => "space-evenly",
            "st" => "stretch",
            _ => return None,
        },
        "pos" => match key {
            "a" => "absolute",
            "r" => "relative",
            "f" => "fixed",
            "s" => "static",
            "st" => "sticky",
            _ => return None,
        },
        "bd" | "bds" => match key {
            "d" => "dotted",
            "ds" => "dashed",
            "s" => "solid",
            "db" => "double",
            "n" => "none",
            _ => return None,
        },
        "fw" => match key {
            "n" => "normal",
            "b" => "bold",
            "l" => "lighter",
            "br" => "bolder",
            _ => return None,
        },
        "ta" => match key {
            "l" => "left",
            "r" => "right",
            "c" => "center",
            "j" => "justify",
            _ => return None,
        },
        "cr" => match key {
            "p" => "pointer",
            "d" => "default",
            "t" => "text",
            "na" => "not-allowed",
            _ => return None,
        },
        "fxd" => match key {
            "r" => "row",
            "rr" => "row-reverse",
            "c" => "column",
            "cr" => "column-reverse",
            _ => return None,
        },
        _ => return None,
    };

    Some(value.to_string())
}

fn rule_to_css(rule: &CssRule) -> String {
    format!(
        ".{}{}{{{}}}",
        rule.class_name, rule.selector, rule.declarations
    )
}

fn find_first_colon_outside_brackets(input: &str, start: usize, end: usize) -> Option<usize> {
    let mut bracket_depth = 0usize;
    for index in start..end {
        match input.as_bytes()[index] {
            b'[' => bracket_depth += 1,
            b']' => bracket_depth = bracket_depth.saturating_sub(1),
            b':' if bracket_depth == 0 => return Some(index),
            _ => {}
        }
    }
    None
}

fn find_last_at_outside_brackets(input: &str, start: usize, end: usize) -> Option<usize> {
    let mut bracket_depth = 0usize;
    for index in (start..end).rev() {
        match input.as_bytes()[index] {
            b']' => bracket_depth += 1,
            b'[' => bracket_depth = bracket_depth.saturating_sub(1),
            b'@' if bracket_depth == 0 => return Some(index),
            _ => {}
        }
    }
    None
}

fn has_balanced_square_brackets(input: &str, start: usize, end: usize) -> bool {
    let mut bracket_depth = 0usize;
    for index in start..end {
        match input.as_bytes()[index] {
            b'[' => bracket_depth += 1,
            b']' => {
                if bracket_depth == 0 {
                    return false;
                }
                bracket_depth -= 1;
            }
            _ => {}
        }
    }
    bracket_depth == 0
}

fn scan_while(input: &str, mut start: usize, end: usize, predicate: impl Fn(u8) -> bool) -> usize {
    while start < end && predicate(input.as_bytes()[start]) {
        start += 1;
    }
    start
}

fn lowercase_first(input: &str) -> String {
    let mut chars = input.chars();
    let Some(first) = chars.next() else {
        return String::new();
    };
    first.to_lowercase().collect::<String>() + chars.as_str()
}

fn to_base36(mut value: u64) -> String {
    const DIGITS: &[u8; 36] = b"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if value == 0 {
        return "0".to_string();
    }

    let mut out = Vec::new();
    while value > 0 {
        out.push(DIGITS[(value % 36) as usize] as char);
        value /= 36;
    }
    out.iter().rev().collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_current_contract_vectors() {
        assert_eq!(
            parse_class_name("sm:3bgWhite"),
            Some(ParsedClass {
                mq: "sm".into(),
                layer: "3".into(),
                prop: "bg".into(),
                val: "White".into(),
                selector: "".into(),
            })
        );
        assert_eq!(
            parse_class_name("w[calc(100%;-;10px)]").unwrap().val,
            "[calc(100%;-;10px)]"
        );
        assert!(parse_class_name("&span").is_none());
        assert!(parse_class_name("w[calc(100%;-;10px)").is_none());
    }

    #[test]
    fn resolves_declarations() {
        assert_eq!(to_declarations("m", "10px").as_deref(), Some("margin:10px"));
        assert_eq!(to_declarations("d", "F").as_deref(), Some("display:flex"));
        assert_eq!(
            to_declarations("fxd", "C").as_deref(),
            Some("flex-direction:column")
        );
        assert_eq!(
            to_declarations("bgc", "--brand").as_deref(),
            Some("background-color:var(--brand)")
        );
        assert_eq!(
            to_declarations("c", "!#0a64e8").as_deref(),
            Some("color:#0a64e8 !important")
        );
        assert_eq!(
            to_declarations("w", "[calc(100%;-;10px)]").as_deref(),
            Some("width:calc(100% - 10px)")
        );
    }

    #[test]
    fn registry_returns_stable_classes_and_css() {
        let mut registry = XCoreRegistry::default();
        let classes = registry.clsx("dF aiC jcC p10px;16px bgc#0a64e8 cWhite");
        assert_eq!(classes.split_whitespace().count(), 6);

        let css = registry.css_text();
        assert!(css.contains("display:flex"));
        assert!(css.contains("align-items:center"));
        assert!(css.contains("justify-content:center"));
        assert!(css.contains("padding:10px 16px"));
        assert!(css.contains("background-color:#0a64e8"));
        assert!(css.contains("color:White"));
    }

    #[test]
    fn registry_respects_media_and_prefix() {
        let mut config = XCoreConfig::default();
        config.prefix = Some("fk-".into());
        config
            .breakpoints
            .push(bp("tablet", "screen and (min-width: 900px)"));

        let mut registry = XCoreRegistry::new(config);
        assert_eq!(registry.register_token("m10px"), "m10px");
        assert_ne!(
            registry.register_token("fk-tablet:m10px"),
            "fk-tablet:m10px"
        );
        assert_eq!(registry.register_token("fk-phone:m10px"), "fk-phone:m10px");
        assert!(registry
            .css_text()
            .contains("@media screen and (min-width: 900px)"));
    }

    #[test]
    fn registry_can_preserve_raw_class_names() {
        let mut config = XCoreConfig::default();
        config.hash_class_name = false;
        config
            .breakpoints
            .push(bp("tablet", "screen and (min-width: 900px)"));

        let mut registry = XCoreRegistry::new(config);
        assert_eq!(
            registry.clsx("m10px dF@:hover tablet:p8px"),
            "m10px dF@:hover tablet:p8px"
        );

        let css = registry.css_text();
        assert!(css.contains(".m10px{margin:10px}"));
        assert!(css.contains(".dF\\@\\:hover:hover{display:flex}"));
        assert!(css.contains("@media screen and (min-width: 900px)"));
        assert!(css.contains(".tablet\\:p8px{padding:8px}"));
        assert!(!css.contains(".D"));
    }
}
