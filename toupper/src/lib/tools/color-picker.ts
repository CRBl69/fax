import { rgbToStr } from "$lib/render";
import { BaseTool } from ".";
import { gs } from "$lib/state.svelte";
import { ToolType } from "../types";

export class ColorPickerTool extends BaseTool {
  public onmousedown(event: MouseEvent, element: HTMLElement) {
    super.onmousedown(event, element);
    if (!this.context) {
      return;
    }
    const imgd = this.context.getImageData(this.cursorPosition!.x, this.cursorPosition!.y, 1, 1);
    const colorStr = rgbToStr(imgd.data[0], imgd.data[1], imgd.data[2]);
    gs.brush.opacity = Math.floor((imgd.data[3] * 100000) / 255);
    gs.brush.color = colorStr;
  }

  public getToolType() {
    return ToolType.PickColor;
  }
}
