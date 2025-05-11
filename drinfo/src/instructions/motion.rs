use serde::{Deserialize, Serialize};

use crate::Point;

/// A motion instruction.
#[derive(Serialize, Deserialize, Default, Debug, Clone)]
pub struct Motion {
    /// The upper left point of where the motion starts.
    pub start: Point,
    /// The upper left point of where the motion ends.
    pub end: Point,
    /// The upper left and lower right coordinates of the selection to move.
    ///
    /// Not having a selection will move the entire layer.
    pub selection: Option<(Point, Point)>,
}

impl Motion {
    pub fn with_selection(start: Point, end: Point, up_left: Point, down_right: Point) -> Self {
        Motion {
            start,
            end,
            selection: Some((up_left, down_right)),
        }
    }

    pub fn new(start: Point, end: Point) -> Self {
        Motion {
            start,
            end,
            selection: None,
        }
    }
}
