import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useLanguage } from '@/context/LanguageContext';
import { localizeName } from '@/lib/i18n/itemNames';
import { localizeDataName } from '@/lib/i18n/itemNames.data';
import { store } from '@/lib/storage';
import type {
  Account,
  CallParticipant,
  CallSession,
  CallTarget,
  ChatMessage,
  CurrentUser,
  HistoryItem,
  Person,
  RankItem,
  Room,
} from '@/lib/types';
import { DRAW_WORDS } from '@/lib/draw-data';
import { DRAW_WORDS_EN } from '@/lib/draw-data.en';
import { HEADS_UP_WORDS } from '@/lib/heads-up-data';
import { HEADS_UP_WORDS_EN } from '@/lib/heads-up-data.en';
import { TABU_CARDS, type TabuCard } from '@/lib/tabu-data';
import { TABU_CARDS_EN } from '@/lib/tabu-data.en';
import { QUIZ_QUESTIONS, type QuizQuestion } from '@/lib/quiz-data';
import { QUIZ_QUESTIONS_EN } from '@/lib/quiz-data.en';
import {
  buildOkeySet,
  canAddTileToMeld,
  canFormAllPairs,
  canPartitionIntoMelds,
  computeOkeyOf,
  isWildTile,
  OKEY_COLORS,
  shuffleTiles,
  validateMeld,
  type OkeyColor,
  type OkeyTile,
} from '@/lib/okey/engine';
import { buildDeck, cardScoreValue, isPlayable, shuffle, stepPlayerIndex, type UnoCard, type UnoColor } from '@/lib/uno-data';
import { SPY_LOCATIONS, type SpyLocation } from '@/lib/spy-data';
import { SPY_LOCATIONS_EN } from '@/lib/spy-data.en';
import { DARE_CHALLENGES, TRUTH_QUESTIONS } from '@/lib/truth-or-dare-data';
import { callDurationLabel, isMail, pad, person, shuffledIds } from '@/lib/utils';
import {
  BEST_PLAYERS_2026,
  CITIES,
  COUNTRIES,
  DRINKS,
  FOODS,
  FOOTBALLERS,
  FOOTBALLTEAMS,
  GUESTS,
  PEOPLE,
  RANK_SLOTS,
  ROOMS as INITIAL_ROOMS,
  SERIES,
  TILE_BG,
  TURKISHFOOD,
} from '@/lib/vibely-data';

// ---------------------------------------------------------------------------
// Sohbet — bot yanitlari (orijinal prototipteki chat-form davranisi)
// ---------------------------------------------------------------------------
const REPLIES = ['Aynen! 😄', 'Katılıyorum 👌', 'Hahaha 😂', 'Ben de geliyorum 🎮', 'Süper fikir 🔥', 'Bir dakika bekleyin ⏳'];
const REPLIES_EN = ["Totally! 😄", 'Agreed 👌', 'Hahaha 😂', "I'm coming too 🎮", 'Great idea 🔥', 'One sec ⏳'];
const REACTS = ['❤️', '😂', '👍', '🔥'];

function computeVkWinner(players: { alive: boolean; role: 'vampire' | 'villager' }[]): 'villagers' | 'vampires' | null {
  const aliveVampires = players.filter((p) => p.alive && p.role === 'vampire').length;
  const aliveVillagers = players.filter((p) => p.alive && p.role === 'villager').length;
  if (aliveVampires === 0) return 'villagers';
  if (aliveVampires >= aliveVillagers) return 'vampires';
  return null;
}

export type RankGameKey =
  | 'Yemek Sıralama'
  | 'Dizi Sıralama'
  | 'Ülke Sıralama'
  | 'Tüm Zamanların En İyileri'
  | '2026 En İyi Oyuncular'
  | 'Türk Yemekleri'
  | 'Takım Sıralama'
  | 'İçecek Sıralama'
  | 'Şehir Sıralama';

const RANK_POOL_MAP: Record<RankGameKey, { pool: readonly RankItem[]; title: string; emoji: string; logo: boolean }> = {
  'Yemek Sıralama': { pool: FOODS, title: 'Yemek Sıralaması', emoji: '🍔', logo: false },
  'Dizi Sıralama': { pool: SERIES, title: 'Dizi Sıralaması', emoji: '🎬', logo: true },
  'Ülke Sıralama': { pool: COUNTRIES, title: 'Ülke Sıralaması', emoji: '🌍', logo: false },
  'Tüm Zamanların En İyileri': { pool: FOOTBALLERS, title: 'Tüm Zamanların En İyileri Sıralaması', emoji: '⚽', logo: false },
  '2026 En İyi Oyuncular': { pool: BEST_PLAYERS_2026, title: '2026 En İyi Oyuncular Sıralaması', emoji: '🌟', logo: false },
  'Türk Yemekleri': { pool: TURKISHFOOD, title: 'Türk Yemekleri Sıralaması', emoji: '🇹🇷', logo: false },
  'Takım Sıralama': { pool: FOOTBALLTEAMS, title: 'Takım Sıralaması', emoji: '🏆', logo: true },
  'İçecek Sıralama': { pool: DRINKS, title: 'İçecek Sıralaması', emoji: '🥤', logo: false },
  'Şehir Sıralama': { pool: CITIES, title: 'Şehir Sıralaması', emoji: '🏙️', logo: false },
};

type SheetState = { key: string; node: React.ReactNode } | null;

export type SpyPlayer = { id: string; name: string; c1: string; c2: string };
export type SpyPhase = 'reveal' | 'discuss' | 'vote' | 'result';
export type TdMode = 'choose' | 'truth' | 'dare';

export type VkRole = 'vampire' | 'villager';
export type VkPlayer = SpyPlayer & { role: VkRole; alive: boolean };
export type VkPhase = 'reveal' | 'night' | 'night-result' | 'day-vote' | 'day-result' | 'end';
export type VkWinner = 'villagers' | 'vampires' | null;

export type DrawPhase = 'reveal' | 'drawing' | 'round-result';
export type DrawRoundResult = 'guessed' | 'timeout' | null;

export type HuPhase = 'ready' | 'playing' | 'round-result';

export type UnoPhase = 'playing' | 'color-picker' | 'uno-declare' | 'draw-four-challenge' | 'game-over';

export type TabuPhase = 'ready' | 'playing' | 'round-result';

export type QuizPhase = 'question' | 'revealed' | 'final';

export type OkeyPhase = 'draw' | 'discard' | 'game-over';
export type OkeyWinType = 'melds' | 'pairs' | null;

export type YuzBirPhase = 'draw' | 'discard' | 'game-over';
export type YuzBirRoundResult = { opened: boolean; scoreDelta: number };
export type YuzBirMeld = { id: string; tiles: OkeyTile[]; kind: 'run' | 'group'; ownerId: string; value: number };

const YUZBIR_JOKER_HAND_PENALTY = 25;

/**
 * 101 Okey el-sonu puanlamasi: kazanan -101; masaya acmis (hasOpened) ama
 * kazanamayan oyuncular elde kalan taslarin yuz degeri kadar (joker/okey
 * taslari sabit ceza degeriyle) ceza alir; hic acamayanlara sabit 202 ceza
 * yazilir (kaynak: okey101cetele.com, 101elit.com, okeydeyim.net - bkz. proje notlari).
 */
function computeYuzBirRoundResults(
  players: SpyPlayer[],
  hands: Record<string, OkeyTile[]>,
  hasOpened: Record<string, boolean>,
  winnerId: string,
  okeyOf: { color: OkeyColor; number: number } | null
): Record<string, YuzBirRoundResult> {
  const results: Record<string, YuzBirRoundResult> = { [winnerId]: { opened: true, scoreDelta: -101 } };
  players.forEach((p) => {
    if (p.id === winnerId) return;
    if (hasOpened[p.id]) {
      const hand = hands[p.id] ?? [];
      const value = hand.reduce((sum, t) => sum + (isWildTile(t, okeyOf) ? YUZBIR_JOKER_HAND_PENALTY : t.kind === 'number' ? t.number : 0), 0);
      results[p.id] = { opened: true, scoreDelta: value };
    } else {
      results[p.id] = { opened: false, scoreDelta: 202 };
    }
  });
  return results;
}


