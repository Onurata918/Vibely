// Color Clash — orijinal Vibely renk/sayı eşleştirme kart oyunu motoru.
// Marka/görsel olarak UNO'dan bağımsız: kendi renk paleti, kendi kart
// isimlendirmesi. Kurallar tanıdık ("familiar color/number matching"),
// kimlik özgün.

export type ClashColor = 'coral' | 'violet' | 'teal' | 'amber';
export type ClashCardKind = 'number' | 'skip' | 'reverse' | 'drawTwo' | 'wild' | 'drawFour';

export type ClashCard = {
  id: string;
  kind: ClashCardKind;
  color?: ClashColor; // number/skip/reverse/drawTwo icin dolu; wild/drawFour icin bos (oynanana kadar)
  value?: number; // sadece kind==='number' icin (0-9)
};

export const CLASH_COLORS: readonly ClashColor[] = ['coral', 'violet', 'teal', 'amber'];

export const CLASH_COLOR_HEX: Record<ClashColor, string> = {
  coral: '#fb5f77',
  violet: '#8b5cf6',
  teal: '#22c7b0',
  amber: '#f5a524',
};

// Erisilebilirlik: renge ek olarak sembol (renk-korlugu olan kullanicilar icin).
export const CLASH_COLOR_SYMBOL: Record<ClashColor, string> = {
  coral: '●',
  violet: '◆',
  teal: '▲',
  amber: '■',
};

export type ClashPhase =
  | 'lobby'
  | 'dealing'
  | 'turnStart'
  | 'awaitingPlay'
  | 'awaitingDraw'
  | 'choosingColor'
  | 'awaitingChallenge'
  | 'roundFinished'
  | 'matchFinished';

export type ClashPlayerState = {
  id: string;
  name: string;
  c1: string;
  c2: string;
  hand: ClashCard[];
  connected: boolean;
  score: number;
  declaredLastCard: boolean;
  team: 'A' | 'B' | null;
};

// Doc'un "Do not invent unclear scoring rules silently" gereksinimi: her
// varyasyonlu kural acik bir alan olarak modellenir.
export interface ClashRules {
  startingHandSize: number;
  /** Aksiyon kartlari ust uste yigilabilir mi (ornek: DrawTwo uzerine DrawTwo). */
  stacking: boolean;
  /** 7 oynayinca el degistirme, 0 oynayinca tum eller rotasyonu (opsiyonel parti kurali). */
  sevenZero: boolean;
  /** Cekilen kart hemen oynanabilir durumdaysa otomatik oynansin mi. */
  forcePlay: boolean;
  /** Draw Four sonrasi itiraz (challenge) hakki var mi. */
  drawFourChallenge: boolean;
  /** Elde 2 kart kalinca "LAST CARD" bildirimi zorunlu mu (zorunlu degilse baskasi yakalayamaz). */
  lastCardCallRequired: boolean;
  /** Bildirmeyi unutup yakalanan oyuncunun cekecegi ceza kart sayisi. */
  lastCardPenalty: number;
  turnTimerSeconds: number | null;
  twoVsTwo: boolean;
}

export const DEFAULT_CLASH_RULES: ClashRules = {
  startingHandSize: 7,
  stacking: false,
  sevenZero: false,
  forcePlay: false,
  drawFourChallenge: true,
  lastCardCallRequired: true,
  lastCardPenalty: 2,
  turnTimerSeconds: null,
  twoVsTwo: false,
};

export type ClashDirection = 1 | -1;

export type ClashGameState = {
  phase: ClashPhase;
  rules: ClashRules;
  players: ClashPlayerState[];
  currentPlayerIndex: number;
  direction: ClashDirection;
  drawPile: ClashCard[];
  discardPile: ClashCard[];
  activeColor: ClashColor | null;
  /** Renk secimi bekleyen bir wild/drawFour oynandiysa, secim tamamlanana kadar bu true kalir. */
  pendingWildCardId: string | null;
  /** Stacking acikken birikmis cekme cezasi. */
  pendingDrawPenalty: number;
  hasDrawnThisTurn: boolean;
  /** Draw Four itiraz penceresi acikken: kime ait, hangi karti kim oynadi. */
  challenge: { challengerId: string; accusedId: string; card: ClashCard; colorBeforeCard: ClashColor } | null;
  /** "LAST CARD" bildirme penceresi acikken hangi oyuncunun elinde 1 kart kaldi. */
  pendingDeclareId: string | null;
  /** Bildirmeyi unutan ama henuz yakalanmamis oyuncu (baskasi yakalayabilir). */
  catchableId: string | null;
  roundNumber: number;
  winnerId: string | null;
  winningTeam: 'A' | 'B' | null;
  lastRoundHandCounts: Record<string, number> | null;
  lastRoundScore: number | null;
  lastMessage: string | null;
  version: number;
};
