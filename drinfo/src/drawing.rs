use std::collections::hash_map::HashMap;

use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::{layer::LayerError, InstructionBox, Layer};

/// A drawing representation as a list of instructions executed on different layers.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Drawing {
    layers: HashMap<String, Layer>,
    layer_order: Vec<String>,
    width: u32,
    height: u32,
}

#[derive(Error, Debug)]
pub enum DrawingError {
    #[error("could not find layer {0}")]
    LayerNotFound(String),
    #[error("layer {0} already exists")]
    LayerAlreadyExists(String),
    #[error("layer {0} cannot be moved up because it is already at the top")]
    LayerTop(String),
    #[error("layer {0} cannot be moved down because it is already at the bottom")]
    LayerBottom(String),
    #[error("layer error: {0}")]
    LayerError(#[from] LayerError),
}

impl Default for Drawing {
    fn default() -> Drawing {
        Drawing::new(500, 500)
    }
}

impl Drawing {
    /// Creates a new drawing with the given dimensions.
    pub fn new(height: u32, width: u32) -> Self {
        let layers = HashMap::new();
        Drawing {
            layers,
            width,
            height,
            layer_order: vec![],
        }
    }

    /// Adds a new layer with the given name.
    ///
    /// Since names are used as identifiers, they must be
    /// uniqe and this function will fail if another layer
    /// with a similar name already exists.
    pub fn add_layer(&mut self, name: String) -> Result<(), DrawingError> {
        if !self.layers.contains_key(&name) {
            self.layers.insert(name.clone(), Layer::new());
            self.layer_order.push(name);
            Ok(())
        } else {
            Err(DrawingError::LayerAlreadyExists(name))
        }
    }

    /// Moves the given layer one time upwards in the layer order.
    pub fn layer_up(&mut self, name: &str) -> Result<(), DrawingError> {
        if let Some(index) = self.layer_order.iter().position(|e| e == name) {
            if index < self.layer_order.len() && index > 0 {
                self.layer_order.swap(index - 1, index);
                Ok(())
            } else {
                Err(DrawingError::LayerTop(name.to_string()))
            }
        } else {
            Err(DrawingError::LayerNotFound(name.to_string()))
        }
    }

    /// Moves the given layer one time downwards in the layer order.
    pub fn layer_down(&mut self, name: &str) -> Result<(), DrawingError> {
        if let Some(index) = self.layer_order.iter().position(|e| e == name) {
            if index < self.layer_order.len() - 1 {
                let n2 = self.layer_order[index + 1].to_string();
                self.layer_order[index + 1] = name.to_string();
                self.layer_order[index] = n2;
                Ok(())
            } else {
                Err(DrawingError::LayerBottom(name.to_string()))
            }
        } else {
            Err(DrawingError::LayerNotFound(name.to_string()))
        }
    }

    /// Returns the width of the drawing.
    pub fn width(&self) -> u32 {
        self.width
    }

    /// Returns the height of the drawing.
    pub fn height(&self) -> u32 {
        self.height
    }

    /// Applies the given instruction to the given layer..
    pub fn instruct(
        &mut self,
        layer_name: &str,
        instruction: InstructionBox,
    ) -> Result<(), DrawingError> {
        let layer = self.layers.get_mut(layer_name);
        if let Some(l) = layer {
            l.instruct(instruction)?;
            Ok(())
        } else {
            Err(DrawingError::LayerNotFound(layer_name.to_string()))
        }
    }

    /// Clears the given layer.
    ///
    /// The layer is cleared by removing the history. You cannot undo this.
    pub fn clear(&mut self, layer_name: &str) -> Result<(), DrawingError> {
        let layer = self.layers.get_mut(layer_name);
        if let Some(l) = layer {
            l.clear();
            Ok(())
        } else {
            Err(DrawingError::LayerNotFound(layer_name.to_string()))
        }
    }

    /// Set the visibility of the given layer.
    pub fn set_visibility(&mut self, layer_name: &str, visible: bool) -> Result<(), DrawingError> {
        let layer = self.layers.get_mut(layer_name);
        if let Some(l) = layer {
            l.set_visibility(visible);
            Ok(())
        } else {
            Err(DrawingError::LayerNotFound(layer_name.to_string()))
        }
    }

    /// Set the visibility of an instruction in the history of the given layer.
    pub fn set_history_element_visibility(
        &mut self,
        layer_name: &str,
        index: usize,
        visible: bool,
    ) -> Result<(), DrawingError> {
        let layer = self.layers.get_mut(layer_name);
        if let Some(l) = layer {
            l.set_history_element_visibility(index, visible)?;
            Ok(())
        } else {
            Err(DrawingError::LayerNotFound(layer_name.to_string()))
        }
    }

    /// Saves the given image as a snapshot of the given history index for the given layer.
    pub fn snapshot(
        &mut self,
        layer_name: &str,
        index: usize,
        data: String,
    ) -> Result<(), DrawingError> {
        let layer = self.layers.get_mut(layer_name);
        if let Some(l) = layer {
            l.snapshot(index, data);
            Ok(())
        } else {
            Err(DrawingError::LayerNotFound(layer_name.to_string()))
        }
    }

    /// Truncates the history of the given layer before this index.
    pub fn truncate(&mut self, layer_name: &str, index: usize) -> Result<(), DrawingError> {
        let layer = self.layers.get_mut(layer_name);
        if let Some(l) = layer {
            l.truncate(index)?;
            Ok(())
        } else {
            Err(DrawingError::LayerNotFound(layer_name.to_string()))
        }
    }

    /// Undo an action in the given layer.
    pub fn undo(&mut self, layer_name: &str) -> Result<(), DrawingError> {
        let layer = self.layers.get_mut(layer_name);
        if let Some(l) = layer {
            l.undo()?;
            Ok(())
        } else {
            Err(DrawingError::LayerNotFound(layer_name.to_string()))
        }
    }

    /// Redo an action in the given layer.
    pub fn redo(&mut self, layer_name: &str) -> Result<(), DrawingError> {
        let layer = self.layers.get_mut(layer_name);
        if let Some(l) = layer {
            l.redo()?;
            Ok(())
        } else {
            Err(DrawingError::LayerNotFound(layer_name.to_string()))
        }
    }
}
