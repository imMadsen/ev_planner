// https://www.webmatematik.dk/lektioner/matematik-b/geometri/distanceformlen
export function distance_point_to_line_segment(x: number, y: number, lx1: number, ly1: number, lx2: number, ly2: number) {
    const dx = lx2 - lx1;
    const dy = ly2 - ly1;
    const l2 = dx * dx + dy * dy; // squared length of the line segment

    if (l2 === 0) {
        // If the line segment has zero length (the start and end points are the same),
        // calculate the distance to one of the endpoints instead.
        return Math.sqrt((x - lx1) * (x - lx1) + (y - ly1) * (y - ly1));
    }

    // Calculate the parameterized position of the projection along the line segment
    const t = Math.max(0, Math.min(1, ((x - lx1) * dx + (y - ly1) * dy) / l2));

    // Calculate the coordinates of the projected point
    const px = lx1 + t * dx;
    const py = ly1 + t * dy;

    // Calculate the distance between the original point and the projected point
    const distance = Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));

    return distance;
}

export function distance_point_to_line_segment_km(x: number, y: number, lx1: number, ly1: number, lx2: number, ly2: number) {
    return distance_point_to_line_segment(x, y, lx1, ly1, lx2, ly2) * 113.32;
}