import { SvelteMap } from "svelte/reactivity";
import type { InstructionBox } from "./instruction";

export class Layer {
  snapshots = $state(new SvelteMap<number, string>());
  history = $state(new SvelteMap<number, InstructionBox>());
  historyIndex = $state(0);
  visible = $state(true);
}
