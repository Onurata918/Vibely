// Son Kart — UNO tarzı renk/sayı eşleştirme kart oyununun kural motoru.
// (İsim bilinçli olarak "UNO" değil — o marka tescilli.)

export type UnoColor = 'red' | 'yellow' | 'green' | 'blue';
export type UnoCardType = 'number' | 'skip' | 'reverse' | 'drawTwo' | 'wild' | 'wildDrawFour';

export type UnoCard = {
  id: string;
  type: UnoCardType;
  color: UnoColor | 'wild';
  value?: number; // sadece type==='number' icin (0-9)
};

export const UNO_COLORS: readonly UnoColor[] = ['red', 'yellow', 'green', 'blue'];

export const UNO_COLOR_HEX: Record<UnoColor, string> = {
  red: '#ef4444',
  yellow: '#eab308',
  green: '#22c55e',
  blue: '#3b82f6',
};

let cardSeq = 0;
function nextId() {
  cardSeq += 1;
  return `c${cardSeq}`;
}

export function buildDeck(): UnoCard[] {
  const deck: UnoCard[] = [];
  for (const color of UNO_COLORS) {
    deck.push({ id: nextId(), type: 'number', color, value: 0 });
    for (let v = 1; v <= 9; v++) {
      deck.push({ id: nextId(), type: 'number', color, value: v });
      deck.push({ id: nextId(), type: 'number', color, value: v });
    }
    for (let i = 0; i < 2; i++) {
      deck.push({ id: nextId(), type: 'skip', color });
      deck.push({ id: nextId(), type: 'reverse', color });
      deck.push({ id: nextId(), type: 'drawTwo', color });
    }
  }
  for (let i = 0; i < 4; i++) {
    deck.push({ id: nextId(), type: 'wild', color: 'wild' });
    deck.push({ id: nextId(), type: 'wildDrawFour', color: 'wild' });
  }
  return deck;
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function isPlayable(card: UnoCard, topCard: UnoCard, activeColor: UnoColor): boolean {
  if (card.type === 'wild' || card.type === 'wildDrawFour') return true;
  if (card.color === activeColor) return true;
  if (topCard.type === 'number' && card.type === 'number') return card.value === topCard.value;
  if (card.type === topCard.type && card.type !== 'number') return true;
  return false;
}

/** El sonu puanlaması: numara kartı = yüzü, engel kartları (skip/reverse/+2) = 20, joker/+4 = 50. */
export function cardScoreValue(card: UnoCard): number {
  if (card.type === 'number') return card.value ?? 0;
  if (card.type === 'wild' || card.type === 'wildDrawFour') return 50;
  return 20;
}

export function cardLabel(card: UnoCard): string {
  switch (card.type) {
    case 'number':
      return String(card.value ?? '');
    case 'skip':
      return '⊘';
    case 'reverse':
      return '⇄';
    case 'drawTwo':
      return '+2';
    case 'wild':
      return '★';
    case 'wildDrawFour':
      return '+4';
    default:
      return '';
  }
}

/**
 * Bir sonraki oyuncunun index'ini hesaplar.
 * extraSteps=1 -> Skip (bir kisi atlanir), reverse 2 kisilik oyunda da
 * ayni fonksiyonla extraSteps=1 verilerek (skip gibi) cagrilir.
 */
export function stepPlayerIndex(current: number, direction: 1 | -1, count: number, extraSteps = 0): number {
  let idx = current;
  for (let i = 0; i < 1 + extraSteps; i++) {
    idx = (idx + direction + count) % count;
  }
  return idx;
}
