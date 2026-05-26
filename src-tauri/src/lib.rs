use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, State,
};
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};
use std::{thread, time::Duration};

struct InputSyncState {
    enabled: Arc<AtomicBool>,
}

#[tauri::command]
fn set_input_sync_enabled(enabled: bool, state: State<'_, InputSyncState>) {
    state.enabled.store(enabled, Ordering::Relaxed);
}

pub fn run() {
    let input_sync_enabled = Arc::new(AtomicBool::new(false));

    tauri::Builder::default()
        .manage(InputSyncState {
            enabled: input_sync_enabled.clone(),
        })
        .invoke_handler(tauri::generate_handler![set_input_sync_enabled])
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(move |app| {
            let show = MenuItem::with_id(app, "show", "显示宠物", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            TrayIconBuilder::new()
                .tooltip("小猫助手")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = window.eval("window.dispatchEvent(new CustomEvent('pet-show-from-tray'))");
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = window.eval("window.dispatchEvent(new CustomEvent('pet-show-from-tray'))");
                        }
                    }
                })
                .build(app)?;

            start_input_sync_listener(app.handle().clone(), input_sync_enabled.clone());

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(target_os = "windows")]
fn start_input_sync_listener(app: AppHandle, enabled: Arc<AtomicBool>) {
    thread::spawn(move || {
        let mut last_mouse = POINT { x: 0, y: 0 };
        let mut has_mouse = false;
        let mut keyboard_cooldown = 0u8;
        let mut mouse_cooldown = 0u8;

        loop {
            thread::sleep(Duration::from_millis(45));

            if !enabled.load(Ordering::Relaxed) {
                has_mouse = false;
                keyboard_cooldown = 0;
                mouse_cooldown = 0;
                continue;
            }

            keyboard_cooldown = keyboard_cooldown.saturating_sub(1);
            mouse_cooldown = mouse_cooldown.saturating_sub(1);

            if keyboard_cooldown == 0 && is_any_keyboard_key_down() {
                keyboard_cooldown = 8;
                let _ = app.emit("input-sync", "keyboard");
            }

            let mut point = POINT { x: 0, y: 0 };
            let got_cursor = unsafe { GetCursorPos(&mut point) } != 0;
            let mouse_moved = got_cursor && has_mouse && (point.x != last_mouse.x || point.y != last_mouse.y);
            let mouse_clicked = is_mouse_button_down();

            if got_cursor {
                last_mouse = point;
                has_mouse = true;
            }

            if mouse_cooldown == 0 && (mouse_moved || mouse_clicked) {
                mouse_cooldown = 10;
                let _ = app.emit("input-sync", "mouse");
            }
        }
    });
}

#[cfg(not(target_os = "windows"))]
fn start_input_sync_listener(_app: AppHandle, _enabled: Arc<AtomicBool>) {}

#[cfg(target_os = "windows")]
fn is_any_keyboard_key_down() -> bool {
    (0x08..=0xFE).any(|key| {
        if (0x01..=0x06).contains(&key) {
            return false;
        }

        unsafe { GetAsyncKeyState(key) < 0 }
    })
}

#[cfg(target_os = "windows")]
fn is_mouse_button_down() -> bool {
    (0x01..=0x06).any(|key| unsafe { GetAsyncKeyState(key) < 0 })
}

#[cfg(target_os = "windows")]
#[repr(C)]
#[derive(Clone, Copy)]
struct POINT {
    x: i32,
    y: i32,
}

#[cfg(target_os = "windows")]
#[link(name = "user32")]
extern "system" {
    fn GetAsyncKeyState(v_key: i32) -> i16;
    fn GetCursorPos(lp_point: *mut POINT) -> i32;
}
