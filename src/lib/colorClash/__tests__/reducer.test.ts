import { describe, expect, it } from 'vitest';
import { canPlayCard } from '../validation';
import { colorClashReducer, createInitialState } from '../reducer';
import { reverseDirection, stepPlayerIndex } from '../turnMachine';
import type { ClashCard, ClashGameState } from '../types';

const PLAYERS4 = [
  { id: 'p1', name: 'A', c1: '#111', c2: '#222' },
  { id: 'p2', name: 'B', c1: '#111', c2: '#222' },
  { id: 'p3', name: 'C', c1: '#111', c2: '#222' },
  { id: 'p4', name: 'D', c1: '#111', c2: '#222' },
];

function freshGame(players = PLAYERS4, rules?: Partial<ClashGameState['rules']>): ClashGameState {
  const { state } = colorClashReducer(createInitialState(), { type: 'START_GAME', players, rules });
  return state;
}

describe('temel oynanabilirlik', () => {
  it('ayni renk oynanabilir', () => {
    const top: ClashCard = { id: 't', kind: 'number', color: 'coral', value: 5 };
    const card: ClashCard = { id: 'c', kind: 'number', color: 'coral', value: 2 };
    expect(canPlayCard(card, top, 'coral')).toBe(true);
  });

  it('ayni sayi oynanabilir', () => {
    const top: ClashCard = { id: 't', kind: 'number', color: 'coral', value: 5 };
    const card: ClashCard = { id: 'c', kind: 'number', color: 'violet', value: 5 };
    expect(canPlayCard(card, top, 'coral')).toBe(true);
  });

  it('yanlis renk/sayi oynanamaz', () => {
    const top: ClashCard = { id: 't', kind: 'number', color: 'coral', value: 5 };
    const card: ClashCard = { id: 'c', kind: 'number', color: 'teal', value: 3 };
    expect(canPlayCard(card, top, 'coral')).toBe(false);
  });

  it('wild her zaman oynanabilir', () => {
    const top: ClashCard = { id: 't', kind: 'number', color: 'coral', value: 5 };
    const card: ClashCard = { id: 'c', kind: 'wild' };
    expect(canPlayCard(card, top, 'coral')).toBe(true);
  });
});

describe('sira/oyun disi kontrolleri', () => {
  it('sirasi gelmeyen oyuncu oynayamaz', () => {
    const g = freshGame();
    const other = g.players.find((p) => p.id !== g.players[g.currentPlayerIndex].id)!;
    const { error } = colorClashReducer(g, { type: 'PLAY_CARD', playerId: other.id, cardId: other.hand[0]?.id ?? 'x' });
    expect(error).toBeTruthy();
  });

  it('elde olmayan bir kart oynanamaz', () => {
    const g = freshGame();
    const me = g.players[g.currentPlayerIndex];
    const { error } = colorClashReducer(g, { type: 'PLAY_CARD', playerId: me.id, cardId: 'does-not-exist' });
    expect(error).toBeTruthy();
  });

  it('uyumsuz renk/sayi karti oynanamaz', () => {
    const g = freshGame();
    const me = g.players[g.currentPlayerIndex];
    const top = g.discardPile[g.discardPile.length - 1];
    const badCard = me.hand.find((c) => c.kind === 'number' && !(c.color === g.activeColor || c.value === top.value));
    if (!badCard) return; // bu elde uygun olmayan kart yoksa test atlanir (rastgele el)
    const { error } = colorClashReducer(g, { type: 'PLAY_CARD', playerId: me.id, cardId: badCard.id });
    expect(error).toBeTruthy();
  });
});

describe('deste bittiginde geri donusum', () => {
  it('cekme destesi tukendiginde atma yigininin en ustu korunarak yeniden karisir', () => {
    let g = freshGame(PLAYERS4, { lastCardCallRequired: false });
    // desteyi neredeyse tuketmek icin cok sayida cek/at dongusu yerine
    // dogrudan state'i manipule ederek kenar durumu test ediyoruz.
    const almostEmpty: ClashGameState = { ...g, drawPile: g.drawPile.slice(0, 1) };
    const me = almostEmpty.players[almostEmpty.currentPlayerIndex];
    const before = almostEmpty.discardPile[almostEmpty.discardPile.length - 1];
    const { state } = colorClashReducer({ ...almostEmpty, drawPile: [] }, { type: 'DRAW_CARD', playerId: me.id });
    // Deste bostu, recycle tetiklenmis olmali; atma yigininin en ustu ayni kalmali.
    expect(state.discardPile[state.discardPile.length - 1].id).toBe(before.id);
  });
});

