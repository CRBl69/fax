use serde::{Deserialize, Serialize};

use crate::Point;

/// A motion instruction.
#[derive(Serialize, Deserialize, Default, Debug, Clone)]
pub struct Motion {
    /// The point where the first point of the selection ends up.
    pub end: Point,
    /// The polygon defining the selection to move, as a sequence of at least 3 points.
    ///
    /// Joining all the points represents the selected part that is going to be moved.
    /// The first point is also the start point of the motion.
    pub selection: Vec<Point>,
}

impl Motion {
    pub fn new(end: Point, selection: Vec<Point>) -> Self {
        Motion { end, selection }
    }
}
