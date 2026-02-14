use std::sync::atomic::Ordering;

use tauri::ipc::Channel;
use tauri::State;

use crate::serial;
use crate::servo::{self, ConnectionState, ReadEvent, ScanEvent, ScanState};

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
    conn_state: State<'_, ConnectionState>,
    on_event: Channel<ScanEvent>,
) -> Result<(), String> {
    // Close any existing connection before scanning (scan opens its own temporary bus)
    servo::close_connection(&conn_state)?;

    // Reset cancellation flag before starting
    state.cancel.store(false, Ordering::Relaxed);
    let cancel = state.cancel.clone();

    let port_clone = port.clone();
    let protocol_clone = protocol.clone();

    // Run the blocking scan on a dedicated thread so we don't block the async runtime
    let result = tokio::task::spawn_blocking(move || {
        servo::scan_servos(
            &port_clone,
            &protocol_clone,
            baudrate,
            id_start,
            id_end,
            cancel,
            &on_event,
        )
    })
    .await
    .map_err(|e| format!("Scan task panicked: {}", e))?;

    result?;

    // Open a persistent connection with the same settings used for the scan
    servo::open_connection(&port, &protocol, baudrate, &conn_state)?;

    Ok(())
}

#[tauri::command]
pub fn cancel_scan(state: State<'_, ScanState>) {
    state.cancel.store(true, Ordering::Relaxed);
}

#[tauri::command]
pub fn disconnect(conn_state: State<'_, ConnectionState>) -> Result<(), String> {
    servo::close_connection(&conn_state)
}

#[tauri::command]
pub fn read_control_table(
    servo_id: u8,
    fields: Vec<(u16, u16)>,
    conn_state: State<'_, ConnectionState>,
    on_event: Channel<ReadEvent>,
) -> Result<(), String> {
    servo::read_control_table(servo_id, &fields, &conn_state, &on_event)
}