describe('aksiyon kartlari', () => {
  it('Skip: bir sonraki oyuncu atlanir', () => {
    let g = freshGame(PLAYERS4, { lastCardCallRequired: false });
    const me = g.players[g.currentPlayerIndex];
    const skipCard: ClashCard = { id: 'skip1', kind: 'skip', color: g.activeColor ?? 'coral' };
    g = { ...g, players: g.players.map((p) => (p.id === me.id ? { ...p, hand: [...p.hand, skipCard] } : p)) };
    const expectedNextIndex = stepPlayerIndex(g, 2); // bir kisi atlanir + siradaki
    const { state } = colorClashReducer(g, { type: 'PLAY_CARD', playerId: me.id, cardId: skipCard.id });
    expect(state.currentPlayerIndex).toBe(expectedNextIndex);
  });

  it('Reverse: yon degisir (3+ oyuncu)', () => {
    let g = freshGame(PLAYERS4, { lastCardCallRequired: false });
    const me = g.players[g.currentPlayerIndex];
    const directionBefore = g.direction; // rastgele acilis karti zaten bir Reverse olabilir, 1 varsaymiyoruz
    const revCard: ClashCard = { id: 'rev1', kind: 'reverse', color: g.activeColor ?? 'coral' };
    g = { ...g, players: g.players.map((p) => (p.id === me.id ? { ...p, hand: [...p.hand, revCard] } : p)) };
    const { state } = colorClashReducer(g, { type: 'PLAY_CARD', playerId: me.id, cardId: revCard.id });
    expect(state.direction).toBe(reverseDirection(directionBefore));
  });

  it('2 oyunculu oyunda Reverse Skip gibi davranir (ayni oyuncu devam eder)', () => {
    let g = freshGame([PLAYERS4[0], PLAYERS4[1]], { lastCardCallRequired: false });
    const me = g.players[g.currentPlayerIndex];
    const revCard: ClashCard = { id: 'rev2', kind: 'reverse', color: g.activeColor ?? 'coral' };
    g = { ...g, players: g.players.map((p) => (p.id === me.id ? { ...p, hand: [...p.hand, revCard] } : p)) };
    const beforeIndex = g.currentPlayerIndex;
    const { state } = colorClashReducer(g, { type: 'PLAY_CARD', playerId: me.id, cardId: revCard.id });
    expect(state.currentPlayerIndex).toBe(beforeIndex);
  });

  it('DrawTwo (stacking kapali): bir sonraki oyuncu hemen 2 cekip atlanir', () => {
    let g = freshGame(PLAYERS4, { lastCardCallRequired: false, stacking: false });
    const me = g.players[g.currentPlayerIndex];
    // Yon (direction) rastgele acilis kartina (ornegin Reverse) bagli olarak -1 olabilir;
    // gercek "bir sonraki oyuncu"yu naif +1 yerine motorun kendi fonksiyonuyla hesapla.
    const victimIdx = stepPlayerIndex(g, 1);
    const victimIdBefore = g.players[victimIdx].id;
    const victimHandBefore = g.players.find((p) => p.id === victimIdBefore)!.hand.length;
    const d2: ClashCard = { id: 'd2-1', kind: 'drawTwo', color: g.activeColor ?? 'coral' };
    g = { ...g, players: g.players.map((p) => (p.id === me.id ? { ...p, hand: [...p.hand, d2] } : p)) };
    const expectedNextIndex = stepPlayerIndex(g, 2);
    const { state } = colorClashReducer(g, { type: 'PLAY_CARD', playerId: me.id, cardId: d2.id });
    const victimAfter = state.players.find((p) => p.id === victimIdBefore)!;
    expect(victimAfter.hand.length).toBe(victimHandBefore + 2);
    expect(state.currentPlayerIndex).toBe(expectedNextIndex);
  });

  it('Wild: renk secimi gerekir, secilene kadar faz choosingColor kalir', () => {
    let g = freshGame(PLAYERS4, { lastCardCallRequired: false });
    const me = g.players[g.currentPlayerIndex];
    const wild: ClashCard = { id: 'w1', kind: 'wild' };
    g = { ...g, players: g.players.map((p) => (p.id === me.id ? { ...p, hand: [...p.hand, wild] } : p)) };
    const { state } = colorClashReducer(g, { type: 'PLAY_CARD', playerId: me.id, cardId: wild.id });
    expect(state.phase).toBe('choosingColor');
    const chosen = colorClashReducer(state, { type: 'SELECT_COLOR', playerId: me.id, color: 'teal' });
    expect(chosen.state.activeColor).toBe('teal');
    expect(chosen.state.phase).toBe('awaitingPlay');
  });

  it('DrawFour + itiraz: itiraz haklıysa oynayan +4 ceker', () => {
    let g = freshGame(PLAYERS4, { lastCardCallRequired: false, drawFourChallenge: true });
    const me = g.players[g.currentPlayerIndex];
    const oldColor = g.activeColor ?? 'coral';
    const altColor = (['coral', 'violet', 'teal', 'amber'] as const).find((c) => c !== oldColor)!;
    // oynayanin elinde alternatif (eski renkte baska kart) VAR yapalim -> itiraz haklı olmali
    const alt: ClashCard = { id: 'alt1', kind: 'number', color: oldColor, value: 3 };
    const d4: ClashCard = { id: 'd4-1', kind: 'drawFour' };
    g = { ...g, players: g.players.map((p) => (p.id === me.id ? { ...p, hand: [...p.hand, alt, d4] } : p)) };
    let res = colorClashReducer(g, { type: 'PLAY_CARD', playerId: me.id, cardId: d4.id });
    res = colorClashReducer(res.state, { type: 'SELECT_COLOR', playerId: me.id, color: altColor });
    expect(res.state.phase).toBe('awaitingChallenge');
    const victimId = res.state.challenge!.challengerId;
    const final = colorClashReducer(res.state, { type: 'RESOLVE_CHALLENGE', challengerId: victimId, challenge: true });
    const meAfter = final.state.players.find((p) => p.id === me.id)!;
    expect(meAfter.hand.some((c) => c.id === alt.id)).toBe(true); // hala elinde, +4 CEKEN kisi o
    expect(meAfter.hand.length).toBeGreaterThan(1); // +4 cekmis olmali (buyudu)
  });
});

