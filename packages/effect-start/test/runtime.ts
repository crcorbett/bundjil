import { Layer, ManagedRuntime } from "effect";

export const testRuntime = ManagedRuntime.make(Layer.empty);
