import * as DrInFo from "../drinfo";
import type {
  AddLayerMessage,
  CursorInMessage,
  CursorOutMessage,
  InitMessage,
  InstructionMessage,
  JoinMessage,
  LayerDownMessage,
  LayerUpMessage,
  SnapshotMessage,
  TempDrawMessage,
  SetHistoryElementVisibilityMessage,
  SetLayerVisibilityMessage,
  WebSocketMessage,
  MoveInstructionMessage,
  SetHistoryIndexMessage,
} from "./server-types";
import * as TypeConverter from "./type-converter";

interface EventMap {
  cursorout: CustomEvent<CursorOutMessage["CursorOut"]>;
  instruction: CustomEvent<InstructionMessage["Instruction"]>;
  setlayervisibility: CustomEvent<SetLayerVisibilityMessage["SetLayerVisibility"]>;
  sethistoryelementvisibility: CustomEvent<
    SetHistoryElementVisibilityMessage["SetHistoryElementVisibility"]
  >;
  snapshot: CustomEvent<SnapshotMessage["Snapshot"]>;
  addlayer: CustomEvent<AddLayerMessage["AddLayer"]>;
  layerup: CustomEvent<LayerUpMessage["LayerUp"]>;
  layerdown: CustomEvent<LayerDownMessage["LayerDown"]>;
  moveinstruction: CustomEvent<MoveInstructionMessage["MoveInstruction"]>;
  sethistoryindex: CustomEvent<SetHistoryIndexMessage["SetHistoryIndex"]>;
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

const typedEventTarget = EventTarget as { new (): ServerEventTarget; prototype: ServerEventTarget };

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
      console.warn("Could not send.", e);
    }
  }

  setHistoryIndex(layer: string, index: number) {
    const message: SetHistoryIndexMessage = {
      SetHistoryIndex: {
        layer,
        new_history_index: index,
      },
    };
    this.send(message);
  }

  moveInstruction(layer: string, oldInstructionIndex: number, newInstructionIndex: number) {
    const message: MoveInstructionMessage = {
      MoveInstruction: {
        layer,
        old_instruction_index: oldInstructionIndex,
        new_instruction_index: newInstructionIndex,
      },
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
        },
      };
      this.send(message);
    }
  }

  instructionBox(instructionBox: DrInFo.InstructionBox, layer: string) {
    const message: InstructionMessage = {
      Instruction: {
        instruction: TypeConverter.ToServer.instructionBox(instructionBox),
        layer,
      },
    };
    this.send(message);
  }

  setLayerVisibility(layer: string, visible: boolean) {
    const message: SetLayerVisibilityMessage = {
      SetLayerVisibility: {
        layer,
        visible,
      },
    };
    this.send(message);
  }

  setHistoryElementVisibility(layer: string, index: number, visible: boolean) {
    const message: SetHistoryElementVisibilityMessage = {
      SetHistoryElementVisibility: {
        layer,
        index,
        visible,
      },
    };
    this.send(message);
  }

  snapshot(layer: string, data: string, index: number) {
    const message: SnapshotMessage = {
      Snapshot: {
        layer,
        data,
        index,
      },
    };
    this.send(message);
  }

  layerDown(layer: string): void {
    const message: LayerDownMessage = {
      LayerDown: layer,
    };
    this.send(message);
  }

  layerUp(layer: string): void {
    const message: LayerUpMessage = {
      LayerUp: layer,
    };
    this.send(message);
  }

  drawTemp(
    brush: DrInFo.Brush,
    uuid: string,
    start: DrInFo.Point,
    end: DrInFo.Point,
    layer: string,
  ) {
    const message: TempDrawMessage = {
      TempDraw: {
        brush: TypeConverter.ToServer.brush(brush),
        uuid,
        start,
        end,
        layer,
      },
    };
    this.send(message);
  }

  registerEventHandler<K extends keyof EventMap>(
    eventName: K,
    fn: (data: EventMap[K]["detail"]) => void,
  ) {
    this.addEventListener(eventName, (event: EventMap[K]) => fn(event.detail));
  }

  close() {
    this._websocket.close();
  }
}
