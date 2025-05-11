use actix::Message;
use drawing::{
    instruction::{Instruction, InstructionBox},
    Color, ImageInsertion, Motion, Point, Stroke,
};
use serde::{Deserialize, Serialize};

#[derive(Message, Serialize, Deserialize, Clone)]
#[rtype(result = "()")]
pub enum WebSocketMessage {
    CursorIn(CursorDataIn),
    CursorOut(CursorDataOut),
    Instruction(InstructionData),
    ToggleLayerVisibility(String),
    AddLayer(String),
    LayerUp(String),
    LayerDown(String),
    Undo(String),
    Redo(String),
    RequestInit,
    Init(InitData),
    Join(String),
    TempDraw(TempDrawData),
}

#[derive(Serialize, Deserialize, Clone)]
pub struct InstructionData {
    pub layer: String,
    pub instruction: InstructionBox,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Cursor {
    pub point: Point,
    pub brush: drawing::Brush,
}

pub type CursorDataIn = Option<Cursor>;

#[derive(Serialize, Deserialize, Clone)]
pub struct CursorDataOut {
    pub cursor: Option<Cursor>,
    pub username: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct InitData {
    pub drawing: drawing::Drawing,
    pub users: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct TempDrawData {
    brush: drawing::Brush,
    uuid: String,
    start: drawing::Point,
    end: drawing::Point,
    layer: String,
}

impl CursorDataOut {
    pub fn from_recieved(cursor: CursorDataIn, username: String) -> Self {
        CursorDataOut {
            cursor,
            username,
        }
    }
}
