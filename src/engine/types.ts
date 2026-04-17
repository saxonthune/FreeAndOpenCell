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

export function cardId(c: Card): string {
  return c.id;
}

export function parseCardId(id: string): Card {
  if (!/^[HDCS]\d{1,2}$/.test(id)) throw new Error(`Invalid card id: ${id}`);
  const suit = id[0] as Suit;
  const rank = Number.parseInt(id.slice(1), 10) as Rank;
  if (rank < 1 || rank > 13) throw new Error(`Invalid rank in card id: ${id}`);
  return { suit, rank, id };
}
