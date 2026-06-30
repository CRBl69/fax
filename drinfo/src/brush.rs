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
    ///
    /// [`u32::MAX`] is 1 and 0 is 0.
    pub hardness: u32,
    /// The opacity of the brush.
    ///
    /// [`u32::MAX`] is 1 and 0 is 0.
    pub opacity: u32,
    /// Wether to erase or not.
    pub erase: bool,
    /// How often to repeat the brush, relative to the brush `width`.
    ///
    /// If `repeat` is [`u32::MAX`], repeat once every `width` pixels.
    /// If `repeat` is `1`, repeat once every `1/width` pixels.
    /// Can't be 0.
    pub repeat: u32,
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
            repeat: 2,
        }
    }
}

impl Brush {
    /// Creates a new brush initiated with the properties passed to the function.
    pub fn new(
        brush_shape: BrushShape,
        color: Color,
        width: f32,
        hardness: u32,
        opacity: u32,
        erase: bool,
        repeat: u32,
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
    pub fn set_hardness(&mut self, hardness: u32) {
        self.hardness = hardness;
    }

    /// Updates the opacity of the brush.
    pub fn set_opacity(&mut self, opacity: u32) {
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
    pub fn set_repeat(&mut self, repeat: u32) {
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
