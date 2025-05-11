import type { Brush, Point } from "$lib/drinfo"

export type Cursor = {
    brush: Brush,
    point: Point,
};

export type User = {
    name: string,
    cursor?: Cursor,
};

export type Dimensions = {
    width: number,
    height: number,
};
