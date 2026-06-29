import type { Motion } from "$lib/drinfo";
import { BaseTool } from ".";
import { gs } from "../../../routes/lobby/[lobby]/state.svelte";
import { ToolType } from "../types";

export class MoveTool extends BaseTool {
  public onmouseup(event: MouseEvent, element: HTMLElement): void {
    if (this.mousedown) {
      const delta = {
        x: this.cursorPosition!.x - this.mousedown.x,
        y: this.cursorPosition!.y - this.mousedown.y,
      };
      gs.server?.instructionBox(gs.instructionBox!, gs.selectedLayer!);
      gs.instructionBox = null;

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
      gs.instructionBox = {
        applied: true,
        uuid,
        instruction: {
          selection: gs.selections.get(gs.username)!.points,
          end: gs.selections.get(gs.username)!.points[0],
        },
      };
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
      const dx = this.cursorPosition!.x - this.mousedown.x;
      const dy = this.cursorPosition!.y - this.mousedown.y;
      const selection = (gs.instructionBox!.instruction as Motion).selection;
      const selectionStart = selection[0];
      const point = {
        x: selectionStart.x + dx,
        y: selectionStart.y + dy,
      };
      gs.server?.sendMove(gs.instructionBox!.uuid, gs.selectedLayer!, point);
      (gs.instructionBox!.instruction as Motion).end = point;
    }
  }

  public getToolType() {
    return ToolType.Move;
  }
}
