use serde::{Deserialize, Serialize};

use crate::Point;

/// An image insertion instruction.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ImageInsertion {
    /// The base64 representation of the image to insert.
    base64: String,
    /// The coordinates where to insert the image.
    position: Point,
}

impl ImageInsertion {
    pub fn new(base64: &str, point: Point) -> Self {
        ImageInsertion {
            base64: String::from(base64),
            position: point
        }
    }
}
