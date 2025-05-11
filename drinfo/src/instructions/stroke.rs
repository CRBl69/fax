use crate::{Brush, Point};
use serde::{Deserialize, Serialize};

/// A stroke instruction.
#[derive(Default, Serialize, Deserialize, Debug, Clone)]
pub struct Stroke {
    points: Vec<Point>,
    brush: Brush,
}

impl Stroke {
    pub fn new(points: Vec<Point>, brush: Brush) -> Self {
        Stroke { points, brush }
    }

    pub fn len(&self) -> usize {
        self.points.len()
    }

    /// Changes the stroke's brush.
    pub fn set_brush(&mut self, brush: Brush) {
        self.brush = brush;
    }

    /// Gets the stroke's brush.
    pub fn brush(&self) -> Brush {
        return self.brush.clone();
    }

    /// Adds a new point to the stroke.
    pub fn add_point(&mut self, point: Point) {
        self.points.push(point);
    }
}
