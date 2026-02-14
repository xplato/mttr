import type { ServoModel } from "./servo";
import xl430 from "../../models/1060.json";

const MODEL_REGISTRY: Record<number, ServoModel> = {
  1060: xl430 as unknown as ServoModel,
};

export function getModel(modelNumber: number): ServoModel | undefined {
  return MODEL_REGISTRY[modelNumber];
}
