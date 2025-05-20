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
    /// Rotation of the picture in degrees.
    rotate: f64,
}

impl ImageInsertion {
    pub fn new(base64: &str, point: Point, scale: Point, rotate: f64) -> Self {
        ImageInsertion {
            base64: String::from(base64),
            point,
            scale,
            rotate,
        }
    }
}
