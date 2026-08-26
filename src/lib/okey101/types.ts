// 101 Okey'e ozel tip tanimlari. Fiziksel tas/joker/renk temelleri
// `@/lib/okey/engine`'den reuse edilir (OkeyTile, OkeyColor) — burada
// sadece 101'e ozgu oyun durumu ve kurallar modellenir.
import type { OkeyTile } from '@/lib/okey/engine';

export type Okey101Meld = {
  id: string;
  tiles: OkeyTile[];
  kind: 'run' | 'group';
  ownerId: string;
};

export type Okey101PlayerState = {
  id: string;
  name: string;
  c1: string;
  c2: string;
  rack: OkeyTile[];
  hasOpened: boolean;
  score: number;
  connected: boolean;
};

// Doc'un istedigi acik state machine — rastgele booleanlar yerine.
export type Okey101Phase =
  | 'WAITING_FOR_PLAYERS'
  | 'DEALING'
  | 'TURN_DRAW'
  | 'TURN_ACTION'
  | 'TURN_DISCARD'
  | 'ROUND_FINISHED'
  | 'GAME_FINISHED';

export type Okey101RoundResult = {
  playerId: string;
  opened: boolean;
  scoreDelta: number;
  finishedHand: boolean;
  finishedWithOkey: boolean;
};

export type Okey101GameState = {
  phase: Okey101Phase;
  rules: Okey101Rules;
  players: Okey101PlayerState[];
  currentPlayerIndex: number;
  drawPile: OkeyTile[];
  discardPile: OkeyTile[];
  indicator: OkeyTile | null;
  tableMelds: Okey101Meld[];
  pendingMelds: Okey101Meld[];
  selectedRackIds: string[];
  roundNumber: number;
  winnerId: string | null;
  lastRoundResults: Okey101RoundResult[] | null;
  /** Ag/backend eklendiginde stale event korumasi icin kullanilacak siralama numarasi. */
  version: number;
};

// Doc'taki "DO NOT invent unclear scoring rules silently" gereksinimi:
// birden fazla yaygin varyanti olan her kural burada acik bir alan
// olarak modellenir, koda gomulu bir varsayim olarak degil.
export interface Okey101Rules {
  /** Acilis icin gereken minimum toplam puan. Klasik kurada 101. */
  openingScore: number;
  /** Bazi masa kurallarinda elde 7 cift varsa ayri bir acilis/bitis yolu vardir (standart Okey'e ozgu). 101'de varsayilan olarak kapali. */
  allowPairsOpening: boolean;
  pairsRequired: number;
  /** Joker, tasidigi sayinin degeriyle acilis toplamina sayilir mi. Yaygin kurallarda evet. */
  allowJokerInOpening: boolean;
  /** Acilmadan once baskasinin perdesine taci eklemeye izin var mi. Standart kurada hayir. */
  allowAddingBeforeOpening: boolean;
  /** Acildiktan sonra masadaki perdeleri yeniden duzenlemeye (bol/birlestir) izin var mi. */
  allowManipulatingTableMelds: boolean;
  /** "Katlamali" varyant: bazi online kurallarda round sonunda puan katlanir. Belirsiz/opsiyonel, varsayilan kapali. */
  foldedOpening: boolean;
  /** Elini normal tasla bitiren oyuncuya ekstra bonus. Klasik masa oyununda yok, bazi online varyantlarda var. */
  handFinishBonus: boolean;
  /** Elini gercek Okey tasiyla bitiren oyuncuya ekstra bonus (yaygin varyant). */
  okeyFinishBonus: boolean;
}

export const DEFAULT_OKEY101_RULES: Okey101Rules = {
  openingScore: 101,
  allowPairsOpening: false,
  pairsRequired: 7,
  allowJokerInOpening: true,
  allowAddingBeforeOpening: false,
  allowManipulatingTableMelds: false,
  foldedOpening: false,
  handFinishBonus: false,
  okeyFinishBonus: false,
};

export type Okey101RuleVariant = 'normal101' | 'katlamali' | 'esli' | 'ciftAcma' | 'custom';

export const OKEY101_RULE_PRESETS: Record<Okey101RuleVariant, Okey101Rules> = {
  normal101: DEFAULT_OKEY101_RULES,
  katlamali: { ...DEFAULT_OKEY101_RULES, foldedOpening: true },
  esli: { ...DEFAULT_OKEY101_RULES, allowPairsOpening: true },
  ciftAcma: { ...DEFAULT_OKEY101_RULES, allowAddingBeforeOpening: true },
  custom: DEFAULT_OKEY101_RULES,
};
