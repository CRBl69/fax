use serde::{Deserialize, Serialize};

use crate::Point;

/// An image insertion instruction.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ImageInsertion {
    /// The base64 representation of the image to insert.
    base64: String,
    /// The coordinates where to insert the image.
    point: Point,
    /// The X and Y scale of the image.
    scale: Point,
    /// Rotation of the picture. `rotate / u32::MAX * 360` = rotation in degrees
    rotate: u32,
}

impl ImageInsertion {
    pub fn new(base64: &str, point: Point, scale: Point, rotate: u32) -> Self {
        ImageInsertion {
            base64: String::from(base64),
            point,
            scale,
            rotate,
        }
    }
}
