import type { Point, Stroke } from "$lib/drinfo";
import { BaseTool } from ".";
import { gs } from "$lib/state.svelte";
import { ToolType } from "../types";

export class StrokeTool extends BaseTool {
  private lastPoint: Point | null = null;

  public onmousemove(event: MouseEvent, element: HTMLElement): void {
    super.onmousemove(event, element);
    if (gs.selectedLayer) {
      (gs.instructionBox!.instruction as Stroke).points.push(this.cursorPosition!);
      gs.server?.drawTemp(
        gs.brush,
        gs.instructionBox!.uuid,
        this.previousCursorPosition!,
        this.cursorPosition!,
        gs.selectedLayer,
      );
    }
  }
  public onmouseup(event: MouseEvent, element: HTMLElement): void {
    super.onmouseup(event, element);
    if (gs.instructionBox && gs.selectedLayer) {
      gs.server?.instructionBox(gs.instructionBox, gs.selectedLayer!);
      const stroke = gs.instructionBox!.instruction as Stroke;
      this.lastPoint = stroke.points[stroke.points.length - 1];
    }
    gs.instructionBox = null;
  }
  public onmousedown(event: MouseEvent, element: HTMLElement): void {
    super.onmousedown(event, element);
    if (event.button !== 0) return;
    gs.instructionBox = {
      uuid: crypto.randomUUID(),
      applied: true,
      instruction: {
        points: [],
        brush: gs.brush,
      },
    };
    if (event.shiftKey && this.lastPoint) {
      (gs.instructionBox.instruction as Stroke).points.push(this.lastPoint);
    }
    (gs.instructionBox.instruction as Stroke).points.push(this.mousedown!);
  }
  public onmouseleave(event: MouseEvent, element: HTMLElement): void {
    super.onmouseleave(event, element);
    this.onmouseup(event, element);
  }

  public getToolType() {
    return ToolType.Stroke;
  }
}
