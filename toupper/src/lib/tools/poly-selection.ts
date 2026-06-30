import { BaseTool } from ".";
import { gs } from "$lib/state.svelte";
import { ToolType } from "../types";
import { getDistance } from "$lib/util";
import type { Point } from "$lib/drinfo";

export class PolySelectionTool extends BaseTool {
  private isSelecting = false;
  private realSelection: Point[] = [];

  public onmousedown(event: MouseEvent, element: HTMLElement): void {
    super.onmousedown(event, element);
    if (event.button === 2) {
      this.isSelecting = false;
      this.realSelection = [];
      gs.selections.delete(gs.username);
      gs.server?.sendUnselect();
      return;
    }
    this.isSelecting = true;
    const firstPoint = this.realSelection.length ? this.realSelection[0] : undefined;
    if (
      this.realSelection.length &&
      firstPoint &&
      getDistance(firstPoint, this.cursorPosition!) < 15 &&
      event.shiftKey
    ) {
      this.isSelecting = false;
      gs.selections.set(gs.username, { points: this.realSelection, closed: true });
      gs.server?.sendSelection(this.realSelection, true);
      return;
    }
    const newPoints = [...(this.realSelection ?? []), this.cursorPosition!];
    this.realSelection = newPoints;
    gs.selections.set(gs.username, { points: newPoints, closed: false });
    gs.server?.sendSelection(newPoints, false);
  }

  public onmousemove(event: MouseEvent, element: HTMLElement): void {
    super.onmousemove(event, element);
    if (!this.isSelecting) return;
    if (!this.realSelection.length) return;
    const newPoints = [...this.realSelection, this.cursorPosition!];
    gs.selections.set(gs.username, { points: newPoints, closed: false });
    gs.server?.sendSelection(newPoints, false);
  }

  public getToolType() {
    return ToolType.PolySelect;
  }
}
