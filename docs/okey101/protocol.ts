/** Starter contracts, not an implemented engine. Runtime schemas must mirror these. */
export type Color = 'RED' | 'BLUE' | 'BLACK' | 'YELLOW';
export type TileId = string;
export type Face = { color: Color; value: number }; // runtime integer 1..13
export type Tile = { id: TileId; kind: 'NUMBER'; face: Face; copy: 1 | 2 }
  | { id: TileId; kind: 'FALSE_JOKER'; copy: 1 | 2 };
export type Assignment = { tileId: TileId; represents: Face };
export type MeldInput = { kind: 'RUN' | 'SET' | 'PAIR'; tiles: TileId[]; assignments: Assignment[] };
export type OpeningStatus = 'UNOPENED' | 'SERIES' | 'PAIRS';
export type TableStep =
  | { type: 'OPEN'; mode: 'SERIES' | 'PAIRS'; melds: MeldInput[] }
  | { type: 'ADD_MELDS'; melds: MeldInput[] }
  | { type: 'EXTEND'; meldId: string; tiles: TileId[]; assignments: Assignment[] }
  | { type: 'REPLACE_JOKER'; meldId: string; jokerId: TileId; replacementId: TileId };
export type Action =
  | { type: 'DRAW_STOCK' }
  | { type: 'TAKE_DISCARD_AND_PLAY'; discardTileId: TileId; steps: TableStep[] }
  | { type: 'PLAY_STEPS'; steps: TableStep[] }
  | { type: 'COMMIT_TURN'; steps: TableStep[]; discardTileId: TileId };
export type Command = { gameId: string; requestId: string; expectedVersion: number; action: Action };
export type ScoreBreakdown = {
  handBase: number; finishMultiplier: number; heldJoker: number;
  actionPenalties: number; total: number;
};
export type PublicMeld = MeldInput & { id: string; ownerSeat: number };
export type PublicState = {
  gameId: string; version: number; rulesHash: string; round: number;
  status: 'LOBBY' | 'ACTIVE' | 'ROUND_ENDED' | 'ABORTED_DISCONNECT' | 'MATCH_ENDED';
  seats: { seat: number; userId: string; tileCount: number; opening: OpeningStatus; connected: boolean }[];
  indicator: Tile; table: PublicMeld[];
  discards: { seat: number; tiles: Tile[] }[];
  stockCount: number; currentSeat: number;
  phase: 'AWAIT_DRAW' | 'AWAIT_PLAY'; deadlineUtc: string;
  openingPointsRequired: number; openingPairsRequired: number;
  scores: { seat: number; breakdown: ScoreBreakdown }[];
};
export type PrivateState = { seat: number; hand: Tile[]; drawnTileId: TileId | null; sessionEpoch: number };
export type Snapshot = { public: PublicState; own: PrivateState };
export type ErrorCode = 'UNAUTHORIZED' | 'NOT_ROOM_MEMBER' | 'NOT_YOUR_TURN'
  | 'STALE_VERSION' | 'REQUEST_ID_REUSE' | 'SESSION_REPLACED'
  | 'INVALID_PHASE' | 'TILE_NOT_OWNED' | 'DUPLICATE_TILE'
  | 'INVALID_MELD' | 'OPENING_TOO_LOW' | 'OPENING_MODE_LOCKED'
  | 'NOT_OPENED' | 'INVALID_DISCARD_PICKUP' | 'MUST_LEAVE_DISCARD'
  | 'STOCK_EMPTY' | 'ROUND_ENDED' | 'RULE_NOT_SPECIFIED';
export type Ack = { requestId: string; ok: true; committedVersion: number }
  | { requestId: string; ok: false; error: ErrorCode; currentVersion?: number };

// FullState is server-only, never extends a client snapshot and never serialized to users.
// Actor identity, currentTime, random deck and timeout actions are trusted engine inputs.
// Implement public projection as an explicit allow-list, never spreading FullState.
