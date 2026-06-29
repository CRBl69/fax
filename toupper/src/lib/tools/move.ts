import type { Motion } from "$lib/drinfo";
import { BaseTool } from ".";
import { gs } from "$lib/state.svelte";
import { ToolType } from "../types";
import { SvelteMap } from "svelte/reactivity";

export class MoveTool extends BaseTool {
  public onmouseup(event: MouseEvent, element: HTMLElement): void {
    if (this.mousedown) {
      if (!gs.selectedLayer || !gs.currentUuid) return;
      let instructionBox = gs.inProgress.get(gs.selectedLayer)!.get(gs.currentUuid)!.instructionBox;
      const delta = {
        x: this.cursorPosition!.x - this.mousedown.x,
        y: this.cursorPosition!.y - this.mousedown.y,
      };
      gs.server?.instructionBox(instructionBox, gs.selectedLayer!);
      gs.inProgress.get(gs.selectedLayer)?.delete(gs.currentUuid);
      gs.currentUuid = null;

      const selection = gs.selections.get(gs.username)!;
      gs.selections.set(gs.username, {
        closed: true,
        points: selection.points.map((p) => ({ x: p.x + delta.x, y: p.y + delta.y })),
      });
    }
    super.onmouseup(event, element);
  }
  public onmousedown(event: MouseEvent, element: HTMLElement): void {
    super.onmousedown(event, element);
    if ((gs.selections.get(gs.username)?.points.length ?? 0) >= 3 && gs.selectedLayer !== null) {
      const uuid = crypto.randomUUID();
      const instructionBox = {
        applied: true,
        uuid,
        instruction: {
          selection: gs.selections.get(gs.username)!.points,
          end: gs.selections.get(gs.username)!.points[0],
        },
      };
      gs.currentUuid = uuid;
      let map = gs.inProgress.get(gs.selectedLayer);
      if (!map) {
        map = new SvelteMap();
        gs.inProgress.set(gs.selectedLayer, map);
      }
      map.set(uuid, { username: gs.username, layer: gs.selectedLayer, instructionBox });
      gs.server?.sendMove(uuid, gs.selectedLayer, this.cursorPosition!);
    }
  }
  public onmouseleave(event: MouseEvent, element: HTMLElement): void {
    super.onmouseleave(event, element);
    this.onmouseup(event, element);
  }
  public onmousemove(event: MouseEvent, element: HTMLElement): void {
    super.onmousemove(event, element);
    if (this.mousedown) {
      if (!gs.selectedLayer || !gs.currentUuid) return;
      let instructionBox = gs.inProgress.get(gs.selectedLayer)!.get(gs.currentUuid)!.instructionBox;
      const dx = this.cursorPosition!.x - this.mousedown.x;
      const dy = this.cursorPosition!.y - this.mousedown.y;
      const selection = (instructionBox.instruction as Motion).selection;
      const selectionStart = selection[0];
      const point = {
        x: selectionStart.x + dx,
        y: selectionStart.y + dy,
      };
      gs.server?.sendMove(instructionBox.uuid, gs.selectedLayer!, point);
      (instructionBox.instruction as Motion).end = point;
    }
  }

  public getToolType() {
    return ToolType.Move;
  }
}
