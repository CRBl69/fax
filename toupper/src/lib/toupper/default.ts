import type { Brush } from "$lib/drinfo";

export const getDefaultBrush = (): Brush => ({
  color: "#000",
  width: 10,
  diffusion: 0,
  brushShape: {
    shape: "circle",
  },
  erase: false
});
