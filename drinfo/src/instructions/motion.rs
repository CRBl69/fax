use serde::{Deserialize, Serialize};

use crate::Point;

/// A motion instruction.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Motion {
    /// The point where the first point of the selection ends up.
    pub end: Point,
    /// The polygon defining the selection to move, as a sequence of at least 3 points.
    ///
    /// Joining all the points represents the selected part that is going to be moved.
    /// The first point is also the start point of the motion.
    pub selection: Vec<Point>,
    /// The X and Y scale of the moved area. Defaults to (1, 1).
    #[serde(default = "default_scale")]
    pub scale: Point,
    /// Rotation of the moved area. `rotate / u32::MAX * 360` = rotation in degrees. Defaults to 0.
    #[serde(default)]
    pub rotate: u32,
}

fn default_scale() -> Point {
    Point { x: 1.0, y: 1.0 }
}

impl Motion {
    pub fn new(end: Point, selection: Vec<Point>, scale: Point, rotate: u32) -> Self {
        Motion { end, selection, scale, rotate }
    }
}

impl Default for Motion {
    fn default() -> Self {
        Motion {
            end: Point { x: 0.0, y: 0.0 },
            selection: vec![],
            scale: Point { x: 1.0, y: 1.0 },
            rotate: 0,
        }
    }
}
