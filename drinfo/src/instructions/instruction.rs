use core::fmt::Debug;

use serde::{Deserialize, Serialize};

use crate::{Bucket, ImageInsertion, Motion, Stroke};

/// An instruction.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum Instruction {
    Bucket(Bucket),
    ImageInsertion(ImageInsertion),
    Motion(Motion),
    Stroke(Stroke),
}

/// An instruction box.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InstructionBox {
    pub instruction: Instruction,
    pub applied: bool,
    pub uuid: String,
}
