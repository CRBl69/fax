use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::{Instruction, InstructionBox};

/// A layer.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Layer {
    snapshots: BTreeMap<usize, String>,
    history: BTreeMap<usize, InstructionBox>,
    history_index: usize,
    visible: bool,
}

#[derive(Error, Debug)]
pub enum LayerError {
    #[error("cannot undo anymore")]
    MaxUndo,
    #[error("cannot redo anymore")]
    MaxRedo,
    #[error("history index {0} does not exist")]
    InvalidHistoryIndex(usize),
    #[error("invalid stroke, stroke must have at least 1 point")]
    MinStrokePoints,
    #[error("layer does not have a snapshot at index {0}, must have one in order to truncate")]
    NoSnapshot(usize),
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

    /// Goes one step back in the history.
    pub fn undo(&mut self) -> Result<(), LayerError> {
        if self.history_index == 1 {
            self.history_index = 0;
            Ok(())
        } else if self.history.contains_key(&(self.history_index - 1)) {
            self.history_index -= 1;
            Ok(())
        } else {
            Err(LayerError::MaxUndo)
        }
    }

    /// Goes one step forward in the history.
    pub fn redo(&mut self) -> Result<(), LayerError> {
        if self.history.contains_key(&(self.history_index + 1)) {
            self.history_index += 1;
            Ok(())
        } else {
            Err(LayerError::MaxRedo)
        }
    }

    /// Toggle an instruction in the history.
    pub fn set_history_element_visibility(
        &mut self,
        index: usize,
        visible: bool,
    ) -> Result<(), LayerError> {
        if let Some(history_element) = self.history.get_mut(&index) {
            history_element.applied = visible;
            self.snapshots.split_off(&index);
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
        self.history_index += 1;
        self.history.split_off(&self.history_index);
        self.history.insert(self.history_index, instruction);
        Ok(())
    }

    /// Set the layer visibility.
    pub fn set_visibility(&mut self, visible: bool) {
        self.visible = visible;
    }

    /// Saves the given image as a snapshot of the current history index.
    pub fn snapshot(&mut self, index: usize, data: String) {
        self.snapshots.insert(index, data);
    }

    /// Truncates the history before this index.
    pub fn truncate(&mut self, index: usize) -> Result<(), LayerError> {
        if self.history.contains_key(&index) {
            if !self.snapshots.contains_key(&index) {
                return Err(LayerError::NoSnapshot(index));
            }
            self.history = self.history.split_off(&(index + 1));
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
    pub fn history(&self) -> &BTreeMap<usize, InstructionBox> {
        &self.history
    }

    /// Returns the current history index.
    pub fn history_index(&self) -> usize {
        self.history_index
    }
}
