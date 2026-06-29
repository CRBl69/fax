import { BaseTool } from ".";
import { gs } from "../../../routes/lobby/[lobby]/state.svelte";
import { ToolType } from "../types";

export class BucketTool extends BaseTool {
  public onmousedown(event: MouseEvent, element: HTMLElement) {
    super.onmousedown(event, element);
    if (!gs.selectedLayer) {
      return;
    }
    gs.server?.instructionBox(
      {
        instruction: {
          point: this.cursorPosition!,
          brush: gs.brush,
        },
        uuid: crypto.randomUUID(),
        applied: true,
      },
      gs.selectedLayer,
    );
  }

  public getToolType() {
    return ToolType.Bucket;
  }
}
