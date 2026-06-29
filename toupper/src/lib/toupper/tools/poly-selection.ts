import { BaseTool } from ".";
import { gs } from "../../../routes/lobby/[lobby]/state.svelte";
import { ToolType } from "../types";

export class PolySelectionTool extends BaseTool {
  public onmousedown(event: MouseEvent, element: HTMLElement): void {
    super.onmousedown(event, element);
    const prev = gs.selections.get(gs.username);
    const newPoints = [...(prev?.points ?? []), this.cursorPosition!];
    gs.selections.set(gs.username, { points: newPoints, closed: false });
    gs.server?.sendSelection(newPoints, false);
  }

  public getToolType() {
    return ToolType.PolySelect;
  }
}