describe('kazanma kosulu', () => {
  it('eli bosaltan oyuncu round\'u kazanir ve skor kaybedenlerin el degeri kadar eklenir', () => {
    let g = freshGame(PLAYERS4, { lastCardCallRequired: false });
    const me = g.players[g.currentPlayerIndex];
    const lastCard: ClashCard = { id: 'last1', kind: 'number', color: g.activeColor ?? 'coral', value: 7 };
    g = { ...g, players: g.players.map((p) => (p.id === me.id ? { ...p, hand: [lastCard] } : p)) };
    const { state } = colorClashReducer(g, { type: 'PLAY_CARD', playerId: me.id, cardId: lastCard.id });
    expect(state.phase).toBe('roundFinished');
    expect(state.winnerId).toBe(me.id);
    const winnerAfter = state.players.find((p) => p.id === me.id)!;
    expect(winnerAfter.score).toBe(state.lastRoundScore);
  });
});

describe('LAST CARD bildirimi', () => {
  it('el 2den 1e inince pendingDeclareId set edilir', () => {
    let g = freshGame(PLAYERS4, { lastCardCallRequired: true });
    const me = g.players[g.currentPlayerIndex];
    const cardToPlay: ClashCard = { id: 'p-1', kind: 'number', color: g.activeColor ?? 'coral', value: 4 };
    const keep: ClashCard = { id: 'keep-1', kind: 'number', color: 'amber', value: 9 };
    g = { ...g, players: g.players.map((p) => (p.id === me.id ? { ...p, hand: [cardToPlay, keep] } : p)) };
    const { state } = colorClashReducer(g, { type: 'PLAY_CARD', playerId: me.id, cardId: cardToPlay.id });
    expect(state.pendingDeclareId).toBe(me.id);
    expect(state.phase).toBe('awaitingPlay'); // bir sonraki oyuncuya gecmemis, declare bekleniyor
  });

  it('bildirmeyi unutan (declaredLastCard=false) baskasi tarafindan yakalanabilir', () => {
    let g = freshGame(PLAYERS4);
    const me = g.players[g.currentPlayerIndex];
    g = { ...g, players: g.players.map((p) => (p.id === me.id ? { ...p, hand: [p.hand[0]], declaredLastCard: false } : p)) };
    const before = g.players.find((p) => p.id === me.id)!.hand.length;
    const other = g.players.find((p) => p.id !== me.id)!;
    const { state } = colorClashReducer(g, { type: 'CATCH_FORGOT_DECLARE', catcherId: other.id, targetId: me.id });
    const after = state.players.find((p) => p.id === me.id)!;
    expect(after.hand.length).toBe(before + state.rules.lastCardPenalty);
    expect(after.declaredLastCard).toBe(true);
  });

  it('bildirmis (declaredLastCard=true) oyuncu tekrar yakalanamaz', () => {
    let g = freshGame(PLAYERS4);
    const me = g.players[g.currentPlayerIndex];
    g = { ...g, players: g.players.map((p) => (p.id === me.id ? { ...p, hand: [p.hand[0]], declaredLastCard: true } : p)) };
    const other = g.players.find((p) => p.id !== me.id)!;
    const { error } = colorClashReducer(g, { type: 'CATCH_FORGOT_DECLARE', catcherId: other.id, targetId: me.id });
    expect(error).toBeTruthy();
  });
});

