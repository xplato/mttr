use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::ipc::Channel;

/// Information about a discovered servo.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServoInfo {
    pub id: u8,
    pub model_number: u16,
}

/// Events streamed to the frontend during a scan.
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
pub enum ScanEvent {
    /// A servo was found at the given ID.
    Found(ServoInfo),
    /// Progress update: which ID is currently being scanned.
    Progress { current: u8, total: u16 },
    /// Scan completed (all IDs checked or cancelled).
    Finished { cancelled: bool },
}

/// Shared cancellation flag for the active scan.
#[derive(Default)]
pub struct ScanState {
    pub cancel: Arc<AtomicBool>,
}

/// An open connection to the serial bus (either protocol version).
/// The Bus is held to keep the serial port open; fields will be used for read/write commands.
#[allow(dead_code)]
pub enum BusConnection {
    V1(dynamixel_sdk::v1::Bus),
    V2(dynamixel_sdk::v2::Bus),
}

/// Managed state for the active serial connection.
#[derive(Default)]
pub struct ConnectionState {
    pub bus: Mutex<Option<BusConnection>>,
}

/// Opens a persistent connection to the serial port.
pub fn open_connection(
    port: &str,
    protocol: &str,
    baudrate: u32,
    state: &ConnectionState,
) -> Result<(), String> {
    let bus = match protocol {
        "2.0" => {
            let b = dynamixel_sdk::v2::new(port, baudrate)
                .timeout(Duration::from_millis(100))
                .connect()
                .map_err(|e| format!("Failed to open port {}: {}", port, e))?;
            BusConnection::V2(b)
        }
        "1.0" => {
            let b = dynamixel_sdk::v1::new(port, baudrate)
                .timeout(Duration::from_millis(100))
                .connect()
                .map_err(|e| format!("Failed to open port {}: {}", port, e))?;
            BusConnection::V1(b)
        }
        _ => return Err(format!("Unsupported protocol: {}", protocol)),
    };

    let mut lock = state.bus.lock().map_err(|e| e.to_string())?;
    *lock = Some(bus);
    Ok(())
}

/// Closes the persistent connection, dropping the Bus and releasing the port.
pub fn close_connection(state: &ConnectionState) -> Result<(), String> {
    let mut lock = state.bus.lock().map_err(|e| e.to_string())?;
    *lock = None;
    Ok(())
}

/// Scans for servos, streaming results via a Tauri Channel.
/// Checks the cancellation flag between each ping.
pub fn scan_servos(
    port: &str,
    protocol: &str,
    baudrate: u32,
    id_start: u8,
    id_end: u8,
    cancel: Arc<AtomicBool>,
    on_event: &Channel<ScanEvent>,
) -> Result<(), String> {
    let total = (id_end as u16) - (id_start as u16) + 1;

    match protocol {
        "2.0" => {
            let mut bus = dynamixel_sdk::v2::new(port, baudrate)
                .timeout(Duration::from_millis(50))
                .connect()
                .map_err(|e| format!("Failed to open port {}: {}", port, e))?;

            for id in id_start..=id_end {
                if cancel.load(Ordering::Relaxed) {
                    let _ = on_event.send(ScanEvent::Finished { cancelled: true });
                    return Ok(());
                }

                let _ = on_event.send(ScanEvent::Progress { current: id, total });

                if let Ok(motors) = bus.ping(id) {
                    for (motor_id, info) in motors {
                        let _ = on_event.send(ScanEvent::Found(ServoInfo {
                            id: motor_id,
                            model_number: info.model_number(),
                        }));
                    }
                }
            }
        }
        "1.0" => {
            let mut bus = dynamixel_sdk::v1::new(port, baudrate)
                .timeout(Duration::from_millis(50))
                .connect()
                .map_err(|e| format!("Failed to open port {}: {}", port, e))?;

            for id in id_start..=id_end {
                if cancel.load(Ordering::Relaxed) {
                    let _ = on_event.send(ScanEvent::Finished { cancelled: true });
                    return Ok(());
                }

                let _ = on_event.send(ScanEvent::Progress { current: id, total });

                if let Ok(ids) = bus.ping(id) {
                    for motor_id in ids {
                        let _ = on_event.send(ScanEvent::Found(ServoInfo {
                            id: motor_id,
                            model_number: 0,
                        }));
                    }
                }
            }
        }
        _ => return Err(format!("Unsupported protocol: {}", protocol)),
    }

    let _ = on_event.send(ScanEvent::Finished { cancelled: false });
    Ok(())
}
