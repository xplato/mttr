use crate::serial;
use crate::servo::{self, ServoInfo};

#[tauri::command]
pub fn list_ports() -> Vec<String> {
    serial::list_serial_ports()
}

#[tauri::command]
pub fn scan_servos(
    port: String,
    protocol: String,
    baudrate: u32,
    id_start: u8,
    id_end: u8,
) -> Result<Vec<ServoInfo>, String> {
    servo::scan_servos(&port, &protocol, baudrate, id_start, id_end)
}
