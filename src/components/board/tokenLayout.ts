// Offsets are fractions of token diameter, relative to a canonical cell center.
// Every arrangement has a zero centroid; one token has no displacement.
export function getTokenClusterOffsets(count: number) {
  if (count <= 1) return [{ x: 0, y: 0 }];
  if (count === 2) return [{ x: -.6, y: 0 }, { x: .6, y: 0 }];
  if (count === 3) return [{ x: 0, y: -.7 }, { x: -.6, y: .35 }, { x: .6, y: .35 }];
  return [{ x: -.6, y: -.6 }, { x: .6, y: -.6 }, { x: -.6, y: .6 }, { x: .6, y: .6 }];
}
