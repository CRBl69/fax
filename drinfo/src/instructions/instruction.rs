use core::fmt::Debug;

use serde::{Serialize, Deserialize};

use crate::{ImageInsertion, Motion, Stroke};

/// An instruction.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum Instruction {
    Stroke(Stroke),
    Motion(Motion),
    ImageInsertion(ImageInsertion)
}

/// An instruction box.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InstructionBox {
    pub instruction: Instruction,
    pub uuid: String,
}
