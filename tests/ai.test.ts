import { describe, expect, it } from 'vitest';
import { chooseDie, shouldIgnoreDragon, shouldReroll } from '../src/game/ai/aiController';
import { evaluateMove } from '../src/game/ai/evaluateMove';
import { newGame, roll } from '../src/game/engine/game';

describe('AI strategy', () => {
  it('chooses a smaller die when it lands on an exact ladder', () => {
    const state = newGame([{ name: 'Bot', controller: 'ai' }, 'Human']);
    state.players[0].position = 5;
    expect(chooseDie(state, [3, 4])).toBe(0);
    expect(evaluateMove(state, 0, 3).finalDestination).toBe(34);
  });

  it('prioritizes an immediate exact victory', () => {
    const state = newGame([{ name: 'Bot', controller: 'ai' }, 'Human']);
    state.players[0].position = 98;
    expect(chooseDie(state, [2, 6])).toBe(0);
  });

  it('does not spend the last Fate on weak choices', () => {
    const state = newGame([{ name: 'Bot', controller: 'ai' }, 'Human']);
    state.players[0].fate = 1;
    state.dice = [1, 2];
    state.phase = 'choose';
    expect(shouldReroll(state, [1, 2])).toBe(false);
  });

  it('uses an escape resource for a severe dragon encounter', () => {
    const state = newGame([{ name: 'Bot', controller: 'ai' }, 'Human']);
    state.players[0].position = 86;
    state.phase = 'dragon';
    state.encounter = 0;
    state.players[0].heroes = ['frexia'];
    expect(shouldIgnoreDragon(state)).toBe('frexia');
  });

  it('keeps AI decisions on the production engine path', () => {
    const state = newGame([{ name: 'Bot', controller: 'ai' }, 'Human']);
    const next = roll(state, [3, 4]);
    expect(next.players[0].position).toBe(1);
    expect(next.phase).toBe('choose');
  });
});
