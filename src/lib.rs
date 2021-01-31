mod utils;

use wasm_bindgen::{prelude::*,
    JsCast};

use wasm_bindgen_futures::JsFuture;

use web_sys::{
    Document,
    HtmlElement,
    MediaDeviceInfo,
    MediaStreamConstraints,
    Navigator,
    Window};

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn init(s: &str) {
    log!("{}{}", "Init log: ", s);
}

pub fn get_window() -> Window {
    let window = web_sys::window().expect("Did not have a global window object");
    window
}

pub fn get_document() -> Document {
    let window = get_window();
    window
        .document()
        .expect("window should have a document object")
}

pub fn get_body() -> HtmlElement {
    let doc = get_document();
    let body = doc.body().expect("document must have a body");
    body
}

/// Returns a Navigator object
pub fn get_navigator() -> Navigator {
    let window = get_window();
    let nav = window.navigator();
    nav
}

#[wasm_bindgen]
pub async fn list_media_devices() -> Result<js_sys::Array, JsValue> {
    let media_devs = get_navigator().media_devices()?;

    let constraints = &mut MediaStreamConstraints::new();
    constraints.video(&JsValue::from(true));
    constraints.audio(&JsValue::from(true));
  
    // will request and wait for camera and audio 
    let _a = media_devs.get_user_media_with_constraints(constraints)?; 

    let devices = js_sys::Array::new();
    match media_devs.enumerate_devices() {
        Ok(devs) => {

            let media_device_info = JsFuture::from(devs).await?;

            let iterator = js_sys::try_iter(&media_device_info)?
                .ok_or_else(|| {
                    log!("{}", "Could not convert to iterator" );
                })
                .expect("Unable to convert to array");

            for device in iterator {
                let device = device?;
                let device_info = device.dyn_into::<MediaDeviceInfo>()?;

                let _stringified =
                    js_sys::JSON::stringify(&device_info.to_json()).unwrap_or("".into());

                log!("{:#?}", device_info.device_id());
                devices.push(&device_info);
            }

            Ok(devices)
        }
        Err(e) => Err(e),
    }
}