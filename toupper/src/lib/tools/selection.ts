import { BaseTool } from ".";
import { gs } from "$lib/state.svelte";
import { ToolType } from "../types";

export class SelectionTool extends BaseTool {
  private isSelecting = false;

  public onmousedown(event: MouseEvent, element: HTMLElement): void {
    super.onmousedown(event, element);
    if (event.button === 2) {
      this.isSelecting = false;
      gs.selections.delete(gs.username);
      gs.server?.sendUnselect();
      return;
    }
    if (!this.isSelecting) {
      gs.selections.set(gs.username, {
        points: [
          this.cursorPosition!,
          this.cursorPosition!,
          this.cursorPosition!,
          this.cursorPosition!,
        ],
        closed: true,
      });
      this.isSelecting = true;
    } else {
      this.isSelecting = false;
      const selection = gs.selections.get(gs.username)!;
      const start = selection.points[0];
      const end = this.cursorPosition!;
      gs.selections.set(gs.username, {
        points: [start, { x: end.x, y: start.y }, end, { x: start.x, y: end.y }],
        closed: true,
      });
    }
  }
  public onmousemove(event: MouseEvent, element: HTMLElement): void {
    super.onmousemove(event, element);
    if (this.isSelecting) {
      const selection = gs.selections.get(gs.username)!;
      const s = selection.points[0];
      const c = this.cursorPosition!;
      const newPoints = [s, { x: c.x, y: s.y }, c, { x: s.x, y: c.y }];
      gs.selections.set(gs.username, {
        points: newPoints,
        closed: true,
      });
      gs.server?.sendSelection(newPoints, closed);
    }
  }

  public getToolType() {
    return ToolType.Select;
  }
}
