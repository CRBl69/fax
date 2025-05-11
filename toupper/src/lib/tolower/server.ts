import * as DrInFo from "../drinfo";
import type { AddLayerMessage, CursorInMessage, CursorOutMessage, InitMessage, InstructionMessage, JoinMessage, LayerDownMessage, LayerUpMessage, RedoMessage, TempDrawMessage, ToggleLayerVisibilityMessage, UndoMessage, WebSocketMessage } from "./server-types";
import * as TypeConverter from "./type-converter";

interface EventMap {
  cursorout: CustomEvent<CursorOutMessage["CursorOut"]>;
  instruction: CustomEvent<InstructionMessage["Instruction"]>;
  togglelayervisibility: CustomEvent<ToggleLayerVisibilityMessage["ToggleLayerVisibility"]>;
  addlayer: CustomEvent<AddLayerMessage["AddLayer"]>;
  layerup: CustomEvent<LayerUpMessage["LayerUp"]>;
  layerdown: CustomEvent<LayerDownMessage["LayerDown"]>;
  undo: CustomEvent<UndoMessage["Undo"]>;
  redo: CustomEvent<RedoMessage["Redo"]>;
  init: CustomEvent<InitMessage["Init"]>;
  join: CustomEvent<JoinMessage["Join"]>;
  tempdraw: CustomEvent<TempDrawMessage["TempDraw"]>;
}

interface ServerEventTarget extends EventTarget {
  addEventListener<K extends keyof EventMap>(
    type: K,
    listener: (ev: EventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean,
  ): void;
  removeEventListener<K extends keyof EventMap>(
    type: K,
    listener: (ev: EventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean,
  ): void;
}

const typedEventTarget = EventTarget as { new(): ServerEventTarget; prototype: ServerEventTarget };

export class Server extends typedEventTarget {
  private _websocket;

  constructor(url: string, username: string) {
    super();
    this._websocket = new WebSocket(`${url}/ws/${username}`);

    this._websocket.onopen = () => {
      this._websocket.send(JSON.stringify("RequestInit"));
    };

    const onmessage = (msg: MessageEvent) => {
      const data: WebSocketMessage = JSON.parse(msg.data);
      const eventName = Object.keys(data)[0];
      const event = new CustomEvent(eventName.toLowerCase(), { detail: Object.values(data)[0] });
      this.dispatchEvent(event);
    };

    this._websocket.onmessage = onmessage;

    // Hook here something to display an error message in case we fail again.
    this._websocket.onclose = () => {
      setTimeout(() => {
        this._websocket = new WebSocket(url);
        this._websocket.onopen = () => {
          this._websocket.send(JSON.stringify("RequestInit"));
        };
        this._websocket.onmessage = onmessage;
      }, 1000);
    };
  }

  private send(obj: WebSocketMessage) {
    try {
      this._websocket.send(JSON.stringify(obj));
    } catch (e) {
      console.warn("Could not send.", e)
    }
  }

  undo(layer: string) {
    const message: UndoMessage = {
      Undo: layer,
    };
    this.send(message);
  }

  redo(layer: string) {
    const message: RedoMessage = {
      Redo: layer,
    };
    this.send(message);
  }

  addLayer(layer: string) {
    const message: AddLayerMessage = {
      AddLayer: layer,
    };
    this.send(message);
  }

  cursor(brush: DrInFo.Brush, point: DrInFo.Point | null) {
    if (point === null) {
      const message: CursorInMessage = {
        CursorIn: null,
      };
      this.send(message);
    } else {
      const message: CursorInMessage = {
        CursorIn: {
          brush: TypeConverter.ToServer.brush(brush),
          point,
        }
      };
      this.send(message);
    }
  }

  instructionBox(instructionBox: DrInFo.InstructionBox, layer: string) {
    const message: InstructionMessage = {
      Instruction: {
        instruction: TypeConverter.ToServer.instructionBox(instructionBox),
        layer,
      }
    }
    this.send(message);
  }

  toggleLayerVisibility(layer: string) {
    const message: ToggleLayerVisibilityMessage = {
      ToggleLayerVisibility: layer,
    }
    this.send(message);
  }

  layerDown(layer: string): void {
    const message: LayerDownMessage = {
      LayerDown: layer,
    }
    this.send(message);
  }

  layerUp(layer: string): void {
    const message: LayerUpMessage = {
      LayerUp: layer,
    }
    this.send(message);
  }

  drawTemp(brush: DrInFo.Brush, uuid: string, start: DrInFo.Point, end: DrInFo.Point, layer: string) {
    const message: TempDrawMessage = {
      TempDraw: {
        brush: TypeConverter.ToServer.brush(brush),
        uuid,
        start,
        end,
        layer,
      }
    }
    this.send(message);
  }

  registerEventHandler<K extends keyof EventMap>(eventName: K, fn: (data: EventMap[K]["detail"]) => void) {
    this.addEventListener(eventName, (event: EventMap[K]) => fn(event.detail));
  }

  close() {
    this._websocket.close();
  }
}
