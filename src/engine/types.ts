export type Suit = 'H' | 'D' | 'C' | 'S';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export interface GameState {
  cascades: Card[][];
  freecells: (Card | null)[];
  foundations: Record<Suit, Rank | 0>;
  seed: number;
  moveCountLifetime: number;
}

export type Action =
  | { type: 'MOVE_STACK'; from: string; count: number; to: string }
  | { type: 'NEW_GAME'; seed?: number }
  | { type: 'RESTART_GAME' };

export type ActionError =
  | 'illegal_move'
  | 'unknown_source'
  | 'unknown_target'
  | 'game_over';

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export const cardId = (c: Card): string => c.id;
export const parseCardId = (_id: string): Card => {
  throw new Error('not implemented');
};
