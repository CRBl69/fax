use std::collections::hash_map::HashMap;

use serde::{Deserialize, Serialize};

use crate::{Layer, InstructionBox, Error};

/// A drawing representation as a list of instructions executed on different layers.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Drawing {
    layers: HashMap<String, Layer>,
    layer_order: Vec<String>,
    width: u32,
    height: u32,
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
    pub fn add_layer(&mut self, name: &str) -> Result<(), Error> {
        if !self.layers.contains_key(name) {
            self.layers
                .insert(name.to_string(), Layer::new());
            self.layer_order.push(name.to_string());
            Ok(())
        } else {
            Err(Error("Layer already exists".to_string()))
        }
    }

    /// Moves the given layer one time upwards in the layer order.
    pub fn layer_up(&mut self, name: &str) -> Result<(), Error> {
        if let Some(index) = self.layer_order.iter().position(|e| e == name) {
            if index < self.layer_order.len() && index > 0 {
                let n2 = self.layer_order[index-1].to_string();
                self.layer_order[index-1] = name.to_string();
                self.layer_order[index] = n2;
                Ok(())
            } else {
                Err(Error("Layer cannot be moved up, already at the top.".to_string()))
            }
        } else {
            Err(Error("Layer not found.".to_string()))
        }
    }

    /// Moves the given layer one time downwards in the layer order.
    pub fn layer_down(&mut self, name: &str) -> Result<(), Error> {
        if let Some(index) = self.layer_order.iter().position(|e| e == name) {
            if index < self.layer_order.len() - 1 {
                let n2 = self.layer_order[index+1].to_string();
                self.layer_order[index+1] = name.to_string();
                self.layer_order[index] = n2;
                Ok(())
            } else {
                Err(Error("Layer cannot be moved down, already at the bottom.".to_string()))
            }
        } else {
            Err(Error("Layer not found.".to_string()))
        }
    }

    /// Moves the given layer multiple times upwards in the layer order.
    pub fn layer_up_by(&mut self, name: &str, by: usize) -> Result<(), Error> {
        if let Some(index) = self.layer_order.iter().position(|e| e == name) {
            if index + by < self.layer_order.len() {
                let layer = self.layer_order.remove(index);
                self.layer_order.insert(index + by, layer);
                Ok(())
            } else {
                Err(Error("Layer cannot be moved up this much.".to_string()))
            }
        } else {
            Err(Error("Layer not found.".to_string()))
        }
    }

    /// Moves the given layer multiple times downwards in the layer order.
    pub fn layer_down_by(&mut self, name: &str, by: usize) -> Result<(), Error> {
        if let Some(index) = self.layer_order.iter().position(|e| e == name) {
            if index >= by {
                let layer = self.layer_order.remove(index);
                self.layer_order.insert(index - by, layer);
                Ok(())
            } else {
                Err(Error("Layer cannot be moved down this much.".to_string()))
            }
        } else {
            Err(Error("Layer not found.".to_string()))
        }
    }

    /// Applies the given instruction to the given layer
    pub fn instruct(&mut self, instruction: InstructionBox, layer_name: &str) -> Result<(), Error> {
        let layer = self.layers.get_mut(layer_name);
        if let Some(l) = layer {
            l.instruct(instruction)
        } else {
            Err(Error("Layer not found.".to_string()))
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

    /// Returns a mutable reference to the given layer.
    pub fn get_layer_mut(&mut self, layer_name: &str) -> Option<&mut Layer> {
        self.layers.get_mut(layer_name)
    }
}
