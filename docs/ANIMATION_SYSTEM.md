# Animation system

The board is a fixed-aspect image. Player pieces use percentage coordinates from `getCellCenter`. Ordinary movement advances in discrete timed steps; Motion animates between those coordinates. Dragon encounters use a transparent silhouette extracted from the original card illustration, a brief board shake, embers, and a stepwise penalty path. A ladder climb interpolates directly along the ladder's printed endpoints with a temporary gold light overlay. Ambient overlays are transparent light effects over the original Asgard and Helheim regions.

The interface respects `prefers-reduced-motion`; game timing also shortens in that mode. Audio is optional and generated with Web Audio after player interaction. Haptics use the browser vibration API where present.
