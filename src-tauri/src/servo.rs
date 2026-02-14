use serde::{Deserialize, Serialize};
use std::time::Duration;

/// Information about a discovered servo.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServoInfo {
    pub id: u8,
    pub model_number: u16,
}

/// Scans for servos on the given serial port using Protocol 2.0.
pub fn scan_v2(
    port: &str,
    baudrate: u32,
    id_start: u8,
    id_end: u8,
) -> Result<Vec<ServoInfo>, String> {
    let mut bus = dynamixel_sdk::v2::new(port, baudrate)
        .timeout(Duration::from_millis(50))
        .connect()
        .map_err(|e| format!("Failed to open port {}: {}", port, e))?;

    let mut results = Vec::new();
    for id in id_start..=id_end {
        match bus.ping(id) {
            Ok(motors) => {
                for (motor_id, info) in motors {
                    results.push(ServoInfo {
                        id: motor_id,
                        model_number: info.model_number(),
                    });
                }
            }
            Err(_) => {
                // No servo at this ID, continue scanning
            }
        }
    }
    Ok(results)
}

/// Scans for servos on the given serial port using Protocol 1.0.
pub fn scan_v1(
    port: &str,
    baudrate: u32,
    id_start: u8,
    id_end: u8,
) -> Result<Vec<ServoInfo>, String> {
    let mut bus = dynamixel_sdk::v1::new(port, baudrate)
        .timeout(Duration::from_millis(50))
        .connect()
        .map_err(|e| format!("Failed to open port {}: {}", port, e))?;

    let mut results = Vec::new();
    for id in id_start..=id_end {
        match bus.ping(id) {
            Ok(ids) => {
                for motor_id in ids {
                    results.push(ServoInfo {
                        id: motor_id,
                        model_number: 0, // v1 ping doesn't return model number
                    });
                }
            }
            Err(_) => {
                // No servo at this ID, continue scanning
            }
        }
    }
    Ok(results)
}

/// Scan for servos, dispatching to the correct protocol.
pub fn scan_servos(
    port: &str,
    protocol: &str,
    baudrate: u32,
    id_start: u8,
    id_end: u8,
) -> Result<Vec<ServoInfo>, String> {
    match protocol {
        "2.0" => scan_v2(port, baudrate, id_start, id_end),
        "1.0" => scan_v1(port, baudrate, id_start, id_end),
        _ => Err(format!("Unsupported protocol: {}", protocol)),
    }
}
