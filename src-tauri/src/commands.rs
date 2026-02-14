use std::sync::atomic::Ordering;

use tauri::ipc::Channel;
use tauri::State;

use crate::serial;
use crate::servo::{self, ScanEvent, ScanState};

#[tauri::command]
pub fn list_ports() -> Vec<String> {
    serial::list_serial_ports()
}

#[tauri::command]
pub async fn scan_servos(
    port: String,
    protocol: String,
    baudrate: u32,
    id_start: u8,
    id_end: u8,
    state: State<'_, ScanState>,
    on_event: Channel<ScanEvent>,
) -> Result<(), String> {
    // Reset cancellation flag before starting
    state.cancel.store(false, Ordering::Relaxed);
    let cancel = state.cancel.clone();

    // Run the blocking scan on a dedicated thread so we don't block the async runtime
    let result = tokio::task::spawn_blocking(move || {
        servo::scan_servos(
            &port, &protocol, baudrate, id_start, id_end, cancel, &on_event,
        )
    })
    .await
    .map_err(|e| format!("Scan task panicked: {}", e))?;

    result
}

#[tauri::command]
pub fn cancel_scan(state: State<'_, ScanState>) {
    state.cancel.store(true, Ordering::Relaxed);
}
