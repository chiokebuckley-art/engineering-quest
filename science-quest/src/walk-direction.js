// Camera offset points from the player toward the viewer. Forward points away
// from the viewer; right is perpendicular to it on the horizontal plane.
export function walkDirection(cameraX, cameraZ, sideways, forward) {
  const length = Math.hypot(cameraX, cameraZ) || 1;
  const x = cameraX / length, z = cameraZ / length;
  const inputLength = Math.max(1, Math.hypot(sideways, forward));
  return { x: (z * sideways - x * forward) / inputLength,
    z: (-x * sideways - z * forward) / inputLength };
}
