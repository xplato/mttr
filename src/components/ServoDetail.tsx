import { useCallback, useEffect, useRef, useState } from "react";
import { getModel } from "@/lib/models";
import type { ConnectionConfig, ReadEvent, ServoInfo } from "@/lib/servo";
import { readControlTable } from "@/lib/servo";

import { ControlTableValue } from "./ControlTableValue";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface ServoDetailProps {
  servo: ServoInfo;
  config: ConnectionConfig;
}

interface FieldState {
  value: number | null;
  error: string | null;
}

export function ServoDetail({ servo, config }: ServoDetailProps) {
  const model = getModel(servo.model_number);
  const [fieldStates, setFieldStates] = useState<Record<number, FieldState>>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const readGeneration = useRef(0);

  const loadControlTable = useCallback(async () => {
    if (!model) return;

    const generation = ++readGeneration.current;
    setLoading(true);
    setFieldStates({});

    const fields: [number, number][] = model.areas.flatMap((area) =>
      area.fields.map((f) => [f.address, f.size] as [number, number]),
    );

    const handleEvent = (event: ReadEvent) => {
      if (readGeneration.current !== generation) return;

      switch (event.event) {
        case "value":
          setFieldStates((prev) => ({
            ...prev,
            [event.data.address]: { value: event.data.value, error: null },
          }));
          break;
        case "error":
          setFieldStates((prev) => ({
            ...prev,
            [event.data.address]: { value: null, error: event.data.message },
          }));
          break;
        case "finished":
          setLoading(false);
          break;
      }
    };

    try {
      await readControlTable(servo.id, fields, handleEvent);
    } catch (err) {
      if (readGeneration.current === generation) {
        setLoading(false);
      }
    }
  }, [servo.id, model]);

  useEffect(() => {
    loadControlTable();
  }, [loadControlTable]);

  if (!model) {
    return (
      <div className="flex h-full flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground text-sm">
          Unknown model {servo.model_number}. No control table data available.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="border-border shrink-0 border-b px-6 py-4">
        <h2 className="text-foreground text-xl leading-none font-semibold tracking-tight">
          Servo ID {servo.id}
        </h2>
        <p className="text-muted-foreground text-sm">
          {model.model_name} &middot; {config.port} &middot;{" "}
          {config.baudrate.toLocaleString()} bps
          {loading && (
            <span className="text-muted-foreground ml-2 animate-pulse">
              Reading...
            </span>
          )}
        </p>
      </div>

      <div className="flex-1 overflow-auto py-4">
        {model.areas.map((area) => (
          <div key={area.name} className="mb-6">
            <div className="pl-4">
              <h3 className="mb-2 text-sm font-medium">
                {area.name}
                {area.volatile && (
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    (volatile)
                  </span>
                )}
              </h3>
            </div>
            <Table className="px-6">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 pl-4">Addr</TableHead>
                  <TableHead className="w-12">Size</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-14">Access</TableHead>
                  <TableHead className="w-32">Value</TableHead>
                  <TableHead>Unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {area.fields.map((field) => {
                  const state = fieldStates[field.address];
                  return (
                    <TableRow key={field.address}>
                      <TableCell className="pl-4 font-mono text-xs">
                        {field.address}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {field.size}
                      </TableCell>
                      <TableCell className="text-xs">{field.name}</TableCell>
                      <TableCell className="text-xs">
                        <p className="max-w-xs whitespace-normal">
                          {field.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs ${field.access === "RW" ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {field.access}
                        </span>
                      </TableCell>
                      <TableCell>
                        <ControlTableValue
                          field={field}
                          value={state?.value ?? null}
                          error={state?.error ?? null}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {field.unit ?? ""}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ))}
      </div>
    </div>
  );
}
