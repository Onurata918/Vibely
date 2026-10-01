/**
 * Gorusme sirasinda yayinlanacak video kalitesini belirler.
 *
 * Bant genisligi oda buyuklugunun karesiyle artar: N kisilik odada her kisi
 * digerlerinin yayinini ayri ayri indirir, yani N x (N-1) akis olur. Bu yuzden
 * kalabalik odada cozunurlugu dusurmek, faturayi en cok etkileyen tek ayardir.
 *
 * Oyun oynanirken video zaten kucuk karelere siksiyor ve dikkat oyunda oldugu
 * icin bir kademe daha dusuruluyor.
 */

export type VideoQuality = '240p' | '360p' | '480p';

export type VideoProfile = {
  quality: VideoQuality;
  width: number;
  height: number;
  frameRate: number;
  /** Kisi basina yayin hizi (kbps). */
  bitrateKbps: number;
};

export const VIDEO_PROFILES: Record<VideoQuality, VideoProfile> = {
  '240p': { quality: '240p', width: 426, height: 240, frameRate: 15, bitrateKbps: 200 },
  '360p': { quality: '360p', width: 640, height: 360, frameRate: 24, bitrateKbps: 400 },
  '480p': { quality: '480p', width: 854, height: 480, frameRate: 24, bitrateKbps: 700 },
};

/** Kalabalik odanin basladigi kisi sayisi. */
export const CROWDED_ROOM_FROM = 4;

export type VideoQualityInput = {
  /** Odadaki toplam kisi sayisi (yayin yapan herkes dahil). */
  participantCount: number;
  /** O anda bir oyun veya efekt acik mi? */
  gameActive: boolean;
};

export function pickVideoQuality({ participantCount, gameActive }: VideoQualityInput): VideoQuality {
  const crowded = participantCount >= CROWDED_ROOM_FROM;
  if (crowded) return gameActive ? '240p' : '360p';
  return gameActive ? '360p' : '480p';
}

export function videoProfileFor(input: VideoQualityInput): VideoProfile {
  return VIDEO_PROFILES[pickVideoQuality(input)];
}

/**
 * Bir oda-saatinde LiveKit'in faturalayacagi tahmini indirme verisi (GB).
 * Her katilimci diger (N-1) kisinin yayinini indirir.
 */
export function estimateDownstreamGBPerHour(input: VideoQualityInput): number {
  const { participantCount } = input;
  if (participantCount < 2) return 0;
  const streams = participantCount * (participantCount - 1);
  // kbps -> saatlik GB: kbps * 3600 / 8 = KB, / 1_000_000 = GB (faturalama ondalik sayar)
  const gbPerStreamHour = (videoProfileFor(input).bitrateKbps * 3600) / 8 / 1_000_000;
  return streams * gbPerStreamHour;
}