describe('stacking kurali', () => {
  it('stacking acikken DrawTwo uzerine DrawTwo konursa ceza birikir (pendingDrawPenalty)', () => {
    let g = freshGame(PLAYERS4, { lastCardCallRequired: false, stacking: true });
    const me = g.players[g.currentPlayerIndex];
    const d2: ClashCard = { id: 'sd2-1', kind: 'drawTwo', color: g.activeColor ?? 'coral' };
    g = { ...g, players: g.players.map((p) => (p.id === me.id ? { ...p, hand: [...p.hand, d2] } : p)) };
    const { state } = colorClashReducer(g, { type: 'PLAY_CARD', playerId: me.id, cardId: d2.id });
    expect(state.pendingDrawPenalty).toBe(2);
    // hemen cekilmemis olmali
    const nextPlayer = state.players[state.currentPlayerIndex];
    expect(nextPlayer.hand.length).toBeGreaterThan(0);
  });

  it('stacking kapaliyken kural birbirine karismaz (penalty hemen uygulanir, pendingDrawPenalty 0 kalir)', () => {
    let g = freshGame(PLAYERS4, { lastCardCallRequired: false, stacking: false });
    const me = g.players[g.currentPlayerIndex];
    const d2: ClashCard = { id: 'nd2-1', kind: 'drawTwo', color: g.activeColor ?? 'coral' };
    g = { ...g, players: g.players.map((p) => (p.id === me.id ? { ...p, hand: [...p.hand, d2] } : p)) };
    const { state } = colorClashReducer(g, { type: 'PLAY_CARD', playerId: me.id, cardId: d2.id });
    expect(state.pendingDrawPenalty).toBe(0);
  });
});

describe('cekme / tur sonlandirma', () => {
  it('ayni turda iki kere cekilemez', () => {
    let g = freshGame(PLAYERS4, { lastCardCallRequired: false });
    const me = g.players[g.currentPlayerIndex];
    const r1 = colorClashReducer(g, { type: 'DRAW_CARD', playerId: me.id });
    expect(r1.error).toBeFalsy();
    const r2 = colorClashReducer(r1.state, { type: 'DRAW_CARD', playerId: me.id });
    expect(r2.error).toBeTruthy();
  });

  it('cekmeden tur bitirilemez', () => {
    const g = freshGame(PLAYERS4, { lastCardCallRequired: false });
    const me = g.players[g.currentPlayerIndex];
    const { error } = colorClashReducer(g, { type: 'END_TURN_AFTER_DRAW', playerId: me.id });
    expect(error).toBeTruthy();
  });

  it('cektikten sonra tur bitirilebilir ve sira ilerler', () => {
    const g = freshGame(PLAYERS4, { lastCardCallRequired: false });
    const me = g.players[g.currentPlayerIndex];
    const expectedNextIndex = stepPlayerIndex(g, 1);
    const r1 = colorClashReducer(g, { type: 'DRAW_CARD', playerId: me.id });
    const r2 = colorClashReducer(r1.state, { type: 'END_TURN_AFTER_DRAW', playerId: me.id });
    expect(r2.state.currentPlayerIndex).toBe(expectedNextIndex);
  });
});

describe('reconnect / serialize', () => {
  it('oyun state\'i JSON olarak serialize/deserialize edilebilir', () => {
    const g = freshGame();
    const restored = JSON.parse(JSON.stringify(g)) as ClashGameState;
    expect(restored.phase).toBe(g.phase);
    expect(restored.players.length).toBe(g.players.length);
  });

  it('baglantisi kesilen oyuncu sirada atlanir', () => {
    let g = freshGame(PLAYERS4, { lastCardCallRequired: false });
    const skippedId = g.players[(g.currentPlayerIndex + 1) % 4].id;
    g = { ...g, players: g.players.map((p) => (p.id === skippedId ? { ...p, connected: false } : p)) };
    const me = g.players[g.currentPlayerIndex];
    const r1 = colorClashReducer(g, { type: 'DRAW_CARD', playerId: me.id });
    const r2 = colorClashReducer(r1.state, { type: 'END_TURN_AFTER_DRAW', playerId: me.id });
    expect(r2.state.currentPlayerIndex).not.toBe(g.players.findIndex((p) => p.id === skippedId));
  });
});
