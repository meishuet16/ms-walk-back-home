export function inAnyRect(point, rects) {
    return rects.some((rect) => point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h);
}
export function blocked(point, blockers) {
    return inAnyRect(point, blockers);
}
