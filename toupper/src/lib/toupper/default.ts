import type { Brush } from "$lib/drinfo";

export const getDefaultBrush = (): Brush => ({
  color: "#000000",
  width: 10,
  diffusion: 0,
  brushShape: {
    shape: "circle",
  },
  opacity: 100000,
  erase: false,
});

export const getSecondaryDefaultBrush = (): Brush => ({
  ...getDefaultBrush(),
  color: "#ffffff",
});
