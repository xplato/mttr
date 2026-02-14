mod commands;
mod serial;
mod servo;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(servo::ScanState::default())
        .manage(servo::ConnectionState::default())
        .invoke_handler(tauri::generate_handler![
            commands::list_ports,
            commands::scan_servos,
            commands::cancel_scan,
            commands::disconnect,
            commands::write_address,
            commands::read_control_table,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
