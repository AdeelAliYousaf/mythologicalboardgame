import type { AIDifficulty, GameState, Player } from '../engine/game';
import type { Hero } from '../rules/boardConfig';

export type MoveEvaluation = {
  die: number;
  destination: number;
  finalDestination: number;
  progress: number;
  exactLadder: number;
  passedLadders: number[];
  dragon: number | null;
  heroEvent: Hero | null;
  victory: boolean;
  danger: number;
  resourceCost: number;
  score: number;
};

export type AIAction =
  | { type: 'roll' }
  | { type: 'choose'; index: 0 | 1 }
  | { type: 'reroll' }
  | { type: 'ladder-fate' }
  | { type: 'dragon-fate' | 'dragon-frexia' | 'dragon-face'; targetId?: number }
  | { type: 'claim-hero' }
  | { type: 'thor'; targetId: number; hero: Hero };

export type AIConfig = { difficulty: AIDifficulty; player: Player; state: GameState };
