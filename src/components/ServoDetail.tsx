import type { ConnectionConfig, ServoInfo } from "@/lib/servo";

interface ServoDetailProps {
  servo: ServoInfo;
  config: ConnectionConfig;
}

export function ServoDetail({ servo, config }: ServoDetailProps) {
  return (
    <div className="flex h-full flex-1 flex-col p-6">
      <div className="flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-2xl pb-2">
          <h2 className="text-foreground mb-1 text-xl leading-none font-semibold tracking-tight">
            Servo ID {servo.id}
          </h2>
          <p className="text-muted-foreground mb-3 text-sm">
            Model {servo.model_number}
          </p>

          <div className="border-border space-y-3 rounded-lg border p-4">
            <h3 className="text-sm font-medium">Connection</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <span className="text-muted-foreground">Port</span>
              <span className="font-mono text-xs">{config.port}</span>
              <span className="text-muted-foreground">Protocol</span>
              <span>{config.protocol}</span>
              <span className="text-muted-foreground">Baudrate</span>
              <span>{config.baudrate.toLocaleString()} bps</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
