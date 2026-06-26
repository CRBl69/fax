use drawing::{
    instruction::{Instruction, InstructionBox},
    Color, ImageInsertion, Motion, Point, Stroke,
};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum WebSocketClientMessage {
    Cursor(CursorClientData),
    Instruction(InstructionData),
    SetLayerVisibility(SetLayerVisibilityData),
    AddLayer(String),
    LayerUp(String),
    LayerDown(String),
    SetHistoryIndex(SetHistoryIndexData),
    MoveInstruction(MoveInstructionData),
    RequestInit,
    TempDraw(TempDrawData),
    Selection(SelectionClientData),
    Unselect,
    TempImageStart(TempImageStartClientData),
    TempImage(TempImageClientData),
    TempMove(MoveClientData),
    Snapshot(SnapshotData),
    SetInstructionVisibility(SetInstructionVisibilityData),
    RemoveInstruction(RemoveInstructionData),
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum WebSocketServerMessage {
    Cursor(CursorServerData),
    Instruction(InstructionData),
    SetLayerVisibility(SetLayerVisibilityData),
    AddLayer(String),
    LayerUp(String),
    LayerDown(String),
    SetHistoryIndex(SetHistoryIndexData),
    MoveInstruction(MoveInstructionData),
    Init(InitData),
    Join(String),
    TempDraw(TempDrawData),
    Selection(SelectionServerData),
    Unselect(String),
    TempImageStart(TempImageStartServerData),
    TempImage(TempImageServerData),
    TempMove(MoveServerData),
    Snapshot(SnapshotData),
    SetInstructionVisibility(SetInstructionVisibilityData),
    RemoveInstruction(RemoveInstructionData),
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct InstructionData {
    pub layer: String,
    pub instruction: InstructionBox,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SetLayerVisibilityData {
    pub layer: String,
    pub visible: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SetHistoryIndexData {
    pub layer: String,
    pub new_history_index: usize,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MoveInstructionData {
    pub layer: String,
    pub old_instruction_index: usize,
    pub new_instruction_index: usize,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum Tool {
    Brush(drawing::Brush),
    Selection,
    Bucket(drawing::Brush),
    Eraser(drawing::Brush),
    ColorPicker,
    Move,
    ImageInsertion,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Cursor {
    pub point: Point,
    pub tool: Tool,
}

pub type CursorClientData = Option<Cursor>;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CursorServerData {
    pub cursor: Option<Cursor>,
    pub username: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct InitData {
    pub drawing: drawing::Drawing,
    pub users: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TempDrawData {
    brush: drawing::Brush,
    uuid: String,
    start: drawing::Point,
    end: drawing::Point,
    layer: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SelectionClientData {
    pub points: Vec<Point>,
    pub closed: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SelectionServerData {
    pub username: String,
    pub points: Vec<Point>,
    pub closed: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TempImageStartClientData {
    pub uuid: String,
    pub layer: String,
    pub image_insertion: ImageInsertion,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TempImageStartServerData {
    pub username: String,
    pub uuid: String,
    pub layer: String,
    pub image_insertion: ImageInsertion,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TempImageClientData {
    pub uuid: String,
    pub layer: String,
    pub point: Point,
    pub scale: Point,
    pub rotate: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TempImageServerData {
    pub username: String,
    pub uuid: String,
    pub layer: String,
    pub point: Point,
    pub scale: Point,
    pub rotate: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MoveClientData {
    pub uuid: String,
    pub layer: String,
    pub end: Point,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MoveServerData {
    pub username: String,
    pub uuid: String,
    pub layer: String,
    pub end: Point,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SnapshotData {
    pub layer: String,
    pub data: String,
    pub index: usize,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SetInstructionVisibilityData {
    pub layer: String,
    pub index: usize,
    pub visible: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct RemoveInstructionData {
    pub layer: String,
    pub index: usize,
}

impl CursorServerData {
    pub fn from_recieved(cursor: CursorClientData, username: String) -> Self {
        CursorServerData { cursor, username }
    }
}
