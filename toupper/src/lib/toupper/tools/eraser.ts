import { ToolType } from "../types";
import { StrokeTool } from "./stroke";

export class EraserTool extends StrokeTool {
  public getToolType() {
    return ToolType.Eraser;
  }
}
