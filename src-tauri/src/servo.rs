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

/// Events streamed to the frontend during a control table read.
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
pub enum ReadEvent {
    /// Successfully read a value at the given address.
    Value { address: u16, value: i64 },
    /// Failed to read the given address.
    Error { address: u16, message: String },
    /// All requested addresses have been read.
    Finished,
}

/// An open connection to the serial bus (either protocol version).
/// The Bus is held to keep the serial port open; fields will be used for read/write commands.
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

/// Converts little-endian bytes to a signed i64.
/// 1-byte values are treated as unsigned (no signed 1-byte fields in Dynamixel).
/// 2-byte and 4-byte values are sign-extended to handle fields with negative ranges.
fn bytes_to_i64(bytes: &[u8]) -> i64 {
    match bytes.len() {
        1 => bytes[0] as i64,
        2 => i16::from_le_bytes([bytes[0], bytes[1]]) as i64,
        4 => i32::from_le_bytes([bytes[0], bytes[1], bytes[2], bytes[3]]) as i64,
        _ => {
            let mut val: i64 = 0;
            for (i, &b) in bytes.iter().enumerate() {
                val |= (b as i64) << (i * 8);
            }
            val
        }
    }
}

/// Reads a list of control table fields from a servo, streaming results via a Tauri Channel.
/// Each field is specified as (address, size_in_bytes).
/// Uses the persistent bus connection held in ConnectionState.
pub fn read_control_table(
    servo_id: u8,
    fields: &[(u16, u16)],
    state: &ConnectionState,
    on_event: &Channel<ReadEvent>,
) -> Result<(), String> {
    let mut lock = state.bus.lock().map_err(|e| e.to_string())?;
    let bus = lock.as_mut().ok_or("No active connection")?;

    for &(address, size) in fields {
        match bus {
            BusConnection::V2(ref mut b) => match b.read(servo_id, address, size) {
                Ok(bytes) => {
                    let _ = on_event.send(ReadEvent::Value {
                        address,
                        value: bytes_to_i64(&bytes),
                    });
                }
                Err(e) => {
                    let _ = on_event.send(ReadEvent::Error {
                        address,
                        message: format!("{:?}", e),
                    });
                }
            },
            BusConnection::V1(ref mut b) => match b.read(servo_id, address as u8, size as u8) {
                Ok(bytes) => {
                    let _ = on_event.send(ReadEvent::Value {
                        address,
                        value: bytes_to_i64(&bytes),
                    });
                }
                Err(e) => {
                    let _ = on_event.send(ReadEvent::Error {
                        address,
                        message: format!("{:?}", e),
                    });
                }
            },
        }
    }

    let _ = on_event.send(ReadEvent::Finished);
    Ok(())
}
