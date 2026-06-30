use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::{Instruction, InstructionBox};

/// A layer.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Layer {
    snapshots: BTreeMap<u64, String>,
    history: Vec<InstructionBox>,
    history_index: u64,
    visible: bool,
}

#[derive(Error, Debug)]
pub enum LayerError {
    #[error("cannot undo anymore")]
    MaxUndo,
    #[error("cannot redo anymore")]
    MaxRedo,
    #[error("cannot move {0} to {1}")]
    InvalidHistoryMove(u64, u64),
    #[error("history index {0} does not exist")]
    InvalidHistoryIndex(u64),
    #[error("invalid stroke, stroke must have at least 1 point")]
    MinStrokePoints,
    #[error("layer does not have a snapshot at index {0}, must have one in order to truncate")]
    NoSnapshot(u64),
}

impl Default for Layer {
    fn default() -> Self {
        Self {
            snapshots: Default::default(),
            history: Default::default(),
            history_index: 0,
            visible: true,
        }
    }
}

impl Layer {
    pub fn new() -> Self {
        Default::default()
    }

    /// Set the history index.
    pub fn set_history_index(&mut self, new_history_index: u64) -> Result<(), LayerError> {
        if new_history_index <= self.history.len() as u64 {
            self.history_index = new_history_index;
            Ok(())
        } else {
            Err(LayerError::InvalidHistoryIndex(new_history_index))
        }
    }

    /// Goes back in the history.
    pub fn move_instruction(
        &mut self,
        old_instruction_index: u64,
        new_instruction_index: u64,
    ) -> Result<(), LayerError> {
        if old_instruction_index > 0
            && old_instruction_index <= self.history.len() as u64
            && new_instruction_index > 0
            && new_instruction_index <= self.history.len() as u64
        {
            let instruction = self.history.remove(old_instruction_index as usize - 1);
            self.history.insert(new_instruction_index as usize - 1, instruction);
            Ok(())
        } else {
            Err(LayerError::MaxUndo)
        }
    }

    /// Set visibility of an instruction in the history.
    pub fn set_instruction_visibility(
        &mut self,
        index: u64,
        visible: bool,
    ) -> Result<(), LayerError> {
        if index <= self.history.len() as u64 {
            let history_element = self.history.get_mut(index as usize - 1).unwrap();
            history_element.applied = visible;
            self.invalidate_snapshots(index);
            Ok(())
        } else {
            Err(LayerError::InvalidHistoryIndex(index))
        }
    }

    /// Clears the layer.
    ///
    /// The layer is cleared by removing the history. You cannot undo this.
    pub fn clear(&mut self) {
        self.snapshots.clear();
        self.history.clear();
        self.history_index = 0;
    }

    /// Adds the given instruction to the layer.
    pub fn instruct(&mut self, instruction: InstructionBox) -> Result<(), LayerError> {
        if let Instruction::Stroke(s) = &instruction.instruction {
            if s.is_empty() {
                return Err(LayerError::MinStrokePoints);
            }
        }
        self.history.truncate(self.history_index as usize);
        self.history.push(instruction);
        self.history_index += 1;
        Ok(())
    }

    /// Remove an instruction from history.
    pub fn remove_instruction(&mut self, index: u64) -> Result<(), LayerError> {
        if index > 0 && index <= self.history.len() as u64 {
            if index <= self.history_index {
                self.history_index -= 1;
            }
            self.history.remove(index as usize - 1);
            self.invalidate_snapshots(index);
            Ok(())
        } else {
            Err(LayerError::InvalidHistoryIndex(index))
        }
    }

    /// Set the layer visibility.
    pub fn set_visibility(&mut self, visible: bool) {
        self.visible = visible;
    }

    /// Saves the given image as a snapshot of the current history index.
    pub fn snapshot(&mut self, index: u64, data: String) {
        self.snapshots.insert(index, data);
    }

    /// Truncates the history before this index.
    pub fn truncate(&mut self, index: u64) -> Result<(), LayerError> {
        if index <= self.history.len() as u64 && index > 0 {
            let Some(snapshot) = self.snapshots.remove(&index) else {
                return Err(LayerError::NoSnapshot(index));
            };
            self.history = self.history.split_off(index as usize - 1);
            self.snapshots.clear();
            self.snapshots.insert(0, snapshot);
            self.history_index -= index;
            Ok(())
        } else {
            Err(LayerError::InvalidHistoryIndex(index))
        }
    }

    /// Returns true if the layer is visible, false otherwise.
    pub fn is_visible(&self) -> bool {
        self.visible
    }

    /// Returns all the instructions applied to this layer.
    pub fn history(&self) -> &Vec<InstructionBox> {
        &self.history
    }

    /// Returns the current history index.
    pub fn history_index(&self) -> u64 {
        self.history_index
    }

    fn invalidate_snapshots(&mut self, index: u64) {
        self.snapshots = self.snapshots.split_off(&index);
    }
}
