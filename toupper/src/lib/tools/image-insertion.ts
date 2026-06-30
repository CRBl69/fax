import type { ImageInsertion } from "$lib/drinfo";
import { BaseTool } from ".";
import { gs } from "$lib/state.svelte";
import { ToolType } from "../types";
import { applyTransform } from "./transform";

export class ImageInsertionTool extends BaseTool {
  public onmousedown(event: MouseEvent, element: HTMLElement): void {
    super.onmousedown(event, element);
    if (event.button === 2 && gs.selectedLayer && gs.currentUuid) {
      const imageInsertion = gs.inProgress.get(gs.selectedLayer)!.get(gs.currentUuid)!
        .instructionBox.instruction as ImageInsertion;
      imageInsertion.scale.y = imageInsertion.scale.x;
    }
  }
  public onmousemove(event: MouseEvent, element: HTMLElement): void {
    super.onmousemove(event, element);
    if (!gs.selectedLayer || !gs.currentUuid) return;
    if (!this.mousedown) return;
    const imageInsertion = gs.inProgress.get(gs.selectedLayer)!.get(gs.currentUuid)!.instructionBox
      .instruction as ImageInsertion;
    const img = gs.renderer?.imageCache.get(imageInsertion.base64);
    if (!img) return;
    const pivot = {
      x: Math.round((imageInsertion.point.x * 2 + img.width * imageInsertion.scale.x) / 2),
      y: Math.round((imageInsertion.point.y * 2 + img.height * imageInsertion.scale.y) / 2),
    };
    const result = applyTransform(
      imageInsertion.point,
      imageInsertion.scale,
      imageInsertion.rotate,
      this.cursorPosition!,
      this.previousCursorPosition!,
      event,
      pivot,
    );
    imageInsertion.point = result.position;
    imageInsertion.scale = result.scale;
    imageInsertion.rotate = result.rotate;
    gs.server?.sendTempImage(gs.currentUuid, gs.selectedLayer!, imageInsertion);
  }

  public getToolType() {
    return ToolType.InsertImage;
  }
}
