use serde::{Deserialize, Serialize};

use crate::{Color, Point};

/// The data structure that holds information about how to draw a stroke.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Brush {
    /// The shape of the brush.
    pub brush_shape: BrushShape,
    /// The color of the brush.
    pub color: Color,
    /// The width of the brush (diameter).
    pub width: f32,
    /// The hardness of the brush.
    pub hardness: u64,
    /// The opacity of the brush.
    pub opacity: u64,
    /// Wether to erase or not.
    pub erase: bool,
    /// How often to repeat the brush.
    pub repeat: f64,
}

impl Default for Brush {
    fn default() -> Self {
        Brush {
            brush_shape: BrushShape::Circle,
            color: Color::default(),
            width: 1.0,
            hardness: 0,
            opacity: 100_000,
            erase: false,
            repeat: 0.02,
        }
    }
}

impl Brush {
    /// Creates a new brush initiated with the properties passed to the function.
    pub fn new(
        brush_shape: BrushShape,
        color: Color,
        width: f32,
        hardness: u64,
        opacity: u64,
        erase: bool,
        repeat: f64,
    ) -> Self {
        Brush {
            brush_shape,
            color,
            width,
            hardness,
            opacity,
            erase,
            repeat,
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

    /// Updates the opacity of the brush.
    pub fn set_hardness(&mut self, hardness: u64) {
        self.hardness = hardness;
    }

    /// Updates the opacity of the brush.
    pub fn set_opacity(&mut self, opacity: u64) {
        self.opacity = opacity;
    }

    /// Updates the opacity of the brush.
    pub fn set_erase(&mut self, erase: bool) {
        self.erase = erase;
    }

    /// Updates the shape of the brush.
    pub fn set_brush_shape(&mut self, brush_shape: BrushShape) {
        self.brush_shape = brush_shape;
    }

    /// Updates the repeat of the brush.
    pub fn set_repeat(&mut self, repeat: f64) {
        self.repeat = repeat;
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum BrushShape {
    /// A circle.
    Circle,
    /// A square.
    Square,
    /// A custom shape.
    Custom(CustomBrush),
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
