import { SvelteMap } from "svelte/reactivity";
import type { InstructionBox } from "./instruction";

export class Layer {
  snapshots = $state(new SvelteMap<number, string>());
  history: InstructionBox[] = $state([]);
  historyIndex = $state(0);
  visible = $state(true);
}
