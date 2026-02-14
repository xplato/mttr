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

// ---- Model types (matching models/*.json structure) ----

export interface ModelField {
  address: number;
  size: number;
  name: string;
  access: "R" | "RW";
  default: number | null;
  range: [number, number] | null;
  unit: string | null;
  description: string;
  value_map?: Record<string, string | number>;
  bit_fields?: Record<string, { name: string; values: Record<string, string> }>;
  unit_map?: Record<string, string>;
  range_ref?: {
    min: { address: number; name: string };
    max: { address: number; name: string };
  };
}

export interface ModelArea {
  name: string;
  start_address: number;
  end_address: number;
  volatile: boolean;
  fields: ModelField[];
}

export interface ServoModel {
  model_number: number;
  model_name: string;
  protocol_versions: number[];
  resolution: number;
  eeprom_lock: {
    description: string;
    lock_address: number;
    lock_value: number;
  };
  areas: ModelArea[];
}

// ---- Control table write ----

export async function writeAddress(
  servoId: number,
  address: number,
  size: number,
  value: number,
): Promise<void> {
  return invoke<void>("write_address", {
    servoId,
    address,
    size,
    value,
  });
}

// ---- Control table read ----

export type ReadEvent =
  | { event: "value"; data: { address: number; value: number } }
  | { event: "error"; data: { address: number; message: string } }
  | { event: "finished" };

export async function readControlTable(
  servoId: number,
  fields: [number, number][],
  onEvent: (event: ReadEvent) => void,
): Promise<void> {
  const channel = new Channel<ReadEvent>();
  channel.onmessage = onEvent;

  return invoke<void>("read_control_table", {
    servoId,
    fields,
    onEvent: channel,
  });
}
