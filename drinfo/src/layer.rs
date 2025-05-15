use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use crate::{Error, Instruction, InstructionBox};

/// A layer.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Layer {
    snapshots: BTreeMap<usize, String>,
    history: BTreeMap<usize, InstructionBox>,
    history_index: usize,
    visible: bool,
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
    pub fn undo(&mut self) -> Result<(), Error> {
        if self.history.contains_key(&(self.history_index - 1)) {
            self.history_index -= 1;
            Ok(())
        } else {
            Err(Error("Cannot undo anymore".to_string()))
        }
    }

    /// Goes one step forward in the history.
    pub fn redo(&mut self) -> Result<(), Error> {
        if self.history.contains_key(&(self.history_index + 1)) {
            self.history_index += 1;
            Ok(())
        } else {
            Err(Error("Cannot redo anymore".to_string()))
        }
    }

    /// Toggle an instruction in the history.
    pub fn toggle_history_element(&mut self, index: usize) -> Result<(), Error> {
        if let Some(history_element) = self.history.get_mut(&index) {
            history_element.applied = !history_element.applied;
            self.snapshots.split_off(&index);
            Ok(())
        } else {
            Err(Error("Invalid history index".to_string()))
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
    pub fn instruct(&mut self, instruction: InstructionBox) -> Result<(), crate::Error> {
        if let Instruction::Stroke(s) = &instruction.instruction {
            if s.len() == 0 {
                return Err(crate::Error(
                    "Stroke must have at least 1 point.".to_string(),
                ));
            }
        }
        self.history_index += 1;
        self.history.split_off(&self.history_index);
        self.history.insert(self.history_index, instruction);
        Ok(())
    }

    /// Toggles between visible and unvisible.
    pub fn toggle_visibility(&mut self) -> &Self {
        self.visible = !self.visible;
        self
    }

    /// Saves the given image as a snapshot of the current history index.
    pub fn snapshot(&mut self, data: String) {
        self.snapshots.insert(self.history_index, data);
    }

    /// Truncates the history before this index.
    pub fn truncate(&mut self, index: usize) -> Result<(), Error> {
        if index < self.history.len() {
            if !self.snapshots.contains_key(&index) {
                return Err(Error(
                    "Layer does not contain a snapshot at the given index".to_string(),
                ));
            }
            self.history = self.history.split_off(&(index + 1));
            Ok(())
        } else {
            Err(Error("Invalid history index".to_string()))
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
