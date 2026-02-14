use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
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
