use serde::{Deserialize, Serialize};

use crate::{Point, Color};

/// The data structure that holds information about how to draw a stroke.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Brush {
    /// The shape of the brush.
    pub brush_shape: BrushShape,
    /// The color of the brush.
    pub color: Color,
    /// The width of the brush (diameter).
    pub width: f32,
    /// The diffusion of the brush.
    pub diffusion: u64,
    /// Wether to erase or not.
    pub erase: bool,
}

impl Default for Brush {
    fn default() -> Self {
        Brush {
            brush_shape: BrushShape::Circle,
            color: Color::default(),
            width: 1.0,
            diffusion: 0,
            erase: false,
        }
    }
}

impl Brush {
    /// Creates a new brush initiated with the properties passed to the function.
    pub fn new(brush_shape: BrushShape, color: Color, width: f32, diffusion: u64, erase: bool) -> Self {
        Brush {
            brush_shape,
            color,
            width,
            diffusion,
            erase,
        }
    }

    /// Updates the color of the brush.
    pub fn set_color(&mut self, color: Color) {
        self.color = color;
    }

    /// Updates the width of the brush.
    pub fn set_width(&mut self, width: f32) {
        self.width = width;
    }

    /// Updates the shape of the brush.
    pub fn set_brush_shape(&mut self, brush_shape: BrushShape) {
        self.brush_shape = brush_shape;
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum BrushShape {
    /// A circle.
    Circle,
    /// A square.
    Square,
    /// A custom shape.
    Custom(CustomBrush)
}

/// A custom brush shape.
/// TODO: make a more extensible custom brush.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CustomBrush {
    /// A collection of collections of points
    /// which represent shapes. The last point
    /// is linked to the first.
    points: Vec<Vec<Point>>,
}
