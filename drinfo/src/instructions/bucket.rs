use serde::{Deserialize, Serialize};

use crate::{Brush, Point};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Bucket {
    point: Point,
    brush: Brush,
}

impl Bucket {
    pub fn new(point: Point, brush: Brush) -> Self {
        Bucket { point, brush }
    }
}
