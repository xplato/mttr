import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { getModel } from "@/lib/models";
import type { ConnectionConfig, ReadEvent, ServoInfo } from "@/lib/servo";
import { readControlTable, writeAddress } from "@/lib/servo";
import { toast } from "sonner";

import { ControlTableValue } from "./ControlTableValue";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { VelocityControl } from "./VelocityControl";

interface ServoDetailProps {
  servo: ServoInfo;
  config: ConnectionConfig;
  onLoadingChange?: (loading: boolean) => void;
  onServoUpdate?: (oldId: number, updated: ServoInfo) => void;
}

export interface ServoDetailHandle {
  refresh: () => void;
}

interface FieldState {
  value: number | null;
  error: string | null;
}

export const ServoDetail = forwardRef<ServoDetailHandle, ServoDetailProps>(
  function ServoDetail({ servo, config, onLoadingChange, onServoUpdate }, ref) {
    const model = getModel(servo.model_number);
    const allFields = useMemo(
      () => model?.areas.flatMap((a) => a.fields) ?? [],
      [model],
    );
    const idAddress = useMemo(
      () => allFields.find((f) => f.name === "ID")?.address,
      [allFields],
    );
    const operatingModeAddress = useMemo(
      () => allFields.find((f) => f.name === "Operating Mode")?.address,
      [allFields],
    );
    const goalVelocityField = useMemo(
      () => allFields.find((f) => f.name === "Goal Velocity"),
      [allFields],
    );
    const torqueEnableAddress = useMemo(
      () => allFields.find((f) => f.name === "Torque Enable")?.address,
      [allFields],
    );
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
          toast.error(`Failed to read control table: ${err}`);
        }
      }
    }, [servo.id, model]);

    const handleWrite = useCallback(
      async (address: number, size: number, value: number) => {
        await writeAddress(servo.id, address, size, value).catch((err) => {
          toast.error(`Failed to write address ${address}: ${err}`);
          throw err; // Re-throw so ControlTableValue keeps the input open
        });
        // Update local state with the written value
        setFieldStates((prev) => ({
          ...prev,
          [address]: { value, error: null },
        }));
        // If the servo ID was changed, update parent state
        if (idAddress !== undefined && address === idAddress) {
          onServoUpdate?.(servo.id, {
            ...servo,
            id: value,
          });
        }
      },
      [servo, onServoUpdate, idAddress],
    );

    useImperativeHandle(ref, () => ({ refresh: loadControlTable }), [
      loadControlTable,
    ]);

    useEffect(() => {
      onLoadingChange?.(loading);
    }, [loading, onLoadingChange]);

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
      <div className="grid h-full grid-cols-[auto_24rem] overflow-hidden">
        <div className="w-full overflow-auto">
          <div className="min-w-200 flex-1 py-4">
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
                          <TableCell className="text-xs">
                            {field.name}
                          </TableCell>
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
                              onWrite={(v) =>
                                handleWrite(field.address, field.size, v)
                              }
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
        <div className="border-border shrink-0 space-y-6 overflow-auto border-l px-6 py-4">
          <div className="flex flex-col items-start justify-start gap-1">
            <h2 className="text-foreground text-xl leading-none font-semibold tracking-tight">
              Servo ID {servo.id}
            </h2>
            <p className="text-muted-foreground text-sm">
              {model.model_name}
              {loading && (
                <span className="text-muted-foreground ml-2 animate-pulse">
                  Reading...
                </span>
              )}
            </p>
          </div>

          {/* Velocity control — only in Velocity Control mode with torque enabled */}
          {operatingModeAddress !== undefined &&
            fieldStates[operatingModeAddress]?.value === 1 &&
            torqueEnableAddress !== undefined &&
            fieldStates[torqueEnableAddress]?.value === 1 &&
            goalVelocityField?.range && (
              <VelocityControl
                value={fieldStates[goalVelocityField.address]?.value ?? 0}
                min={goalVelocityField.range[0]}
                max={goalVelocityField.range[1]}
                rawUnit={goalVelocityField.unit}
                onWrite={(v) =>
                  handleWrite(
                    goalVelocityField.address,
                    goalVelocityField.size,
                    v,
                  )
                }
              />
            )}
        </div>
      </div>
    );
  },
);
