import type { ClashCard, ClashColor } from './types';

/** Bir kartin, aktif renk/ust kart uzerine oynanip oynanamayacagini belirler. */
export function canPlayCard(card: ClashCard, topCard: ClashCard, activeColor: ClashColor | null): boolean {
  if (card.kind === 'wild' || card.kind === 'drawFour') return true;
  if (activeColor && card.color === activeColor) return true;
  if (topCard.kind === 'number' && card.kind === 'number') return card.value === topCard.value;
  if (card.kind === topCard.kind && card.kind !== 'number') return true;
  return false;
}

export function getPlayableCards(hand: ClashCard[], topCard: ClashCard, activeColor: ClashColor | null): ClashCard[] {
  return hand.filter((c) => canPlayCard(c, topCard, activeColor));
}

/** Aksiyon kartlarinin "yigilma" (stacking) uyumlulugu: ayni tur/deger aksiyon kartlari ust uste konabilir. */
export function canStack(card: ClashCard, topCard: ClashCard): boolean {
  if (card.kind === 'drawTwo' && topCard.kind === 'drawTwo') return true;
  if (card.kind === 'drawFour' && topCard.kind === 'drawFour') return true;
  return false;
}

export function cardScoreValue(card: ClashCard): number {
  if (card.kind === 'number') return card.value ?? 0;
  if (card.kind === 'wild' || card.kind === 'drawFour') return 50;
  return 20;
}

export function cardLabel(card: ClashCard): string {
  switch (card.kind) {
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
    case 'drawFour':
      return '+4';
    default:
      return '';
  }
}
