use glob::glob;

/// Returns a list of available serial port paths, detected via platform-aware glob patterns.
pub fn list_serial_ports() -> Vec<String> {
    let patterns = if cfg!(target_os = "macos") {
        vec![
            "/dev/tty.usbserial*",
            "/dev/cu.usbserial*",
            "/dev/tty.usbmodem*",
            "/dev/cu.usbmodem*",
        ]
    } else if cfg!(target_os = "linux") {
        vec!["/dev/ttyUSB*", "/dev/ttyACM*"]
    } else {
        vec![]
    };

    let mut ports: Vec<String> = Vec::new();
    for pattern in patterns {
        if let Ok(entries) = glob(pattern) {
            for entry in entries.flatten() {
                if let Some(path) = entry.to_str() {
                    ports.push(path.to_string());
                }
            }
        }
    }
    ports.sort();
    ports.dedup();
    ports
}
