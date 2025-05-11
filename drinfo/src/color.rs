use serde::{Deserialize, Serialize};

/// An RGBA color.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Color {
    /// The amount of red.
    pub r: u8,
    /// The amount of green.
    pub g: u8,
    /// The amount of blue.
    pub b: u8,
    /// The alpha (0 is transparent, 255 is opaque).
    pub a: u8,
}

impl Default for Color {
    fn default() -> Self {
        Color {
            r: 0,
            g: 0,
            b: 0,
            a: 255,
        }
    }
}
