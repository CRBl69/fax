import type { ImageInsertion } from "$lib/drinfo";
import { BaseTool } from ".";
import { gs } from "$lib/state.svelte";
import { ToolType } from "../types";

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
    if (event.ctrlKey) {
      imageInsertion.scale.x += (this.cursorPosition!.x - this.previousCursorPosition!.x) / 2000;
      imageInsertion.scale.y += (this.cursorPosition!.y - this.previousCursorPosition!.y) / 2000;
    } else if (event.shiftKey) {
      imageInsertion.scale.x += (this.cursorPosition!.x - this.previousCursorPosition!.x) / 2000;
      imageInsertion.scale.y = imageInsertion.scale.x;
    } else if (event.altKey) {
      const img = gs.renderer?.imageCache.get(imageInsertion.base64);
      if (!img) return;
      const centerX = Math.round(
        (imageInsertion.point.x * 2 + img.width * imageInsertion.scale.x) / 2,
      );
      const centerY = Math.round(
        (imageInsertion.point.y * 2 + img.height * imageInsertion.scale.y) / 2,
      );
      const aX = this.cursorPosition!.x;
      const aY = this.cursorPosition!.y;
      const bX = this.previousCursorPosition!.x;
      const bY = this.previousCursorPosition!.y;
      const caX = aX - centerX;
      const caY = aY - centerY;
      const cbX = bX - centerX;
      const cbY = bY - centerY;
      const product = caX * cbX + caY * cbY;
      const caMag = Math.sqrt(caX ** 2 + caY ** 2);
      const cbMag = Math.sqrt(cbX ** 2 + cbY ** 2);
      const cos = product / (caMag * cbMag);
      const angleRadians = Math.acos(cos);
      const angleDegrees = (angleRadians / Math.PI) * 180;
      const crossProduct = caX * cbY - caY * cbX;
      let rotate;
      if (crossProduct > 0) {
        rotate = ((imageInsertion.rotate * 360) / (2 ** 32 - 1) - angleDegrees) % 360;
      } else {
        rotate = ((imageInsertion.rotate * 360) / (2 ** 32 - 1) + angleDegrees) % 360;
      }
      rotate = Math.round((rotate * (2 ** 32 - 1)) / 360);
      if (rotate < 0) {
        rotate = 2 ** 32 - 1 - rotate;
      }
      if (!isNaN(rotate)) {
        imageInsertion.rotate = rotate;
      }
    } else {
      imageInsertion.point.x += this.cursorPosition!.x - this.previousCursorPosition!.x;
      imageInsertion.point.y += this.cursorPosition!.y - this.previousCursorPosition!.y;
    }
    gs.server?.sendTempImage(gs.currentUuid, gs.selectedLayer!, imageInsertion);
  }

  public getToolType() {
    return ToolType.InsertImage;
  }
}