type AppContextValue = {
  // auth / hesap
  user: CurrentUser | null;
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  register: (fields: {
    username: string;
    displayName: string;
    email: string;
    password: string;
    confirm: string;
    agreed: boolean;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  socialLogin: (provider: 'Google' | 'Apple' | 'Discord') => void;
  logout: () => void;
  updateProfile: (name: string, username: string) => void;

  // ana sayfa/arkadaslar
  query: string;
  setQuery: (v: string) => void;
  fquery: string;
  setFquery: (v: string) => void;
  rooms: Room[];
  createRoom: (name: string, memberIds: string[]) => Room;
  history: HistoryItem[];
  notif: boolean;
  toggleNotif: () => void;

  // arama / cagri
  pending: CallTarget | null;
  startDial: (target: CallTarget) => void;
  cancelDial: () => void;

  // gorusme
  call: CallSession | null;
  mic: boolean;
  cam: boolean;
  front: boolean;
  share: boolean;
  locked: boolean;
  effect: string | null;
  chatOpen: boolean;
  unread: number;
  typing: string | null;
  mediaErr: string | null;
  enterCall: (target: CallTarget) => void;
  leaveCall: () => void;
  toggleMic: () => void;
  toggleCam: () => void;
  flipCamera: () => void;
  toggleShare: () => void;
  toggleChat: (force?: boolean) => void;
  toggleLock: () => void;
  sendMessage: (text: string) => void;
  reactToMessage: (index: number) => void;
  inviteToRoom: (p: Person) => void;
  setEffect: (e: string | null) => void;

  // ranki siralama oyunu
  rank: {
    pool: readonly RankItem[];
    isLogo: boolean;
    title: string;
    emoji: string;
    slotsCount: number;
    slots: (string | null)[];
    current: string | null;
  } | null;
  openRankGame: (key: RankGameKey) => void;
  closeRankGame: () => void;
  resetRankRound: () => void;
  placeCurrentRank: (slotIndex: number) => void;
  finishRankGame: () => void;

  // Casus oyunu
  spy: {
    active: boolean;
    location: SpyLocation | null;
    spyId: string | null;
    order: SpyPlayer[];
    revealIndex: number;
    cardShown: boolean;
    phase: SpyPhase;
    votedId: string | null;
  } | null;
  openSpyGame: () => void;
  closeSpyGame: () => void;
  toggleSpyCard: () => void;
  nextSpyPlayer: () => void;
  startSpyVoting: () => void;
  castSpyVote: (id: string) => void;
  restartSpyGame: () => void;

  // Doğruluk mu Cesaret mi
  truthOrDare: {
    active: boolean;
    order: SpyPlayer[];
    index: number;
    mode: TdMode;
    prompt: string | null;
  } | null;
  openTruthOrDare: () => void;
  closeTruthOrDare: () => void;
  chooseTruth: () => void;
  chooseDare: () => void;
  nextTdPlayer: () => void;

  // Vampir Köylü
  vampireGame: {
    active: boolean;
    players: VkPlayer[];
    revealIndex: number;
    cardShown: boolean;
    phase: VkPhase;
    lastEliminatedId: string | null;
    winner: VkWinner;
  } | null;
  openVampireGame: () => void;
  closeVampireGame: () => void;
  toggleVkCard: () => void;
  nextVkPlayer: () => void;
  selectNightVictim: (id: string) => void;
  continueToVote: () => void;
  selectDayVote: (id: string) => void;
  continueToNight: () => void;
  restartVampireGame: () => void;

  // Çizim Tahmin
  drawGame: {
    active: boolean;
    order: SpyPlayer[];
    drawerIndex: number;
    phase: DrawPhase;
    word: string | null;
    roundResult: DrawRoundResult;
    winnerId: string | null;
    scores: Record<string, number>;
  } | null;
  openDrawGame: () => void;
  closeDrawGame: () => void;
  startDrawingRound: () => void;
  markGuessed: (winnerId: string) => void;
  markTimeout: () => void;
  nextDrawRound: () => void;
  restartDrawGame: () => void;

  // Alında (Heads Up)
  headsUp: {
    active: boolean;
    order: SpyPlayer[];
    guesserIndex: number;
    phase: HuPhase;
    word: string | null;
    correctCount: number;
    skippedCount: number;
    guessedWords: string[];
    scores: Record<string, number>;
  } | null;
  openHeadsUp: () => void;
  closeHeadsUp: () => void;
  startHuRound: () => void;
  markHuCorrect: () => void;
  markHuSkip: () => void;
  endHuRound: () => void;
  nextHuPlayer: () => void;
  restartHeadsUp: () => void;

  // Son Kart (UNO tarzı)
  unoGame: {
    active: boolean;
    players: SpyPlayer[];
    hand: UnoCard[];
    handCounts: Record<string, number>;
    topCard: UnoCard | null;
    activeColor: UnoColor | null;
    currentPlayerIndex: number;
    direction: 1 | -1;
    phase: UnoPhase;
    hasDrawnThisTurn: boolean;
    winnerId: string | null;
    lastMessage: string | null;
    drawPileCount: number;
    roundNumber: number;
    cumulativeScores: Record<string, number>;
    lastRoundScore: number | null;
    lastRoundHandCounts: Record<string, number> | null;
    catchableId: string | null;
    drawFourVictimName: string | null;
  } | null;
  openUnoGame: () => void;
  closeUnoGame: () => void;
  playUnoCard: (cardId: string) => void;
  chooseUnoWildColor: (color: UnoColor) => void;
  drawUnoCard: () => void;
  endUnoTurnAfterDraw: () => void;
  declareUno: () => void;
  skipUnoDeclare: () => void;
  catchUnoForgetter: (targetId: string) => void;
  resolveDrawFourChallenge: (challenge: boolean) => void;
  startNextUnoRound: () => void;
  restartUnoGame: () => void;

  // Tabu
  tabu: {
    active: boolean;
    order: SpyPlayer[];
    describerIndex: number;
    phase: TabuPhase;
    card: TabuCard | null;
    correctCount: number;
    skippedCount: number;
    describedWords: string[];
    scores: Record<string, number>;
  } | null;
  openTabu: () => void;
  closeTabu: () => void;
  startTabuRound: () => void;
  markTabuCorrect: () => void;
  markTabuSkip: () => void;
  endTabuRound: () => void;
  nextTabuPlayer: () => void;
  restartTabu: () => void;

  // Bil Bakalım (bilgi yarışması)
  quiz: {
    active: boolean;
    players: SpyPlayer[];
    questions: QuizQuestion[];
    currentIndex: number;
    phase: QuizPhase;
    selectedIndex: number | null;
    correctPlayerIds: string[];
    scores: Record<string, number>;
  } | null;
  openQuiz: () => void;
  closeQuiz: () => void;
  selectQuizOption: (index: number) => void;
  toggleQuizCorrectPlayer: (id: string) => void;
  nextQuizQuestion: () => void;
  restartQuiz: () => void;

  // Okey
  okeyGame: {
    active: boolean;
    players: SpyPlayer[];
    hand: OkeyTile[];
    handCounts: Record<string, number>;
    drawPileCount: number;
    discardTop: OkeyTile | null;
    indicator: OkeyTile | null;
    okeyOf: { color: OkeyColor; number: number } | null;
    currentPlayerIndex: number;
    phase: OkeyPhase;
    canWinMelds: boolean;
    winnerId: string | null;
    winType: OkeyWinType;
  } | null;
  openOkeyGame: () => void;
  closeOkeyGame: () => void;
  drawOkeyFromPile: () => void;
  drawOkeyFromDiscard: () => void;
  reorderOkeyHand: (fromIndex: number, toIndex: number) => void;
  autoSortOkeyHand: () => void;
  discardOkeyTile: (tileId: string) => void;
  declareOkeyWin: () => void;
  restartOkeyGame: () => void;

  // 101 Okey
  yuzbirGame: {
    active: boolean;
    players: SpyPlayer[];
    hand: OkeyTile[];
    handCounts: Record<string, number>;
    drawPileCount: number;
    discardTop: OkeyTile | null;
    indicator: OkeyTile | null;
    okeyOf: { color: OkeyColor; number: number } | null;
    currentPlayerIndex: number;
    phase: YuzBirPhase;
    hasOpened: Record<string, boolean>;
    tableMelds: YuzBirMeld[];
    selectedHandIds: string[];
    pendingMelds: YuzBirMeld[];
    pendingValue: number;
    canFormMeld: boolean;
    canCommitOpening: boolean;
    canAddToMeld: boolean;
    canDiscard: boolean;
    winnerId: string | null;
    roundNumber: number;
    cumulativeScores: Record<string, number>;
    lastRoundResults: Record<string, YuzBirRoundResult> | null;
  } | null;
  openYuzBirGame: () => void;
  closeYuzBirGame: () => void;
  drawYuzBirFromPile: () => void;
  drawYuzBirFromDiscard: () => void;
  reorderYuzBirHand: (fromIndex: number, toIndex: number) => void;
  autoSortYuzBirHand: () => void;
  toggleYuzBirHandSelect: (tileId: string) => void;
  formYuzBirMeldFromSelection: () => void;
  commitYuzBirOpening: () => void;
  cancelYuzBirPendingMelds: () => void;
  addYuzBirSelectedTileToMeld: (meldId: string) => void;
  discardYuzBirTile: (tileId: string) => void;
  startNextYuzBirRound: () => void;
  restartYuzBirGame: () => void;

  // toast + sheet (genel amacli overlay'lar)
  toast: (msg: string) => void;
  toastMsg: string | null;
  sheet: SheetState;
  openSheet: (key: string, node: React.ReactNode) => void;
  closeSheet: () => void;

  // oda kapisini calan misafir (knock to join) — zamanlayicidan geldigi
  // icin JSX olmadan, veri olarak tasiniyor; ekranda ayri bir host render eder.
  knockRequest: Person | null;
  acceptKnock: () => void;
  rejectKnock: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { t, language } = useLanguage();
  const tabuPool = language === 'en' ? TABU_CARDS_EN : TABU_CARDS;
  const headsUpPool = language === 'en' ? HEADS_UP_WORDS_EN : HEADS_UP_WORDS;
  const quizPool = language === 'en' ? QUIZ_QUESTIONS_EN : QUIZ_QUESTIONS;
  const spyPool = language === 'en' ? SPY_LOCATIONS_EN : SPY_LOCATIONS;
  const drawPool = language === 'en' ? DRAW_WORDS_EN : DRAW_WORDS;
  const repliesPool = language === 'en' ? REPLIES_EN : REPLIES;
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [notif, setNotif] = useState(true);

  const [query, setQuery] = useState('');
  const [fquery, setFquery] = useState('');
  const [rooms, setRooms] = useState<Room[]>(() =>
    INITIAL_ROOMS.map((r) => ({ ...r, members: [...r.members] })) as Room[]
  );

  const [pending, setPending] = useState<CallTarget | null>(null);
  const [call, setCall] = useState<CallSession | null>(null);
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [front, setFront] = useState(true);
  const [share, setShare] = useState(false);
  const [locked, setLocked] = useState(false);
  const [effect, setEffectState] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [typing, setTyping] = useState<string | null>(null);
  const [mediaErr, setMediaErr] = useState<string | null>(null);

  const [rankKey, setRankKey] = useState<RankGameKey | null>(null);
  const [rankSlots, setRankSlots] = useState<(string | null)[]>([]);
  const [rankQueue, setRankQueue] = useState<string[]>([]);
  const [rankCurrent, setRankCurrent] = useState<string | null>(null);

  const [spyActive, setSpyActive] = useState(false);
  const [spyLocation, setSpyLocation] = useState<SpyLocation | null>(null);
  const [spySpyId, setSpySpyId] = useState<string | null>(null);
  const [spyOrder, setSpyOrder] = useState<SpyPlayer[]>([]);
  const [spyRevealIndex, setSpyRevealIndex] = useState(0);
  const [spyCardShown, setSpyCardShown] = useState(false);
  const [spyPhase, setSpyPhase] = useState<SpyPhase>('reveal');
  const [spyVotedId, setSpyVotedId] = useState<string | null>(null);

  const [tdActive, setTdActive] = useState(false);
  const [tdOrder, setTdOrder] = useState<SpyPlayer[]>([]);
  const [tdIndex, setTdIndex] = useState(0);
  const [tdMode, setTdMode] = useState<TdMode>('choose');
  const [tdPrompt, setTdPrompt] = useState<string | null>(null);
  const [tdUsedTruths, setTdUsedTruths] = useState<string[]>([]);
  const [tdUsedDares, setTdUsedDares] = useState<string[]>([]);

  const [vkActive, setVkActive] = useState(false);
  const [vkPlayers, setVkPlayers] = useState<VkPlayer[]>([]);
  const [vkRevealIndex, setVkRevealIndex] = useState(0);
  const [vkCardShown, setVkCardShown] = useState(false);
  const [vkPhase, setVkPhase] = useState<VkPhase>('reveal');
  const [vkLastEliminatedId, setVkLastEliminatedId] = useState<string | null>(null);
  const [vkWinner, setVkWinner] = useState<VkWinner>(null);

  const [dgActive, setDgActive] = useState(false);
  const [dgOrder, setDgOrder] = useState<SpyPlayer[]>([]);
  const [dgDrawerIndex, setDgDrawerIndex] = useState(0);
  const [dgPhase, setDgPhase] = useState<DrawPhase>('reveal');
  const [dgWord, setDgWord] = useState<string | null>(null);
  const [dgRoundResult, setDgRoundResult] = useState<DrawRoundResult>(null);
  const [dgWinnerId, setDgWinnerId] = useState<string | null>(null);
  const [dgScores, setDgScores] = useState<Record<string, number>>({});

  const [huActive, setHuActive] = useState(false);
  const [huOrder, setHuOrder] = useState<SpyPlayer[]>([]);
  const [huGuesserIndex, setHuGuesserIndex] = useState(0);
  const [huPhase, setHuPhase] = useState<HuPhase>('ready');
  const [huWord, setHuWord] = useState<string | null>(null);
  const [huCorrectCount, setHuCorrectCount] = useState(0);
  const [huSkippedCount, setHuSkippedCount] = useState(0);
  const [huGuessedWords, setHuGuessedWords] = useState<string[]>([]);
  const [huScores, setHuScores] = useState<Record<string, number>>({});

  const [unoActive, setUnoActive] = useState(false);
  const [unoPlayers, setUnoPlayers] = useState<SpyPlayer[]>([]);
  const [unoHands, setUnoHands] = useState<Record<string, UnoCard[]>>({});
  const [unoPiles, setUnoPiles] = useState<{ draw: UnoCard[]; discard: UnoCard[] }>({ draw: [], discard: [] });
  const [unoActiveColor, setUnoActiveColor] = useState<UnoColor | null>(null);
  const [unoCurrentIndex, setUnoCurrentIndex] = useState(0);
  const [unoDirection, setUnoDirection] = useState<1 | -1>(1);
  const [unoPhase, setUnoPhase] = useState<UnoPhase>('playing');
  const [unoHasDrawn, setUnoHasDrawn] = useState(false);
  const [unoWinnerId, setUnoWinnerId] = useState<string | null>(null);
  const [unoLastMessage, setUnoLastMessage] = useState<string | null>(null);
  const [unoPendingCard, setUnoPendingCard] = useState<UnoCard | null>(null);
  const [unoDrawFourHadAlternative, setUnoDrawFourHadAlternative] = useState(false);
  const [unoDeclared, setUnoDeclared] = useState<Record<string, boolean>>({});
  const [unoRoundNumber, setUnoRoundNumber] = useState(1);
  const [unoCumulative, setUnoCumulative] = useState<Record<string, number>>({});
  const [unoLastRoundScore, setUnoLastRoundScore] = useState<number | null>(null);
  const [unoLastRoundHandCounts, setUnoLastRoundHandCounts] = useState<Record<string, number> | null>(null);

  const [tabuActive, setTabuActive] = useState(false);
  const [tabuOrder, setTabuOrder] = useState<SpyPlayer[]>([]);
  const [tabuDescriberIndex, setTabuDescriberIndex] = useState(0);
  const [tabuPhase, setTabuPhase] = useState<TabuPhase>('ready');
  const [tabuCard, setTabuCard] = useState<TabuCard | null>(null);
  const [tabuCorrectCount, setTabuCorrectCount] = useState(0);
  const [tabuSkippedCount, setTabuSkippedCount] = useState(0);
  const [tabuDescribedWords, setTabuDescribedWords] = useState<string[]>([]);
  const [tabuScores, setTabuScores] = useState<Record<string, number>>({});

  const [quizActive, setQuizActive] = useState(false);
  const [quizPlayers, setQuizPlayers] = useState<SpyPlayer[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizPhase, setQuizPhase] = useState<QuizPhase>('question');
  const [quizSelectedIndex, setQuizSelectedIndex] = useState<number | null>(null);
  const [quizCorrectIds, setQuizCorrectIds] = useState<string[]>([]);
  const [quizScores, setQuizScores] = useState<Record<string, number>>({});

  const [okeyActive, setOkeyActive] = useState(false);
  const [okeyPlayers, setOkeyPlayers] = useState<SpyPlayer[]>([]);
  const [okeyHands, setOkeyHands] = useState<Record<string, OkeyTile[]>>({});
  const [okeyDrawPile, setOkeyDrawPile] = useState<OkeyTile[]>([]);
  const [okeyDiscardPile, setOkeyDiscardPile] = useState<OkeyTile[]>([]);
  const [okeyIndicator, setOkeyIndicator] = useState<OkeyTile | null>(null);
  const [okeyCurrentIndex, setOkeyCurrentIndex] = useState(0);
  const [okeyPhase, setOkeyPhase] = useState<OkeyPhase>('draw');
  const [okeyWinnerId, setOkeyWinnerId] = useState<string | null>(null);
  const [okeyWinType, setOkeyWinType] = useState<OkeyWinType>(null);

  const [yuzbirActive, setYuzbirActive] = useState(false);
  const [yuzbirPlayers, setYuzbirPlayers] = useState<SpyPlayer[]>([]);
  const [yuzbirHands, setYuzbirHands] = useState<Record<string, OkeyTile[]>>({});
  const [yuzbirDrawPile, setYuzbirDrawPile] = useState<OkeyTile[]>([]);
  const [yuzbirDiscardPile, setYuzbirDiscardPile] = useState<OkeyTile[]>([]);
  const [yuzbirIndicator, setYuzbirIndicator] = useState<OkeyTile | null>(null);
  const [yuzbirCurrentIndex, setYuzbirCurrentIndex] = useState(0);
  const [yuzbirPhase, setYuzbirPhase] = useState<YuzBirPhase>('draw');
  const [yuzbirWinnerId, setYuzbirWinnerId] = useState<string | null>(null);
  const [yuzbirRoundNumber, setYuzbirRoundNumber] = useState(1);
  const [yuzbirCumulative, setYuzbirCumulative] = useState<Record<string, number>>({});
  const [yuzbirLastRoundResults, setYuzbirLastRoundResults] = useState<Record<string, YuzBirRoundResult> | null>(null);
  const [yuzbirHasOpened, setYuzbirHasOpened] = useState<Record<string, boolean>>({});
  const [yuzbirTableMelds, setYuzbirTableMelds] = useState<YuzBirMeld[]>([]);
  const [yuzbirSelectedIds, setYuzbirSelectedIds] = useState<string[]>([]);
  const [yuzbirPendingMelds, setYuzbirPendingMelds] = useState<YuzBirMeld[]>([]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [sheet, setSheet] = useState<SheetState>(null);
  const [knockRequest, setKnockRequest] = useState<Person | null>(null);

  const knockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callRef = useRef(call);
  callRef.current = call;
  const lockedRef = useRef(locked);
  lockedRef.current = locked;
  const sheetRef = useRef(sheet);
  sheetRef.current = sheet;
  const knockRequestRef = useRef(knockRequest);
  knockRequestRef.current = knockRequest;

  // ---- baslangicta AsyncStorage'dan yukle ----
  useEffect(() => {
    (async () => {
      const [a, h] = await Promise.all([store.getAccounts(), store.getHistory()]);
      setAccounts(a);
      setHistory(h);
      setHydrated(true);
    })();
  }, []);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2100);
  }, []);

  const openSheet = useCallback((key: string, node: React.ReactNode) => setSheet({ key, node }), []);
  const closeSheet = useCallback(() => setSheet(null), []);

  // ---------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------
  const login = useCallback(
    async (rawMail: string, password: string) => {
      const mail = rawMail.trim();
      if (!mail) return { ok: false as const, error: t('errEnterEmail') };
      if (!isMail(mail)) return { ok: false as const, error: t('errValidEmail') };
      if (!password) return { ok: false as const, error: t('errEnterPassword') };
      if (password.length < 6) return { ok: false as const, error: t('errPasswordMin') };

      await new Promise((r) => setTimeout(r, 550));

      const acc = accounts.find((a) => a.email.toLowerCase() === mail.toLowerCase());
      if (acc && acc.password !== password) {
        return { ok: false as const, error: t('errWrongPassword') };
      }
      const resolved: Account = acc || {
        username: mail.split('@')[0],
        name: mail
          .split('@')[0]
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, (c) => c.toLocaleUpperCase('tr-TR')),
        email: mail,
        password,
      };
      if (!acc) {
        const next = [...accounts, resolved];
        setAccounts(next);
        store.setAccounts(next);
      }
      const u: CurrentUser = { username: resolved.username, name: resolved.name, email: resolved.email };
      setUser(u);
      store.setUser(u);
      toast(t('welcomeToast', { name: u.name }));
      return { ok: true as const };
    },
    [accounts, toast, t]
  );

  const register = useCallback(
    async (fields: {
      username: string;
      displayName: string;
      email: string;
      password: string;
      confirm: string;
      agreed: boolean;
    }) => {
      const u = fields.username.trim();
      const n = fields.displayName.trim();
      const m = fields.email.trim();
      if (u.length < 3) return { ok: false as const, error: t('errUsernameMin') };
      if (!n) return { ok: false as const, error: t('errEnterDisplayName') };
      if (!isMail(m)) return { ok: false as const, error: t('errValidEmail') };
      if (fields.password.length < 6) return { ok: false as const, error: t('errPasswordMin') };
      if (fields.password !== fields.confirm) return { ok: false as const, error: t('errPasswordMismatch') };
      if (!fields.agreed) return { ok: false as const, error: t('errMustAgree') };
      if (accounts.some((a) => a.email.toLowerCase() === m.toLowerCase())) {
        return { ok: false as const, error: t('errAccountExists') };
      }

      await new Promise((r) => setTimeout(r, 800));

      const acc: Account = { username: u, name: n, email: m, password: fields.password };
      const next = [...accounts, acc];
      setAccounts(next);
      store.setAccounts(next);
      const cu: CurrentUser = { username: u, name: n, email: m };
      setUser(cu);
      store.setUser(cu);
      toast(t('accountReadyToast'));
      return { ok: true as const };
    },
    [accounts, toast, t]
  );

  const socialLogin = useCallback(
    (provider: 'Google' | 'Apple' | 'Discord') => {
      const u: CurrentUser = {
        username: `${provider.toLowerCase()}_user`,
        name: `${provider} ${language === 'en' ? 'User' : 'Kullanıcısı'}`,
        email: `${provider.toLowerCase()}@vibely.app`,
      };
      setUser(u);
      store.setUser(u);
      toast(t('loggedInWithToast', { provider }));
    },
    [toast, t, language]
  );

  const logout = useCallback(() => {
    setUser(null);
    store.setUser(null);
    setCall(null);
    toast(t('loggedOutToast'));
  }, [toast, t]);

  const updateProfile = useCallback(
    (name: string, username: string) => {
      setUser((u) => {
        const next = { ...(u || { email: '' }), name, username } as CurrentUser;
        store.setUser(next);
        return next;
      });
      toast(t('profileUpdatedToast'));
    },
    [toast, t]
  );

  const toggleNotif = useCallback(() => {
    setNotif((v) => {
      toast(!v ? t('notifOnToast') : t('notifOffToast'));
      return !v;
    });
  }, [toast, t]);

  // ---------------------------------------------------------------------
  // Odalar
  // ---------------------------------------------------------------------
  const createRoom = useCallback((name: string, memberIds: string[]): Room => {
    const room: Room = {
      id: 'custom-' + Date.now(),
      name: name || 'Yeni Odam',
      icon: '🏠',
      owner: 'me',
      locked: false,
      members: memberIds.length ? memberIds : ['zeynep', 'mert'],
      grad: 'linear-gradient(135deg,#2563eb 0%,#7c3aed 50%,#db2777 100%)',
    };
    setRooms((r) => [...r, room]);
    return room;
  }, []);

  const setRoomLocked = useCallback((roomId: string, isLocked: boolean) => {
    setRooms((rs) => rs.map((r) => (r.id === roomId ? { ...r, locked: isLocked } : r)));
  }, []);

  // ---------------------------------------------------------------------
  // Arama / Görüşme
  // ---------------------------------------------------------------------
  const startDial = useCallback((target: CallTarget) => setPending(target), []);
  const cancelDial = useCallback(() => {
    setPending(null);
    toast(t('callCanceledToast'));
  }, [toast, t]);

  const enterCall = useCallback(
    (target: CallTarget) => {
      let ids = target.members ? target.members.slice() : target.kind === 'room' ? [] : [target.id];
      if (target.kind === 'room') {
        const r = rooms.find((x) => x.id === target.id);
        ids = r ? r.members.slice() : ids;
        PEOPLE.forEach((p) => {
          if (ids.length < 5 && !ids.includes(p.id)) ids.push(p.id);
        });
      }

      const parts: CallParticipant[] = ids.map((id, i) => {
        const p = person(id)!;
        return { id, name: p.name, c1: p.c1, c2: p.c2, mic: i % 4 !== 2, cam: true, bg: TILE_BG[i % TILE_BG.length] };
      });

      const title =
        target.kind === 'room' ? target.title : `${target.title.toLocaleLowerCase('tr-TR').replace(/\s+/g, '-')}-room 👑`;

      const session: CallSession = {
        kind: target.kind,
        id: target.id,
        title,
        started: Date.now(),
        parts,
        msgs: [
          { who: 'Mert', txt: t('seedMsg1'), t: '21:31', react: '❤️ 3' },
          { who: 'Efe', txt: t('seedMsg2'), t: '21:32', react: '🔥 2' },
          { who: 'İrem', txt: t('seedMsg3'), t: '21:33' },
        ],
      };

      setCall(session);
      setPending(null);
      setMic(true);
      setCam(true);
      setFront(true);
      setShare(false);
      setLocked(false);
      setEffectState(null);
      setMediaErr(null);
      setChatOpen(false);
      setUnread(session.msgs.length);
    },
    [rooms, t]
  );

  const leaveCall = useCallback(() => {
    const c = callRef.current;
    if (c) {
      const seconds = Math.floor((Date.now() - c.started) / 1000);
      const title =
        c.kind === 'room' ? rooms.find((r) => r.id === c.id)?.name || c.title : person(c.id)?.name || c.title;
      const item: HistoryItem = {
        id: c.kind === 'room' ? null : c.id,
        title,
        kind: c.kind,
        dur: callDurationLabel(seconds),
        at: Date.now(),
      };
      setHistory((h) => {
        const next = [item, ...h];
        store.setHistory(next);
        return next;
      });
    }
    if (knockTimer.current) clearTimeout(knockTimer.current);
    setCall(null);
    setPending(null);
    setChatOpen(false);
    setShare(false);
    setMediaErr(null);
    setKnockRequest(null);
    closeSheet();
    toast(t('leftCallToast'));
  }, [rooms, closeSheet, toast, t]);

  const toggleMic = useCallback(() => {
    setMic((v) => {
      toast(!v ? t('micOnToast') : t('micOffToast'));
      return !v;
    });
  }, [toast, t]);

  const toggleCam = useCallback(() => {
    setCam((v) => {
      toast(!v ? t('camOnToast') : t('camOffToast'));
      return !v;
    });
  }, [toast, t]);

  const flipCamera = useCallback(() => {
    setFront((v) => {
      toast(t('cameraFlippedToast'));
      return !v;
    });
  }, [toast, t]);

  const toggleShare = useCallback(() => {
    setShare((v) => {
      toast(!v ? t('shareStartedToast') : t('shareStoppedToast'));
      return !v;
    });
  }, [toast, t]);

  const toggleChat = useCallback((force?: boolean) => {
    setChatOpen((v) => {
      const next = force === undefined ? !v : force;
      if (next) setUnread(0);
      return next;
    });
  }, []);

  const toggleLock = useCallback(() => {
    setLocked((v) => {
      const next = !v;
      const c = callRef.current;
      if (c) setRoomLocked(c.id, next);
      toast(next ? t('roomLockedToast') : t('roomUnlockedToast'));
      return next;
    });
  }, [toast, setRoomLocked, t]);

  const setEffect = useCallback(
    (e: string | null) => {
      setEffectState(e);
      if (e) toast(t('effectAppliedToast', { emoji: e }));
    },
    [toast, t]
  );

  const sysMsg = useCallback((txt: string) => {
    setCall((c) => {
      if (!c) return c;
      const d = new Date();
      const msg: ChatMessage = { who: 'Vibely', txt, t: `${pad(d.getHours())}:${pad(d.getMinutes())}`, sys: true };
      return { ...c, msgs: [...c.msgs, msg] };
    });
    setChatOpen((open) => {
      if (!open) setUnread((u) => u + 1);
      return open;
    });
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      const txt = text.trim();
      if (!txt) return;
      const d = new Date();
      setCall((c) => (c ? { ...c, msgs: [...c.msgs, { who: t('you'), txt, t: `${pad(d.getHours())}:${pad(d.getMinutes())}`, me: true }] } : c));

      const c = callRef.current;
      if (c && c.parts.length) {
        const who = c.parts[Math.floor(Math.random() * c.parts.length)];
        setTyping(who.name);
        setTimeout(() => {
          if (!callRef.current) return;
          setTyping(null);
          const d2 = new Date();
          const reply = repliesPool[Math.floor(Math.random() * repliesPool.length)];
          setCall((cc) =>
            cc ? { ...cc, msgs: [...cc.msgs, { who: who.name, txt: reply, t: `${pad(d2.getHours())}:${pad(d2.getMinutes())}` }] } : cc
          );
          setChatOpen((open) => {
            if (!open) setUnread((u) => u + 1);
            return open;
          });
        }, 1400 + Math.random() * 1000);
      }
    },
    [t, repliesPool]
  );

  const reactToMessage = useCallback((index: number) => {
    setCall((c) => {
      if (!c) return c;
      const msgs = c.msgs.slice();
      const m = msgs[index];
      if (!m) return c;
      const cur = REACTS.indexOf((m.react || '').split(' ')[0]);
      const nextReact = cur === -1 ? REACTS[0] + ' 1' : cur === REACTS.length - 1 ? null : REACTS[cur + 1] + ' 1';
      msgs[index] = { ...m, react: nextReact };
      return { ...c, msgs };
    });
  }, []);

  const addToRoom = useCallback(
    (p: Person) => {
      const c = callRef.current;
      if (!c || c.parts.some((x) => x.id === p.id)) return;
      setCall((cc) => {
        if (!cc) return cc;
        const part: CallParticipant = {
          id: p.id,
          name: p.name,
          c1: p.c1,
          c2: p.c2,
          mic: true,
          cam: true,
          bg: TILE_BG[cc.parts.length % TILE_BG.length],
        };
        return { ...cc, parts: [...cc.parts, part] };
      });
      sysMsg(t('joinedRoomSysMsg', { name: p.name }));
    },
    [sysMsg, t]
  );

  const inviteToRoom = useCallback(
    (p: Person) => {
      addToRoom(p);
      toast(t('invitedToRoomToast', { name: p.name }));
    },
    [addToRoom, toast, t]
  );

  // ---- Oda kapisini calan misafirler (knock to join) ----
  const scheduleKnock = useCallback(() => {
    if (knockTimer.current) clearTimeout(knockTimer.current);
    if (!callRef.current) return;
    knockTimer.current = setTimeout(() => {
      const c = callRef.current;
      if (!c) return;
      const out = [...PEOPLE, ...GUESTS].filter((p) => !c.parts.some((x) => x.id === p.id));
      if (out.length) {
        const p = out[Math.floor(Math.random() * out.length)] as Person;
        if (lockedRef.current) {
          if (!sheetRef.current && !knockRequestRef.current) {
            toast(t('knockRequestToast', { name: p.name }));
            setKnockRequest(p);
          }
        } else {
          addToRoom(p);
        }
      }
      scheduleKnock();
    }, 16000 + Math.random() * 12000);
  }, [addToRoom, toast, t]);

  const acceptKnock = useCallback(() => {
    if (knockRequest) addToRoom(knockRequest);
    setKnockRequest(null);
  }, [knockRequest, addToRoom]);

  const rejectKnock = useCallback(() => {
    if (knockRequest) {
      sysMsg(t('knockRejectedSysMsg', { name: knockRequest.name }));
      toast(t('knockRejectedToast', { name: knockRequest.name }));
    }
    setKnockRequest(null);
  }, [knockRequest, sysMsg, toast, t]);

  useEffect(() => {
    if (call) scheduleKnock();
    return () => {
      if (knockTimer.current) clearTimeout(knockTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!call]);

  // ---------------------------------------------------------------------
  // Kör Sıralama (Blind Rank)
  // ---------------------------------------------------------------------
  const startRankRound = useCallback((key: RankGameKey) => {
    const def = RANK_POOL_MAP[key];
    const slotsCount = Math.min(RANK_SLOTS, def.pool.length);
    const queue = shuffledIds(def.pool).slice(0, slotsCount);
    const current = queue.shift() || null;
    setRankSlots(new Array(slotsCount).fill(null));
    setRankQueue(queue);
    setRankCurrent(current);
  }, []);

  const openRankGame = useCallback(
    (key: RankGameKey) => {
      setRankKey(key);
      startRankRound(key);
    },
    [startRankRound]
  );

  const closeRankGame = useCallback(() => setRankKey(null), []);

  const resetRankRound = useCallback(() => {
    if (rankKey) startRankRound(rankKey);
  }, [rankKey, startRankRound]);

  const placeCurrentRank = useCallback(
    (slotIndex: number) => {
      if (!rankCurrent || rankSlots[slotIndex]) return;
      setRankSlots((slots) => {
        const next = slots.slice();
        next[slotIndex] = rankCurrent;
        return next;
      });
      setRankQueue((q) => {
        const next = q.slice();
        const nextCurrent = next.shift() || null;
        setRankCurrent(nextCurrent);
        return next;
      });
    },
    [rankCurrent, rankSlots]
  );

  const finishRankGame = useCallback(() => {
    if (!rankKey) return;
    const def = RANK_POOL_MAP[rankKey];
    const order = rankSlots
      .map((id, i) => {
        const f = id && def.pool.find((x) => x.id === id);
        return f ? `${i + 1}) ${f.e} ${localizeDataName(f.n, language)}` : null;
      })
      .filter(Boolean)
      .join('\n');
    closeRankGame();
    sysMsg(`${localizeName(def.title, language)} ${def.emoji}\n${order}`);
    toast(t('rankSharedToast'));
  }, [rankKey, rankSlots, closeRankGame, sysMsg, toast, t, language]);

  const rank = useMemo(() => {
    if (!rankKey) return null;
    const def = RANK_POOL_MAP[rankKey];
    return {
      pool: def.pool,
      isLogo: def.logo,
      title: def.title,
      emoji: def.emoji,
      slotsCount: rankSlots.length,
      slots: rankSlots,
      current: rankCurrent,
    };
  }, [rankKey, rankSlots, rankCurrent]);

  // ---------------------------------------------------------------------
  // Casus (Spyfall tarzı parti oyunu)
  // ---------------------------------------------------------------------
  const openSpyGame = useCallback(() => {
    const c = callRef.current;
    const players: SpyPlayer[] = [
      { id: 'me', name: t('you'), c1: '#6366f1', c2: '#ec4899' },
      ...(c?.parts.map((p) => ({ id: p.id, name: p.name, c1: p.c1, c2: p.c2 })) ?? []),
    ];
    const location = spyPool[Math.floor(Math.random() * spyPool.length)];
    const spyId = players[Math.floor(Math.random() * players.length)].id;

    setSpyOrder(players);
    setSpyLocation(location);
    setSpySpyId(spyId);
    setSpyRevealIndex(0);
    setSpyCardShown(false);
    setSpyPhase('reveal');
    setSpyVotedId(null);
    setSpyActive(true);
  }, [t, spyPool]);

  const closeSpyGame = useCallback(() => setSpyActive(false), []);

  const toggleSpyCard = useCallback(() => setSpyCardShown((v) => !v), []);

  const nextSpyPlayer = useCallback(() => {
    setSpyCardShown(false);
    setSpyRevealIndex((i) => {
      const next = i + 1;
      if (next >= spyOrder.length) {
        setSpyPhase('discuss');
        return i;
      }
      return next;
    });
  }, [spyOrder.length]);

  const startSpyVoting = useCallback(() => setSpyPhase('vote'), []);

  const castSpyVote = useCallback((id: string) => {
    setSpyVotedId(id);
    setSpyPhase('result');
  }, []);

  const restartSpyGame = useCallback(() => {
    const location = spyPool[Math.floor(Math.random() * spyPool.length)];
    const spyId = spyOrder.length ? spyOrder[Math.floor(Math.random() * spyOrder.length)].id : null;
    setSpyLocation(location);
    setSpySpyId(spyId);
    setSpyRevealIndex(0);
    setSpyCardShown(false);
    setSpyPhase('reveal');
    setSpyVotedId(null);
  }, [spyOrder, spyPool]);

  const spy = useMemo(() => {
    if (!spyActive) return null;
    return {
      active: spyActive,
      location: spyLocation,
      spyId: spySpyId,
      order: spyOrder,
      revealIndex: spyRevealIndex,
      cardShown: spyCardShown,
      phase: spyPhase,
      votedId: spyVotedId,
    };
  }, [spyActive, spyLocation, spySpyId, spyOrder, spyRevealIndex, spyCardShown, spyPhase, spyVotedId]);

  // ---------------------------------------------------------------------
  // Doğruluk mu Cesaret mi
  // ---------------------------------------------------------------------
  const openTruthOrDare = useCallback(() => {
    const c = callRef.current;
    const players: SpyPlayer[] = [
      { id: 'me', name: t('you'), c1: '#6366f1', c2: '#ec4899' },
      ...(c?.parts.map((p) => ({ id: p.id, name: p.name, c1: p.c1, c2: p.c2 })) ?? []),
    ];
    setTdOrder(players);
    setTdIndex(0);
    setTdMode('choose');
    setTdPrompt(null);
    setTdUsedTruths([]);
    setTdUsedDares([]);
    setTdActive(true);
  }, [t]);

  const closeTruthOrDare = useCallback(() => setTdActive(false), []);

  const chooseTruth = useCallback(() => {
    const available = TRUTH_QUESTIONS.filter((q) => !tdUsedTruths.includes(q));
    const pool = available.length ? available : TRUTH_QUESTIONS;
    const prompt = pool[Math.floor(Math.random() * pool.length)];
    setTdMode('truth');
    setTdPrompt(prompt);
    setTdUsedTruths((u) => (available.length ? [...u, prompt] : [prompt]));
  }, [tdUsedTruths]);

  const chooseDare = useCallback(() => {
    const available = DARE_CHALLENGES.filter((d) => !tdUsedDares.includes(d));
    const pool = available.length ? available : DARE_CHALLENGES;
    const prompt = pool[Math.floor(Math.random() * pool.length)];
    setTdMode('dare');
    setTdPrompt(prompt);
    setTdUsedDares((u) => (available.length ? [...u, prompt] : [prompt]));
  }, [tdUsedDares]);

  const nextTdPlayer = useCallback(() => {
    setTdIndex((i) => (tdOrder.length ? (i + 1) % tdOrder.length : 0));
    setTdMode('choose');
    setTdPrompt(null);
  }, [tdOrder.length]);

  const truthOrDare = useMemo(() => {
    if (!tdActive) return null;
    return { active: tdActive, order: tdOrder, index: tdIndex, mode: tdMode, prompt: tdPrompt };
  }, [tdActive, tdOrder, tdIndex, tdMode, tdPrompt]);

  // ---------------------------------------------------------------------
  // Vampir Köylü
  // ---------------------------------------------------------------------
  const openVampireGame = useCallback(() => {
    const c = callRef.current;
    const base: SpyPlayer[] = [
      { id: 'me', name: t('you'), c1: '#6366f1', c2: '#ec4899' },
      ...(c?.parts.map((p) => ({ id: p.id, name: p.name, c1: p.c1, c2: p.c2 })) ?? []),
    ];
    const vampireCount = Math.max(1, Math.floor(base.length / 4));
    const shuffled = [...base].sort(() => Math.random() - 0.5);
    const vampireIds = new Set(shuffled.slice(0, vampireCount).map((p) => p.id));
    const players: VkPlayer[] = base.map((p) => ({ ...p, role: vampireIds.has(p.id) ? 'vampire' : 'villager', alive: true }));

    setVkPlayers(players);
    setVkRevealIndex(0);
    setVkCardShown(false);
    setVkPhase('reveal');
    setVkLastEliminatedId(null);
    setVkWinner(null);
    setVkActive(true);
  }, [t]);

  const closeVampireGame = useCallback(() => setVkActive(false), []);

  const toggleVkCard = useCallback(() => setVkCardShown((v) => !v), []);

  const nextVkPlayer = useCallback(() => {
    setVkCardShown(false);
    setVkRevealIndex((i) => {
      const next = i + 1;
      if (next >= vkPlayers.length) {
        setVkPhase('night');
        return i;
      }
      return next;
    });
  }, [vkPlayers.length]);

  const selectNightVictim = useCallback((id: string) => {
    setVkPlayers((players) => {
      const next = players.map((p) => (p.id === id ? { ...p, alive: false } : p));
      const winner = computeVkWinner(next);
      setVkWinner(winner);
      setVkPhase(winner ? 'end' : 'night-result');
      return next;
    });
    setVkLastEliminatedId(id);
  }, []);

  const continueToVote = useCallback(() => setVkPhase('day-vote'), []);

  const selectDayVote = useCallback((id: string) => {
    setVkPlayers((players) => {
      const next = players.map((p) => (p.id === id ? { ...p, alive: false } : p));
      const winner = computeVkWinner(next);
      setVkWinner(winner);
      setVkPhase(winner ? 'end' : 'day-result');
      return next;
    });
    setVkLastEliminatedId(id);
  }, []);

  const continueToNight = useCallback(() => setVkPhase('night'), []);

  const restartVampireGame = useCallback(() => openVampireGame(), [openVampireGame]);

  const vampireGame = useMemo(() => {
    if (!vkActive) return null;
    return {
      active: vkActive,
      players: vkPlayers,
      revealIndex: vkRevealIndex,
      cardShown: vkCardShown,
      phase: vkPhase,
      lastEliminatedId: vkLastEliminatedId,
      winner: vkWinner,
    };
  }, [vkActive, vkPlayers, vkRevealIndex, vkCardShown, vkPhase, vkLastEliminatedId, vkWinner]);

  // ---------------------------------------------------------------------
  // Çizim Tahmin
  // ---------------------------------------------------------------------
  const openDrawGame = useCallback(() => {
    const c = callRef.current;
    const players: SpyPlayer[] = [
      { id: 'me', name: t('you'), c1: '#6366f1', c2: '#ec4899' },
      ...(c?.parts.map((p) => ({ id: p.id, name: p.name, c1: p.c1, c2: p.c2 })) ?? []),
    ];
    setDgOrder(players);
    setDgDrawerIndex(0);
    setDgPhase('reveal');
    setDgWord(drawPool[Math.floor(Math.random() * drawPool.length)]);
    setDgRoundResult(null);
    setDgWinnerId(null);
    setDgScores(Object.fromEntries(players.map((p) => [p.id, 0])));
    setDgActive(true);
  }, [t, drawPool]);

  const closeDrawGame = useCallback(() => setDgActive(false), []);

  const startDrawingRound = useCallback(() => setDgPhase('drawing'), []);

  const markGuessed = useCallback((winnerId: string) => {
    setDgScores((s) => ({ ...s, [winnerId]: (s[winnerId] ?? 0) + 1 }));
    setDgWinnerId(winnerId);
    setDgRoundResult('guessed');
    setDgPhase('round-result');
  }, []);

  const markTimeout = useCallback(() => {
    setDgWinnerId(null);
    setDgRoundResult('timeout');
    setDgPhase('round-result');
  }, []);

  const nextDrawRound = useCallback(() => {
    setDgDrawerIndex((i) => (dgOrder.length ? (i + 1) % dgOrder.length : 0));
    setDgWord(drawPool[Math.floor(Math.random() * drawPool.length)]);
    setDgRoundResult(null);
    setDgWinnerId(null);
    setDgPhase('reveal');
  }, [dgOrder.length, drawPool]);

  const restartDrawGame = useCallback(() => openDrawGame(), [openDrawGame]);

  const drawGame = useMemo(() => {
    if (!dgActive) return null;
    return {
      active: dgActive,
      order: dgOrder,
      drawerIndex: dgDrawerIndex,
      phase: dgPhase,
      word: dgWord,
      roundResult: dgRoundResult,
      winnerId: dgWinnerId,
      scores: dgScores,
    };
  }, [dgActive, dgOrder, dgDrawerIndex, dgPhase, dgWord, dgRoundResult, dgWinnerId, dgScores]);

  // ---------------------------------------------------------------------
  // Alında (Heads Up)
  // ---------------------------------------------------------------------
  const openHeadsUp = useCallback(() => {
    const c = callRef.current;
    const players: SpyPlayer[] = [
      { id: 'me', name: t('you'), c1: '#6366f1', c2: '#ec4899' },
      ...(c?.parts.map((p) => ({ id: p.id, name: p.name, c1: p.c1, c2: p.c2 })) ?? []),
    ];
    setHuOrder(players);
    setHuGuesserIndex(0);
    setHuPhase('ready');
    setHuWord(null);
    setHuCorrectCount(0);
    setHuSkippedCount(0);
    setHuGuessedWords([]);
    setHuScores(Object.fromEntries(players.map((p) => [p.id, 0])));
    setHuActive(true);
  }, [t]);

  const closeHeadsUp = useCallback(() => setHuActive(false), []);

  const startHuRound = useCallback(() => {
    setHuCorrectCount(0);
    setHuSkippedCount(0);
    setHuGuessedWords([]);
    setHuWord(headsUpPool[Math.floor(Math.random() * headsUpPool.length)]);
    setHuPhase('playing');
  }, [headsUpPool]);

  const markHuCorrect = useCallback(() => {
    const guesser = huOrder[huGuesserIndex];
    setHuWord((w) => {
      if (w) setHuGuessedWords((gw) => [...gw, w]);
      return headsUpPool[Math.floor(Math.random() * headsUpPool.length)];
    });
    setHuCorrectCount((n) => n + 1);
    if (guesser) setHuScores((s) => ({ ...s, [guesser.id]: (s[guesser.id] ?? 0) + 1 }));
  }, [huOrder, huGuesserIndex, headsUpPool]);

  const markHuSkip = useCallback(() => {
    setHuSkippedCount((n) => n + 1);
    setHuWord(headsUpPool[Math.floor(Math.random() * headsUpPool.length)]);
  }, [headsUpPool]);

  const endHuRound = useCallback(() => setHuPhase('round-result'), []);

  const nextHuPlayer = useCallback(() => {
    setHuGuesserIndex((i) => (huOrder.length ? (i + 1) % huOrder.length : 0));
    setHuPhase('ready');
    setHuWord(null);
  }, [huOrder.length]);

  const restartHeadsUp = useCallback(() => openHeadsUp(), [openHeadsUp]);

  const headsUp = useMemo(() => {
    if (!huActive) return null;
    return {
      active: huActive,
      order: huOrder,
      guesserIndex: huGuesserIndex,
      phase: huPhase,
      word: huWord,
      correctCount: huCorrectCount,
      skippedCount: huSkippedCount,
      guessedWords: huGuessedWords,
      scores: huScores,
    };
  }, [huActive, huOrder, huGuesserIndex, huPhase, huWord, huCorrectCount, huSkippedCount, huGuessedWords, huScores]);

  // ---------------------------------------------------------------------
  // Son Kart (UNO tarzı)
  // ---------------------------------------------------------------------
  const dealUnoRound = useCallback((players: SpyPlayer[]) => {
    const deck = shuffle(buildDeck());
    const hands: Record<string, UnoCard[]> = {};
    let idx = 0;
    for (const p of players) {
      hands[p.id] = deck.slice(idx, idx + 7);
      idx += 7;
    }
    let rest = deck.slice(idx);
    let startIdx = rest.findIndex((card) => card.type === 'number');
    if (startIdx === -1) startIdx = 0;
    const startCard = rest[startIdx];
    rest = [...rest.slice(0, startIdx), ...rest.slice(startIdx + 1)];

    setUnoHands(hands);
    setUnoPiles({ draw: rest, discard: [startCard] });
    setUnoActiveColor(startCard.color as UnoColor);
    setUnoCurrentIndex(0);
    setUnoDirection(1);
    setUnoPhase('playing');
    setUnoHasDrawn(false);
    setUnoWinnerId(null);
    setUnoLastMessage(null);
    setUnoPendingCard(null);
    setUnoDrawFourHadAlternative(false);
    setUnoDeclared({});
    setUnoLastRoundScore(null);
    setUnoLastRoundHandCounts(null);
  }, []);

  const openUnoGame = useCallback(() => {
    const c = callRef.current;
    const players: SpyPlayer[] = [
      { id: 'me', name: t('you'), c1: '#6366f1', c2: '#ec4899' },
      ...(c?.parts.map((p) => ({ id: p.id, name: p.name, c1: p.c1, c2: p.c2 })) ?? []),
    ];
    setUnoPlayers(players);
    setUnoCumulative(Object.fromEntries(players.map((p) => [p.id, 0])));
    setUnoRoundNumber(1);
    dealUnoRound(players);
    setUnoActive(true);
  }, [dealUnoRound, t]);

  const closeUnoGame = useCallback(() => setUnoActive(false), []);

  const drawCardsForUnoPlayer = useCallback((playerId: string, count: number) => {
    setUnoPiles((piles) => {
      let d = piles.draw;
      let disc = piles.discard;
      const drawn: UnoCard[] = [];
      for (let i = 0; i < count; i++) {
        if (d.length === 0) {
          if (disc.length > 1) {
            const top = disc[disc.length - 1];
            d = shuffle(disc.slice(0, -1));
            disc = [top];
          } else {
            break; // cekilecek kart kalmadi
          }
        }
        const [next, ...remaining] = d;
        drawn.push(next);
        d = remaining;
      }
      if (drawn.length) {
        setUnoHands((h) => ({ ...h, [playerId]: [...(h[playerId] ?? []), ...drawn] }));
      }
      return { draw: d, discard: disc };
    });
  }, []);

  const applyUnoEffectAndAdvance = useCallback(
    (card: UnoCard) => {
      const count = unoPlayers.length;
      let dir = unoDirection;
      let nextIndex: number;
      let message: string | null = null;
      const currentName = unoPlayers[unoCurrentIndex]?.name;

      if (card.type === 'skip') {
        nextIndex = stepPlayerIndex(unoCurrentIndex, dir, count, 1);
        message = t('unoSkippedMsg', { name: currentName ?? '' });
      } else if (card.type === 'reverse') {
        if (count === 2) {
          nextIndex = unoCurrentIndex; // 2 kisilik oyunda Reverse, Skip gibi davranir
        } else {
          dir = (dir * -1) as 1 | -1;
          nextIndex = stepPlayerIndex(unoCurrentIndex, dir, count, 0);
        }
        message = t('unoDirectionChangedMsg');
      } else if (card.type === 'drawTwo') {
        const victimIndex = stepPlayerIndex(unoCurrentIndex, dir, count, 0);
        const victim = unoPlayers[victimIndex];
        if (victim) drawCardsForUnoPlayer(victim.id, 2);
        nextIndex = stepPlayerIndex(unoCurrentIndex, dir, count, 1);
        message = victim ? t('unoDrawTwoMsg', { name: victim.name }) : null;
      } else {
        nextIndex = stepPlayerIndex(unoCurrentIndex, dir, count, 0);
      }

      setUnoDirection(dir);
      setUnoCurrentIndex(nextIndex);
      setUnoPhase('playing');
      setUnoLastMessage(message);
    },
    [unoPlayers, unoCurrentIndex, unoDirection, drawCardsForUnoPlayer, t]
  );

  // El sonu puanlamasi: kazanan haric herkesin elinde kalan kartlarin toplam
  // degeri kazanana yazilir (resmi UNO kurali - numara=yuzu, engel=20, joker/+4=50).
  const finishUnoRound = useCallback(
    (winnerId: string, finalHands: Record<string, UnoCard[]>) => {
      let roundScore = 0;
      const handCounts: Record<string, number> = {};
      unoPlayers.forEach((p) => {
        const hand = finalHands[p.id] ?? [];
        handCounts[p.id] = hand.length;
        if (p.id !== winnerId) roundScore += hand.reduce((sum, c) => sum + cardScoreValue(c), 0);
      });
      setUnoCumulative((c) => ({ ...c, [winnerId]: (c[winnerId] ?? 0) + roundScore }));
      setUnoLastRoundScore(roundScore);
      setUnoLastRoundHandCounts(handCounts);
      setUnoWinnerId(winnerId);
      setUnoPhase('game-over');
    },
    [unoPlayers]
  );

  const playUnoCard = useCallback(
    (cardId: string) => {
      const player = unoPlayers[unoCurrentIndex];
      if (!player || !unoActiveColor) return;
      const hand = unoHands[player.id] ?? [];
      const card = hand.find((c) => c.id === cardId);
      const top = unoPiles.discard[unoPiles.discard.length - 1];
      if (!card || !top) return;
      if (!isPlayable(card, top, unoActiveColor)) return;

      const newHand = hand.filter((c) => c.id !== cardId);
      const newHands = { ...unoHands, [player.id]: newHand };
      setUnoHands(newHands);
      setUnoPiles((piles) => ({ draw: piles.draw, discard: [...piles.discard, card] }));
      setUnoHasDrawn(false);

      if (newHand.length === 0) {
        if (card.type !== 'wild' && card.type !== 'wildDrawFour') setUnoActiveColor(card.color as UnoColor);
        finishUnoRound(player.id, newHands);
        return;
      }

      if (card.type === 'wildDrawFour') {
        const hadAlt = hand.some((c) => c.id !== cardId && c.color !== 'wild' && c.color === unoActiveColor);
        setUnoDrawFourHadAlternative(hadAlt);
      }

      setUnoPendingCard(card);
      if (newHand.length === 1) {
        setUnoDeclared((d) => ({ ...d, [player.id]: false }));
        setUnoPhase('uno-declare');
        return;
      }
      if (card.type === 'wild' || card.type === 'wildDrawFour') {
        setUnoPhase('color-picker');
        return;
      }

      setUnoActiveColor(card.color as UnoColor);
      applyUnoEffectAndAdvance(card);
      setUnoPendingCard(null);
    },
    [unoPlayers, unoCurrentIndex, unoHands, unoPiles, unoActiveColor, applyUnoEffectAndAdvance, finishUnoRound]
  );

  // "UNO!" deme aninin ardindan (declare edilsin ya da gecilsin) oynanan kartin
  // asil etkisine (renk secimi / +4 itirazi / seri etki) devam eder.
  const continueAfterUnoDeclare = useCallback(() => {
    const card = unoPendingCard;
    if (!card) {
      setUnoPhase('playing');
      return;
    }
    if (card.type === 'wild' || card.type === 'wildDrawFour') {
      setUnoPhase('color-picker');
      return;
    }
    setUnoActiveColor(card.color as UnoColor);
    applyUnoEffectAndAdvance(card);
    setUnoPendingCard(null);
  }, [unoPendingCard, applyUnoEffectAndAdvance]);

  const declareUno = useCallback(() => {
    const player = unoPlayers[unoCurrentIndex];
    if (player) setUnoDeclared((d) => ({ ...d, [player.id]: true }));
    continueAfterUnoDeclare();
  }, [unoPlayers, unoCurrentIndex, continueAfterUnoDeclare]);

  const skipUnoDeclare = useCallback(() => {
    continueAfterUnoDeclare();
  }, [continueAfterUnoDeclare]);

  // Baska bir oyuncu, 1 kartta kalip "UNO!" demeyi unutan (ve henuz kendi
  // sirasinda tekrar oynamamis) oyuncuyu yakalayip 2 ceza karti yazdirabilir.
  const catchUnoForgetter = useCallback(
    (targetId: string) => {
      const hand = unoHands[targetId] ?? [];
      if (hand.length !== 1 || unoDeclared[targetId]) return;
      drawCardsForUnoPlayer(targetId, 2);
      setUnoDeclared((d) => ({ ...d, [targetId]: true }));
      setUnoLastMessage(t('unoCaughtMsg'));
    },
    [unoHands, unoDeclared, drawCardsForUnoPlayer, t]
  );

  const chooseUnoWildColor = useCallback(
    (color: UnoColor) => {
      setUnoActiveColor(color);
      const card = unoPendingCard;
      if (card?.type === 'wildDrawFour') {
        setUnoPhase('draw-four-challenge');
        return;
      }
      if (card) applyUnoEffectAndAdvance(card);
      setUnoPendingCard(null);
    },
    [unoPendingCard, applyUnoEffectAndAdvance]
  );

  // Resmi +4 itiraz kurali: itiraz haklıysa (oynayanin elinde o an gecerli
  // rengden baska oynayabilecegi kart varmis) +4'u oynayan 4 ceza ceker ve
  // magdur normal oynar; itiraz haksizsa magdur 6 ceza cekip atlanir.
  const resolveDrawFourChallenge = useCallback(
    (challenge: boolean) => {
      const count = unoPlayers.length;
      const dir = unoDirection;
      const player = unoPlayers[unoCurrentIndex];
      const victimIndex = stepPlayerIndex(unoCurrentIndex, dir, count, 0);
      const victim = unoPlayers[victimIndex];
      let nextIndex: number;
      let message: string | null = null;

      if (!challenge) {
        if (victim) drawCardsForUnoPlayer(victim.id, 4);
        nextIndex = stepPlayerIndex(unoCurrentIndex, dir, count, 1);
        message = victim ? t('unoDrawFourMsg', { name: victim.name }) : null;
      } else if (unoDrawFourHadAlternative) {
        if (player) drawCardsForUnoPlayer(player.id, 4);
        nextIndex = victimIndex;
        message = t('unoChallengeCorrectMsg', { name: player?.name ?? '' });
      } else {
        if (victim) drawCardsForUnoPlayer(victim.id, 6);
        nextIndex = stepPlayerIndex(unoCurrentIndex, dir, count, 1);
        message = t('unoChallengeIncorrectMsg', { name: victim?.name ?? '' });
      }

      setUnoCurrentIndex(nextIndex);
      setUnoPhase('playing');
      setUnoLastMessage(message);
      setUnoPendingCard(null);
    },
    [unoPlayers, unoCurrentIndex, unoDirection, unoDrawFourHadAlternative, drawCardsForUnoPlayer, t]
  );

  const drawUnoCard = useCallback(() => {
    const player = unoPlayers[unoCurrentIndex];
    if (!player) return;
    drawCardsForUnoPlayer(player.id, 1);
    setUnoHasDrawn(true);
  }, [unoPlayers, unoCurrentIndex, drawCardsForUnoPlayer]);

  const endUnoTurnAfterDraw = useCallback(() => {
    const count = unoPlayers.length;
    const nextIndex = stepPlayerIndex(unoCurrentIndex, unoDirection, count, 0);
    setUnoCurrentIndex(nextIndex);
    setUnoHasDrawn(false);
    setUnoPhase('playing');
    setUnoLastMessage(null);
  }, [unoPlayers, unoCurrentIndex, unoDirection]);

  const startNextUnoRound = useCallback(() => {
    setUnoRoundNumber((n) => n + 1);
    dealUnoRound(unoPlayers);
  }, [dealUnoRound, unoPlayers]);

  const restartUnoGame = useCallback(() => openUnoGame(), [openUnoGame]);

  const unoGame = useMemo(() => {
    if (!unoActive) return null;
    const currentPlayer = unoPlayers[unoCurrentIndex];
    const catchable = unoPlayers.find((p) => (unoHands[p.id]?.length ?? 0) === 1 && !unoDeclared[p.id]);
    const victim = unoPlayers[stepPlayerIndex(unoCurrentIndex, unoDirection, unoPlayers.length, 0)];
    return {
      active: unoActive,
      players: unoPlayers,
      hand: currentPlayer ? (unoHands[currentPlayer.id] ?? []) : [],
      handCounts: Object.fromEntries(unoPlayers.map((p) => [p.id, (unoHands[p.id] ?? []).length])),
      topCard: unoPiles.discard[unoPiles.discard.length - 1] ?? null,
      activeColor: unoActiveColor,
      currentPlayerIndex: unoCurrentIndex,
      direction: unoDirection,
      phase: unoPhase,
      hasDrawnThisTurn: unoHasDrawn,
      winnerId: unoWinnerId,
      lastMessage: unoLastMessage,
      drawPileCount: unoPiles.draw.length,
      roundNumber: unoRoundNumber,
      cumulativeScores: unoCumulative,
      lastRoundScore: unoLastRoundScore,
      lastRoundHandCounts: unoLastRoundHandCounts,
      catchableId: unoPhase === 'playing' ? (catchable?.id ?? null) : null,
      drawFourVictimName: victim?.name ?? null,
    };
  }, [
    unoActive,
    unoPlayers,
    unoHands,
    unoPiles,
    unoActiveColor,
    unoCurrentIndex,
    unoDirection,
    unoPhase,
    unoHasDrawn,
    unoWinnerId,
    unoLastMessage,
    unoDeclared,
    unoRoundNumber,
    unoCumulative,
    unoLastRoundScore,
    unoLastRoundHandCounts,
  ]);

  // "Sıra kimde" bandı artık ayrı bir "telefonu geçir" ekranı gerektirmiyor;
  // lastMessage sadece kısa bir bant olarak görünüp kendiliğinden kaybolur.
  useEffect(() => {
    if (!unoLastMessage) return;
    const t = setTimeout(() => setUnoLastMessage(null), 2800);
    return () => clearTimeout(t);
  }, [unoLastMessage]);

  // ---------------------------------------------------------------------
  // Tabu
  // ---------------------------------------------------------------------
  const openTabu = useCallback(() => {
    const c = callRef.current;
    const players: SpyPlayer[] = [
      { id: 'me', name: t('you'), c1: '#6366f1', c2: '#ec4899' },
      ...(c?.parts.map((p) => ({ id: p.id, name: p.name, c1: p.c1, c2: p.c2 })) ?? []),
    ];
    setTabuOrder(players);
    setTabuDescriberIndex(0);
    setTabuPhase('ready');
    setTabuCard(null);
    setTabuCorrectCount(0);
    setTabuSkippedCount(0);
    setTabuDescribedWords([]);
    setTabuScores(Object.fromEntries(players.map((p) => [p.id, 0])));
    setTabuActive(true);
  }, [t]);

  const closeTabu = useCallback(() => setTabuActive(false), []);

  const startTabuRound = useCallback(() => {
    setTabuCorrectCount(0);
    setTabuSkippedCount(0);
    setTabuDescribedWords([]);
    setTabuCard(tabuPool[Math.floor(Math.random() * tabuPool.length)]);
    setTabuPhase('playing');
  }, [tabuPool]);

  const markTabuCorrect = useCallback(() => {
    const describer = tabuOrder[tabuDescriberIndex];
    setTabuCard((card) => {
      if (card) setTabuDescribedWords((w) => [...w, card.word]);
      return tabuPool[Math.floor(Math.random() * tabuPool.length)];
    });
    setTabuCorrectCount((n) => n + 1);
    if (describer) setTabuScores((s) => ({ ...s, [describer.id]: (s[describer.id] ?? 0) + 1 }));
  }, [tabuOrder, tabuDescriberIndex, tabuPool]);

  const markTabuSkip = useCallback(() => {
    setTabuSkippedCount((n) => n + 1);
    setTabuCard(tabuPool[Math.floor(Math.random() * tabuPool.length)]);
  }, [tabuPool]);

  const endTabuRound = useCallback(() => setTabuPhase('round-result'), []);

  const nextTabuPlayer = useCallback(() => {
    setTabuDescriberIndex((i) => (tabuOrder.length ? (i + 1) % tabuOrder.length : 0));
    setTabuPhase('ready');
    setTabuCard(null);
  }, [tabuOrder.length]);

  const restartTabu = useCallback(() => openTabu(), [openTabu]);

  const tabu = useMemo(() => {
    if (!tabuActive) return null;
    return {
      active: tabuActive,
      order: tabuOrder,
      describerIndex: tabuDescriberIndex,
      phase: tabuPhase,
      card: tabuCard,
      correctCount: tabuCorrectCount,
      skippedCount: tabuSkippedCount,
      describedWords: tabuDescribedWords,
      scores: tabuScores,
    };
  }, [tabuActive, tabuOrder, tabuDescriberIndex, tabuPhase, tabuCard, tabuCorrectCount, tabuSkippedCount, tabuDescribedWords, tabuScores]);

  // ---------------------------------------------------------------------
  // Bil Bakalım (bilgi yarışması)
  // ---------------------------------------------------------------------
  const QUIZ_SESSION_LENGTH = 8;

  const openQuiz = useCallback(() => {
    const c = callRef.current;
    const players: SpyPlayer[] = [
      { id: 'me', name: t('you'), c1: '#6366f1', c2: '#ec4899' },
      ...(c?.parts.map((p) => ({ id: p.id, name: p.name, c1: p.c1, c2: p.c2 })) ?? []),
    ];
    const questions = shuffle(quizPool).slice(0, QUIZ_SESSION_LENGTH);
    setQuizPlayers(players);
    setQuizQuestions(questions);
    setQuizIndex(0);
    setQuizPhase('question');
    setQuizSelectedIndex(null);
    setQuizCorrectIds([]);
    setQuizScores(Object.fromEntries(players.map((p) => [p.id, 0])));
    setQuizActive(true);
  }, [t, quizPool]);

  const closeQuiz = useCallback(() => setQuizActive(false), []);

  const selectQuizOption = useCallback((index: number) => {
    setQuizSelectedIndex(index);
    setQuizPhase('revealed');
  }, []);

  const toggleQuizCorrectPlayer = useCallback((id: string) => {
    setQuizCorrectIds((ids) => {
      const already = ids.includes(id);
      setQuizScores((s) => ({ ...s, [id]: (s[id] ?? 0) + (already ? -1 : 1) }));
      return already ? ids.filter((x) => x !== id) : [...ids, id];
    });
  }, []);

  const nextQuizQuestion = useCallback(() => {
    setQuizIndex((i) => {
      const next = i + 1;
      if (next >= quizQuestions.length) {
        setQuizPhase('final');
        return i;
      }
      setQuizCorrectIds([]);
      setQuizSelectedIndex(null);
      setQuizPhase('question');
      return next;
    });
  }, [quizQuestions.length]);

  const restartQuiz = useCallback(() => openQuiz(), [openQuiz]);

  const quiz = useMemo(() => {
    if (!quizActive) return null;
    return {
      active: quizActive,
      players: quizPlayers,
      questions: quizQuestions,
      currentIndex: quizIndex,
      phase: quizPhase,
      selectedIndex: quizSelectedIndex,
      correctPlayerIds: quizCorrectIds,
      scores: quizScores,
    };
  }, [quizActive, quizPlayers, quizQuestions, quizIndex, quizPhase, quizSelectedIndex, quizCorrectIds, quizScores]);

  // ---------------------------------------------------------------------
  // Okey
  // ---------------------------------------------------------------------
  const openOkeyGame = useCallback(() => {
    const c = callRef.current;
    const allPlayers: SpyPlayer[] = [
      { id: 'me', name: t('you'), c1: '#6366f1', c2: '#ec4899' },
      ...(c?.parts.map((p) => ({ id: p.id, name: p.name, c1: p.c1, c2: p.c2 })) ?? []),
    ];
    const players = allPlayers.slice(0, 4); // Okey standart olarak en fazla 4 kisiyle oynanir

    const set = shuffleTiles(buildOkeySet());
    const hands: Record<string, OkeyTile[]> = {};
    let idx = 0;
    players.forEach((p, i) => {
      const count = i === 0 ? 15 : 14; // dagitici (ilk oyuncu) 15 tasla baslar
      hands[p.id] = set.slice(idx, idx + count);
      idx += count;
    });
    const indicator = set[idx];
    idx += 1;
    const rest = set.slice(idx);

    setOkeyPlayers(players);
    setOkeyHands(hands);
    setOkeyDrawPile(rest);
    setOkeyDiscardPile([]);
    setOkeyIndicator(indicator);
    setOkeyCurrentIndex(0);
    setOkeyPhase('discard'); // dagitici direkt atar, ilk cekme yok
    setOkeyWinnerId(null);
    setOkeyWinType(null);
    setOkeyActive(true);
  }, [t]);

  const closeOkeyGame = useCallback(() => setOkeyActive(false), []);

  const okeyOf = useMemo(() => (okeyIndicator ? computeOkeyOf(okeyIndicator) : null), [okeyIndicator]);

  const drawOkeyFromPile = useCallback(() => {
    const player = okeyPlayers[okeyCurrentIndex];
    if (!player || okeyPhase !== 'draw') return;
    setOkeyDrawPile((pile) => {
      if (pile.length === 0) {
        setOkeyPhase('game-over');
        setOkeyWinnerId(null);
        setOkeyWinType(null);
        return pile;
      }
      const [tile, ...rest] = pile;
      setOkeyHands((h) => ({ ...h, [player.id]: [...(h[player.id] ?? []), tile] }));
      setOkeyPhase('discard');
      return rest;
    });
  }, [okeyPlayers, okeyCurrentIndex, okeyPhase]);

  const drawOkeyFromDiscard = useCallback(() => {
    const player = okeyPlayers[okeyCurrentIndex];
    if (!player || okeyPhase !== 'draw') return;
    setOkeyDiscardPile((pile) => {
      if (pile.length === 0) return pile;
      const tile = pile[pile.length - 1];
      const rest = pile.slice(0, -1);
      setOkeyHands((h) => ({ ...h, [player.id]: [...(h[player.id] ?? []), tile] }));
      setOkeyPhase('discard');
      return rest;
    });
  }, [okeyPlayers, okeyCurrentIndex, okeyPhase]);

  const reorderOkeyHand = useCallback(
    (fromIndex: number, toIndex: number) => {
      const player = okeyPlayers[okeyCurrentIndex];
      if (!player) return;
      setOkeyHands((h) => {
        const hand = (h[player.id] ?? []).slice();
        if (fromIndex < 0 || fromIndex >= hand.length || toIndex < 0 || toIndex >= hand.length) return h;
        const [moved] = hand.splice(fromIndex, 1);
        hand.splice(toIndex, 0, moved);
        return { ...h, [player.id]: hand };
      });
    },
    [okeyPlayers, okeyCurrentIndex]
  );

  const autoSortOkeyHand = useCallback(() => {
    const player = okeyPlayers[okeyCurrentIndex];
    if (!player) return;
    setOkeyHands((h) => {
      const hand = (h[player.id] ?? []).slice();
      hand.sort((a, b) => {
        const aRank = a.kind === 'fakejoker' ? [99, 0] : [OKEY_COLORS.indexOf(a.color), a.number];
        const bRank = b.kind === 'fakejoker' ? [99, 0] : [OKEY_COLORS.indexOf(b.color), b.number];
        return aRank[0] - bRank[0] || aRank[1] - bRank[1];
      });
      return { ...h, [player.id]: hand };
    });
  }, [okeyPlayers, okeyCurrentIndex]);

  const discardOkeyTile = useCallback(
    (tileId: string) => {
      const player = okeyPlayers[okeyCurrentIndex];
      if (!player || okeyPhase !== 'discard') return;
      const hand = okeyHands[player.id] ?? [];
      const tile = hand.find((t) => t.id === tileId);
      if (!tile) return;
      const newHand = hand.filter((t) => t.id !== tileId);
      setOkeyHands((h) => ({ ...h, [player.id]: newHand }));
      setOkeyDiscardPile((d) => [...d, tile]);

      if (newHand.length === 14 && canFormAllPairs(newHand, okeyOf)) {
        setOkeyWinnerId(player.id);
        setOkeyWinType('pairs');
        setOkeyPhase('game-over');
        return;
      }

      const count = okeyPlayers.length;
      const nextIndex = (okeyCurrentIndex + 1) % count;
      setOkeyCurrentIndex(nextIndex);
      setOkeyPhase('draw');
    },
    [okeyPlayers, okeyCurrentIndex, okeyPhase, okeyHands, okeyOf]
  );

  const declareOkeyWin = useCallback(() => {
    const player = okeyPlayers[okeyCurrentIndex];
    if (!player) return;
    const hand = okeyHands[player.id] ?? [];
    if (canPartitionIntoMelds(hand, okeyOf)) {
      setOkeyWinnerId(player.id);
      setOkeyWinType('melds');
      setOkeyPhase('game-over');
    }
  }, [okeyPlayers, okeyCurrentIndex, okeyHands, okeyOf]);

  const restartOkeyGame = useCallback(() => openOkeyGame(), [openOkeyGame]);

  const okeyGame = useMemo(() => {
    if (!okeyActive) return null;
    const currentPlayer = okeyPlayers[okeyCurrentIndex];
    const hand = currentPlayer ? (okeyHands[currentPlayer.id] ?? []) : [];
    const canWinMelds = okeyPhase === 'discard' && canPartitionIntoMelds(hand, okeyOf);
    return {
      active: okeyActive,
      players: okeyPlayers,
      hand,
      handCounts: Object.fromEntries(okeyPlayers.map((p) => [p.id, (okeyHands[p.id] ?? []).length])),
      drawPileCount: okeyDrawPile.length,
      discardTop: okeyDiscardPile[okeyDiscardPile.length - 1] ?? null,
      indicator: okeyIndicator,
      okeyOf,
      currentPlayerIndex: okeyCurrentIndex,
      phase: okeyPhase,
      canWinMelds,
      winnerId: okeyWinnerId,
      winType: okeyWinType,
    };
  }, [
    okeyActive,
    okeyPlayers,
    okeyHands,
    okeyCurrentIndex,
    okeyDrawPile,
    okeyDiscardPile,
    okeyIndicator,
    okeyOf,
    okeyPhase,
    okeyWinnerId,
    okeyWinType,
  ]);

  // ---------------------------------------------------------------------
  // 101 Okey (ilerlemeli masa: acilis >=101, acildiktan sonra mevcut
  // per/gruplara tas ekleme, taslar bitince kazanma - bkz. proje notlari)
  // ---------------------------------------------------------------------
  const dealYuzBirTiles = useCallback((players: SpyPlayer[]) => {
    const set = shuffleTiles(buildOkeySet());
    const hands: Record<string, OkeyTile[]> = {};
    let idx = 0;
    players.forEach((p, i) => {
      const count = i === 0 ? 22 : 21; // dagitici (ilk oyuncu) 22 tasla baslar
      hands[p.id] = set.slice(idx, idx + count);
      idx += count;
    });
    const indicator = set[idx];
    idx += 1;
    const rest = set.slice(idx);

    setYuzbirHands(hands);
    setYuzbirDrawPile(rest);
    setYuzbirDiscardPile([]);
    setYuzbirIndicator(indicator);
    setYuzbirCurrentIndex(0);
    setYuzbirPhase('discard'); // dagitici direkt atar, ilk cekme yok
    setYuzbirWinnerId(null);
    setYuzbirLastRoundResults(null);
    setYuzbirHasOpened(Object.fromEntries(players.map((p) => [p.id, false])));
    setYuzbirTableMelds([]);
    setYuzbirSelectedIds([]);
    setYuzbirPendingMelds([]);
  }, []);

  const openYuzBirGame = useCallback(() => {
    const c = callRef.current;
    const real: SpyPlayer[] = [
      { id: 'me', name: t('you'), c1: '#6366f1', c2: '#ec4899' },
      ...(c?.parts.map((p) => ({ id: p.id, name: p.name, c1: p.c1, c2: p.c2 })) ?? []),
    ];
    // 101 Okey tam olarak 4 kisiyle oynanir; masada yeterli kisi yoksa
    // yerel "elden ele" oyun icin yer tutucu oyuncularla tamamlanir.
    const PLACEHOLDER_COLORS: [string, string][] = [
      ['#f59e0b', '#ef4444'],
      ['#10b981', '#0ea5e9'],
      ['#8b5cf6', '#ec4899'],
    ];
    const players = real.slice(0, 4);
    while (players.length < 4) {
      const i = players.length;
      const [c1, c2] = PLACEHOLDER_COLORS[(i - 1) % PLACEHOLDER_COLORS.length];
      players.push({ id: `misafir-${i}`, name: `Oyuncu ${i + 1}`, c1, c2 });
    }

    setYuzbirPlayers(players);
    setYuzbirCumulative(Object.fromEntries(players.map((p) => [p.id, 0])));
    setYuzbirRoundNumber(1);
    dealYuzBirTiles(players);
    setYuzbirActive(true);
  }, [dealYuzBirTiles, t]);

  const closeYuzBirGame = useCallback(() => setYuzbirActive(false), []);

  const yuzbirOf = useMemo(() => (yuzbirIndicator ? computeOkeyOf(yuzbirIndicator) : null), [yuzbirIndicator]);

  const drawYuzBirFromPile = useCallback(() => {
    const player = yuzbirPlayers[yuzbirCurrentIndex];
    if (!player || yuzbirPhase !== 'draw') return;
    setYuzbirDrawPile((pile) => {
      if (pile.length === 0) {
        setYuzbirPhase('game-over');
        setYuzbirWinnerId(null);
        setYuzbirLastRoundResults(null);
        return pile;
      }
      const [tile, ...rest] = pile;
      setYuzbirHands((h) => ({ ...h, [player.id]: [...(h[player.id] ?? []), tile] }));
      setYuzbirPhase('discard');
      setYuzbirSelectedIds([]);
      return rest;
    });
  }, [yuzbirPlayers, yuzbirCurrentIndex, yuzbirPhase]);

  const drawYuzBirFromDiscard = useCallback(() => {
    const player = yuzbirPlayers[yuzbirCurrentIndex];
    if (!player || yuzbirPhase !== 'draw') return;
    setYuzbirDiscardPile((pile) => {
      if (pile.length === 0) return pile;
      const tile = pile[pile.length - 1];
      const rest = pile.slice(0, -1);
      setYuzbirHands((h) => ({ ...h, [player.id]: [...(h[player.id] ?? []), tile] }));
      setYuzbirPhase('discard');
      setYuzbirSelectedIds([]);
      return rest;
    });
  }, [yuzbirPlayers, yuzbirCurrentIndex, yuzbirPhase]);

  const reorderYuzBirHand = useCallback(
    (fromIndex: number, toIndex: number) => {
      const player = yuzbirPlayers[yuzbirCurrentIndex];
      if (!player) return;
      setYuzbirHands((h) => {
        const hand = (h[player.id] ?? []).slice();
        if (fromIndex < 0 || fromIndex >= hand.length || toIndex < 0 || toIndex >= hand.length) return h;
        const [moved] = hand.splice(fromIndex, 1);
        hand.splice(toIndex, 0, moved);
        return { ...h, [player.id]: hand };
      });
    },
    [yuzbirPlayers, yuzbirCurrentIndex]
  );

  const autoSortYuzBirHand = useCallback(() => {
    const player = yuzbirPlayers[yuzbirCurrentIndex];
    if (!player) return;
    setYuzbirHands((h) => {
      const hand = (h[player.id] ?? []).slice();
      hand.sort((a, b) => {
        const aRank = a.kind === 'fakejoker' ? [99, 0] : [OKEY_COLORS.indexOf(a.color), a.number];
        const bRank = b.kind === 'fakejoker' ? [99, 0] : [OKEY_COLORS.indexOf(b.color), b.number];
        return aRank[0] - bRank[0] || aRank[1] - bRank[1];
      });
      return { ...h, [player.id]: hand };
    });
  }, [yuzbirPlayers, yuzbirCurrentIndex]);

  const toggleYuzBirHandSelect = useCallback(
    (tileId: string) => {
      if (yuzbirPhase !== 'discard') return;
      setYuzbirSelectedIds((ids) => (ids.includes(tileId) ? ids.filter((id) => id !== tileId) : [...ids, tileId]));
    },
    [yuzbirPhase]
  );

  // Secili el taslarindan (>=3) TEK bir gecerli seri/grup kurmayi dener.
  // Oyuncu daha once acmadiysa masaya degil, "bekleyen acilis" alanina konur
  // (toplam >=101 olup "Ac" ile onaylanana kadar kalici degildir); acmissa
  // dogrudan masaya kalici meld olarak eklenir.
  const formYuzBirMeldFromSelection = useCallback(() => {
    const player = yuzbirPlayers[yuzbirCurrentIndex];
    if (!player || yuzbirPhase !== 'discard' || yuzbirSelectedIds.length < 3) return;
    const hand = yuzbirHands[player.id] ?? [];
    const selectedSet = new Set(yuzbirSelectedIds);
    const selectedTiles = hand.filter((t) => selectedSet.has(t.id));
    if (selectedTiles.length !== yuzbirSelectedIds.length) return;
    const check = validateMeld(selectedTiles, yuzbirOf);
    if (!check.valid) return;

    const newHand = hand.filter((t) => !selectedSet.has(t.id));
    setYuzbirHands((h) => ({ ...h, [player.id]: newHand }));
    setYuzbirSelectedIds([]);

    const meld: YuzBirMeld = {
      id: `m${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      tiles: selectedTiles,
      kind: check.kind,
      ownerId: player.id,
      value: check.value,
    };

    if (yuzbirHasOpened[player.id]) {
      setYuzbirTableMelds((m) => [...m, meld]);
      if (newHand.length === 0) {
        const results = computeYuzBirRoundResults(yuzbirPlayers, { ...yuzbirHands, [player.id]: newHand }, yuzbirHasOpened, player.id, yuzbirOf);
        setYuzbirCumulative((c) => {
          const next = { ...c };
          for (const [id, r] of Object.entries(results)) next[id] = (next[id] ?? 0) + r.scoreDelta;
          return next;
        });
        setYuzbirLastRoundResults(results);
        setYuzbirWinnerId(player.id);
        setYuzbirPhase('game-over');
      }
    } else {
      setYuzbirPendingMelds((m) => [...m, meld]);
    }
  }, [yuzbirPlayers, yuzbirCurrentIndex, yuzbirPhase, yuzbirSelectedIds, yuzbirHands, yuzbirOf, yuzbirHasOpened]);

  // Bekleyen acilis meldlerinin toplami >=101 ise kalici olarak masaya koyar
  // ve oyuncuyu "acilmis" isaretler (bu turdan sonraki turlarinda mevcut
  // meldlere tas ekleyebilir).
  const commitYuzBirOpening = useCallback(() => {
    const player = yuzbirPlayers[yuzbirCurrentIndex];
    if (!player || yuzbirPhase !== 'discard' || yuzbirHasOpened[player.id] || yuzbirPendingMelds.length === 0) return;
    const totalValue = yuzbirPendingMelds.reduce((sum, m) => sum + m.value, 0);
    if (totalValue < 101) return;

    setYuzbirTableMelds((m) => [...m, ...yuzbirPendingMelds]);
    const updatedOpened = { ...yuzbirHasOpened, [player.id]: true };
    setYuzbirHasOpened(updatedOpened);
    setYuzbirPendingMelds([]);

    const hand = yuzbirHands[player.id] ?? [];
    if (hand.length === 0) {
      const results = computeYuzBirRoundResults(yuzbirPlayers, yuzbirHands, updatedOpened, player.id, yuzbirOf);
      setYuzbirCumulative((c) => {
        const next = { ...c };
        for (const [id, r] of Object.entries(results)) next[id] = (next[id] ?? 0) + r.scoreDelta;
        return next;
      });
      setYuzbirLastRoundResults(results);
      setYuzbirWinnerId(player.id);
      setYuzbirPhase('game-over');
    }
  }, [yuzbirPlayers, yuzbirCurrentIndex, yuzbirPhase, yuzbirHasOpened, yuzbirPendingMelds, yuzbirHands, yuzbirOf]);

  // Bekleyen (henuz masaya konmamis) acilis meldlerini geri elin bozar.
  const cancelYuzBirPendingMelds = useCallback(() => {
    const player = yuzbirPlayers[yuzbirCurrentIndex];
    if (!player || yuzbirPendingMelds.length === 0) return;
    const returned = yuzbirPendingMelds.flatMap((m) => m.tiles);
    setYuzbirHands((h) => ({ ...h, [player.id]: [...(h[player.id] ?? []), ...returned] }));
    setYuzbirPendingMelds([]);
  }, [yuzbirPlayers, yuzbirCurrentIndex, yuzbirPendingMelds]);

  // Acilmis bir oyuncu, sectigi TEK el tasini masadaki mevcut bir meld'e
  // (kendisinin ya da baska oyuncunun) ekler - seriyi uzatir ya da gruba
  // 4uncu/eksik rengi tamamlar.
  const addYuzBirSelectedTileToMeld = useCallback(
    (meldId: string) => {
      const player = yuzbirPlayers[yuzbirCurrentIndex];
      if (!player || yuzbirPhase !== 'discard' || !yuzbirHasOpened[player.id] || yuzbirSelectedIds.length !== 1) return;
      const hand = yuzbirHands[player.id] ?? [];
      const tile = hand.find((t) => t.id === yuzbirSelectedIds[0]);
      const meld = yuzbirTableMelds.find((m) => m.id === meldId);
      if (!tile || !meld) return;
      const result = canAddTileToMeld(meld.tiles, tile, yuzbirOf);
      if (!result.ok) return;

      const newHand = hand.filter((t) => t.id !== tile.id);
      setYuzbirHands((h) => ({ ...h, [player.id]: newHand }));
      setYuzbirTableMelds((melds) => melds.map((m) => (m.id === meldId ? { ...m, tiles: result.tiles, value: result.value } : m)));
      setYuzbirSelectedIds([]);

      if (newHand.length === 0) {
        const results = computeYuzBirRoundResults(yuzbirPlayers, { ...yuzbirHands, [player.id]: newHand }, yuzbirHasOpened, player.id, yuzbirOf);
        setYuzbirCumulative((c) => {
          const next = { ...c };
          for (const [id, r] of Object.entries(results)) next[id] = (next[id] ?? 0) + r.scoreDelta;
          return next;
        });
        setYuzbirLastRoundResults(results);
        setYuzbirWinnerId(player.id);
        setYuzbirPhase('game-over');
      }
    },
    [yuzbirPlayers, yuzbirCurrentIndex, yuzbirPhase, yuzbirHasOpened, yuzbirSelectedIds, yuzbirHands, yuzbirTableMelds, yuzbirOf]
  );

  const discardYuzBirTile = useCallback(
    (tileId: string) => {
      const player = yuzbirPlayers[yuzbirCurrentIndex];
      if (!player || yuzbirPhase !== 'discard') return;
      if (yuzbirPendingMelds.length > 0) return; // once acilis bekliyor: ac ya da geri al
      const hand = yuzbirHands[player.id] ?? [];
      const tile = hand.find((t) => t.id === tileId);
      if (!tile) return;
      const newHand = hand.filter((t) => t.id !== tileId);
      setYuzbirHands((h) => ({ ...h, [player.id]: newHand }));
      setYuzbirDiscardPile((d) => [...d, tile]);
      setYuzbirSelectedIds([]);

      if (newHand.length === 0) {
        const results = computeYuzBirRoundResults(yuzbirPlayers, { ...yuzbirHands, [player.id]: newHand }, yuzbirHasOpened, player.id, yuzbirOf);
        setYuzbirCumulative((c) => {
          const next = { ...c };
          for (const [id, r] of Object.entries(results)) next[id] = (next[id] ?? 0) + r.scoreDelta;
          return next;
        });
        setYuzbirLastRoundResults(results);
        setYuzbirWinnerId(player.id);
        setYuzbirPhase('game-over');
        return;
      }

      const count = yuzbirPlayers.length;
      const nextIndex = (yuzbirCurrentIndex + 1) % count;
      setYuzbirCurrentIndex(nextIndex);
      setYuzbirPhase('draw');
    },
    [yuzbirPlayers, yuzbirCurrentIndex, yuzbirPhase, yuzbirPendingMelds, yuzbirHands, yuzbirHasOpened, yuzbirOf]
  );

  const startNextYuzBirRound = useCallback(() => {
    setYuzbirRoundNumber((n) => n + 1);
    dealYuzBirTiles(yuzbirPlayers);
  }, [dealYuzBirTiles, yuzbirPlayers]);

  const restartYuzBirGame = useCallback(() => openYuzBirGame(), [openYuzBirGame]);

  const yuzbirGame = useMemo(() => {
    if (!yuzbirActive) return null;
    const currentPlayer = yuzbirPlayers[yuzbirCurrentIndex];
    const hand = currentPlayer ? (yuzbirHands[currentPlayer.id] ?? []) : [];
    const selectedTiles = hand.filter((t) => yuzbirSelectedIds.includes(t.id));
    const meldCheck = selectedTiles.length >= 3 ? validateMeld(selectedTiles, yuzbirOf) : null;
    const canFormMeld = !!meldCheck?.valid;
    const pendingValue = yuzbirPendingMelds.reduce((sum, m) => sum + m.value, 0);
    const alreadyOpened = currentPlayer ? !!yuzbirHasOpened[currentPlayer.id] : false;
    const canCommitOpening = !alreadyOpened && pendingValue >= 101 && yuzbirPendingMelds.length > 0;
    const canAddToMeld = alreadyOpened && yuzbirSelectedIds.length === 1;
    const canDiscard = yuzbirPendingMelds.length === 0;
    return {
      active: yuzbirActive,
      players: yuzbirPlayers,
      hand,
      handCounts: Object.fromEntries(yuzbirPlayers.map((p) => [p.id, (yuzbirHands[p.id] ?? []).length])),
      drawPileCount: yuzbirDrawPile.length,
      discardTop: yuzbirDiscardPile[yuzbirDiscardPile.length - 1] ?? null,
      indicator: yuzbirIndicator,
      okeyOf: yuzbirOf,
      currentPlayerIndex: yuzbirCurrentIndex,
      phase: yuzbirPhase,
      hasOpened: yuzbirHasOpened,
      tableMelds: yuzbirTableMelds,
      selectedHandIds: yuzbirSelectedIds,
      pendingMelds: yuzbirPendingMelds,
      pendingValue,
      canFormMeld,
      canCommitOpening,
      canAddToMeld,
      canDiscard,
      winnerId: yuzbirWinnerId,
      roundNumber: yuzbirRoundNumber,
      cumulativeScores: yuzbirCumulative,
      lastRoundResults: yuzbirLastRoundResults,
    };
  }, [
    yuzbirActive,
    yuzbirPlayers,
    yuzbirHands,
    yuzbirCurrentIndex,
    yuzbirDrawPile,
    yuzbirDiscardPile,
    yuzbirIndicator,
    yuzbirOf,
    yuzbirPhase,
    yuzbirHasOpened,
    yuzbirTableMelds,
    yuzbirSelectedIds,
    yuzbirPendingMelds,
    yuzbirWinnerId,
    yuzbirRoundNumber,
    yuzbirCumulative,
    yuzbirLastRoundResults,
  ]);

  const value: AppContextValue = {
    user,
    login,
    register,
    socialLogin,
    logout,
    updateProfile,

    query,
    setQuery,
    fquery,
    setFquery,
    rooms,
    createRoom,
    history,
    notif,
    toggleNotif,

    pending,
    startDial,
    cancelDial,

    call,
    mic,
    cam,
    front,
    share,
    locked,
    effect,
    chatOpen,
    unread,
    typing,
    mediaErr,
    enterCall,
    leaveCall,
    toggleMic,
    toggleCam,
    flipCamera,
    toggleShare,
    toggleChat,
    toggleLock,
    sendMessage,
    reactToMessage,
    inviteToRoom,
    setEffect,

    rank,
    openRankGame,
    closeRankGame,
    resetRankRound,
    placeCurrentRank,
    finishRankGame,

    spy,
    openSpyGame,
    closeSpyGame,
    toggleSpyCard,
    nextSpyPlayer,
    startSpyVoting,
    castSpyVote,
    restartSpyGame,

    truthOrDare,
    openTruthOrDare,
    closeTruthOrDare,
    chooseTruth,
    chooseDare,
    nextTdPlayer,

    vampireGame,
    openVampireGame,
    closeVampireGame,
    toggleVkCard,
    nextVkPlayer,
    selectNightVictim,
    continueToVote,
    selectDayVote,
    continueToNight,
    restartVampireGame,

    drawGame,
    openDrawGame,
    closeDrawGame,
    startDrawingRound,
    markGuessed,
    markTimeout,
    nextDrawRound,
    restartDrawGame,

    headsUp,
    openHeadsUp,
    closeHeadsUp,
    startHuRound,
    markHuCorrect,
    markHuSkip,
    endHuRound,
    nextHuPlayer,
    restartHeadsUp,

    unoGame,
    openUnoGame,
    closeUnoGame,
    playUnoCard,
    chooseUnoWildColor,
    drawUnoCard,
    endUnoTurnAfterDraw,
    declareUno,
    skipUnoDeclare,
    catchUnoForgetter,
    resolveDrawFourChallenge,
    startNextUnoRound,
    restartUnoGame,

    tabu,
    openTabu,
    closeTabu,
    startTabuRound,
    markTabuCorrect,
    markTabuSkip,
    endTabuRound,
    nextTabuPlayer,
    restartTabu,

    quiz,
    openQuiz,
    closeQuiz,
    selectQuizOption,
    toggleQuizCorrectPlayer,
    nextQuizQuestion,
    restartQuiz,

    okeyGame,
    openOkeyGame,
    closeOkeyGame,
    drawOkeyFromPile,
    drawOkeyFromDiscard,
    reorderOkeyHand,
    autoSortOkeyHand,
    discardOkeyTile,
    declareOkeyWin,
    restartOkeyGame,

    yuzbirGame,
    openYuzBirGame,
    closeYuzBirGame,
    drawYuzBirFromPile,
    drawYuzBirFromDiscard,
    reorderYuzBirHand,
    autoSortYuzBirHand,
    toggleYuzBirHandSelect,
    formYuzBirMeldFromSelection,
    commitYuzBirOpening,
    cancelYuzBirPendingMelds,
    addYuzBirSelectedTileToMeld,
    discardYuzBirTile,
    startNextYuzBirRound,
    restartYuzBirGame,

    toast,
    toastMsg,
    sheet,
    openSheet,
    closeSheet,

    knockRequest,
    acceptKnock,
    rejectKnock,
  };

  if (!hydrated) return null;

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
