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
    SetLayerVisibility(SetLayerVisibilityData),
    AddLayer(String),
    LayerUp(String),
    LayerDown(String),
    Undo(String),
    Redo(String),
    RequestInit,
    Init(InitData),
    Join(String),
    TempDraw(TempDrawData),
    Snapshot(SnapshotData),
    SetHistoryElementVisibility(SetHistoryElementData),
}

#[derive(Serialize, Deserialize, Clone)]
pub struct InstructionData {
    pub layer: String,
    pub instruction: InstructionBox,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct SetLayerVisibilityData {
    pub layer: String,
    pub visible: bool,
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

#[derive(Serialize, Deserialize, Clone)]
pub struct SnapshotData {
    pub layer: String,
    pub data: String,
    pub index: usize,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct SetHistoryElementData {
    pub layer: String,
    pub index: usize,
    pub visible: bool,
}

impl CursorDataOut {
    pub fn from_recieved(cursor: CursorDataIn, username: String) -> Self {
        CursorDataOut { cursor, username }
    }
}
