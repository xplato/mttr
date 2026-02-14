import { Channel, invoke } from "@tauri-apps/api/core";

export interface ServoInfo {
  id: number;
  model_number: number;
}

/** The connection parameters used for a successful scan. */
export interface ConnectionConfig {
  port: string;
  protocol: string; // "1.0" | "2.0"
  baudrate: number;
}

export type ScanEvent =
  | { event: "found"; data: ServoInfo }
  | { event: "progress"; data: { current: number; total: number } }
  | { event: "finished"; data: { cancelled: boolean } };

export async function listPorts(): Promise<string[]> {
  return invoke<string[]>("list_ports");
}

export async function scanServos(
  port: string,
  protocol: string,
  baudrate: number,
  idStart: number,
  idEnd: number,
  onEvent: (event: ScanEvent) => void,
): Promise<void> {
  const channel = new Channel<ScanEvent>();
  channel.onmessage = onEvent;

  return invoke<void>("scan_servos", {
    port,
    protocol,
    baudrate,
    idStart,
    idEnd,
    onEvent: channel,
  });
}

export async function cancelScan(): Promise<void> {
  return invoke<void>("cancel_scan");
}

export async function disconnect(): Promise<void> {
  return invoke<void>("disconnect");
}
