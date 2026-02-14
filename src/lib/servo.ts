import { invoke } from "@tauri-apps/api/core";

export interface ServoInfo {
  id: number;
  model_number: number;
}

export async function listPorts(): Promise<string[]> {
  return invoke<string[]>("list_ports");
}

export async function scanServos(
  port: string,
  protocol: string,
  baudrate: number,
  idStart: number,
  idEnd: number,
): Promise<ServoInfo[]> {
  return invoke<ServoInfo[]>("scan_servos", {
    port,
    protocol,
    baudrate,
    idStart,
    idEnd,
  });
}
