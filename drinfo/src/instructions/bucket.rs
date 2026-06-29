use serde::{Deserialize, Serialize};

use crate::{Brush, Point};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Bucket {
    point: Point,
    brush: Brush,
    tolerance: f64,
}

impl Bucket {
    pub fn new(point: Point, brush: Brush, tolerance: f64) -> Self {
        Bucket { point, brush, tolerance }
    }
}
