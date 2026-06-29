import type { Point } from "$lib/drinfo";
import { gs } from "$lib/state.svelte";
import type { ToolType } from "../types";
import { getX, getY } from "../util";

export abstract class Tool {
  public abstract onmousemove(event: MouseEvent, element: HTMLElement): void;
  public abstract onmouseup(event: MouseEvent, element: HTMLElement): void;
  public abstract onmousedown(event: MouseEvent, element: HTMLElement): void;
  public abstract onmouseenter(event: MouseEvent, element: HTMLElement): void;
  public abstract onmouseleave(event: MouseEvent, element: HTMLElement): void;
  public abstract onkeydown(event: KeyboardEvent, element: HTMLElement): void;
  public abstract onkeyup(event: KeyboardEvent, element: HTMLElement): void;
  public abstract getToolType(): ToolType;
}

export abstract class BaseTool extends Tool {
  protected mousedown: Point | null = null;
  protected previousCursorPosition: Point | null = null;
  protected cursorPosition: Point | null = null;
  protected context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;

  constructor(
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null,
  ) {
    super();
    this.context = context;
  }

  public onmouseup(_event: MouseEvent, _element: HTMLElement): void {
    this.mousedown = null;
  }
  public onmousedown(event: MouseEvent, element: HTMLElement): void {
    const x = getX(element, event, gs.ratio);
    const y = getY(element, event, gs.ratio);
    this.mousedown = { x, y };
  }
  public onmouseleave(event: MouseEvent, element: HTMLElement): void {
    this.onmouseup(event, element);
  }
  public onmousemove(event: MouseEvent, element: HTMLElement): void {
    const x = getX(element, event, gs.ratio);
    const y = getY(element, event, gs.ratio);
    this.previousCursorPosition = this.cursorPosition;
    this.cursorPosition = { x, y };
  }
  public onmouseenter(_event: MouseEvent, _element: HTMLElement): void {}
  public onkeydown(_event: KeyboardEvent, _element: HTMLElement): void {}
  public onkeyup(_event: KeyboardEvent, _element: HTMLElement): void {}
}
