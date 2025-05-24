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
    SetHistoryIndex(SetHistoryIndexData),
    MoveInstruction(MoveInstructionData),
    RequestInit,
    Init(InitData),
    Join(String),
    TempDraw(TempDrawData),
    Snapshot(SnapshotData),
    SetInstructionVisibility(SetInstructionVisibilityData),
    RemoveInstruction(RemoveInstructionData),
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
pub struct SetHistoryIndexData {
    pub layer: String,
    pub new_history_index: usize,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct MoveInstructionData {
    pub layer: String,
    pub old_instruction_index: usize,
    pub new_instruction_index: usize,
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
pub struct SetInstructionVisibilityData {
    pub layer: String,
    pub index: usize,
    pub visible: bool,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct RemoveInstructionData {
    pub layer: String,
    pub index: usize,
}

impl CursorDataOut {
    pub fn from_recieved(cursor: CursorDataIn, username: String) -> Self {
        CursorDataOut { cursor, username }
    }
}
