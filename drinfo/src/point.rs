use serde::{Deserialize, Serialize};

/// A point in a 2D space.
#[derive(Default, Serialize, Deserialize, Debug, Clone)]
pub struct Point {
    pub x: f32,
    pub y: f32,
}

impl Point {
    pub fn new(x: f32, y: f32) -> Point {
        Point { x, y }
    }
}
