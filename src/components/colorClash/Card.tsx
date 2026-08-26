import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, View } from 'react-native';

import { CLASH_COLOR_HEX, CLASH_COLOR_SYMBOL, type ClashCard } from '@/lib/colorClash/types';
import { cardLabel } from '@/lib/colorClash/validation';

type Props = {
  card: ClashCard;
  size?: 'sm' | 'md' | 'lg';
  dim?: boolean;
  lifted?: boolean;
  faceDown?: boolean;
};

const SIZES = {
  sm: { w: 52, h: 74, num: 20, corner: 9, symbol: 10 },
  md: { w: 74, h: 104, num: 30, corner: 12, symbol: 13 },
  lg: { w: 96, h: 134, num: 38, corner: 14, symbol: 16 },
};

// Orijinal Vibely kart sirti: marka moru uzerinde soyut dalga + "V" motifi.
// UNO'nun kart sirtina benzemez.
export function CardBack({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const d = SIZES[size];
  return (
    <View style={{ width: d.w, height: d.h, borderRadius: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,.14)' }}>
      <LinearGradient colors={['#2a1f4d', '#181030', '#0d0820']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: '62%', height: '62%', borderRadius: 999, borderWidth: 2, borderColor: 'rgba(139,92,246,.5)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: 'rgba(196,181,253,.85)', fontWeight: '900', fontSize: d.num * 0.75 }}>V</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

export function Card({ card, size = 'md', dim = false, lifted = false, faceDown = false }: Props) {
  const d = SIZES[size];

  if (faceDown) return <CardBack size={size} />;

  const label = cardLabel(card);
  const isWild = card.kind === 'wild' || card.kind === 'drawFour';
  const color = card.color ? CLASH_COLOR_HEX[card.color] : null;
  const symbol = card.color ? CLASH_COLOR_SYMBOL[card.color] : null;

  return (
    <View
      style={{
        width: d.w,
        height: d.h,
        borderRadius: 13,
        overflow: 'hidden',
        opacity: dim ? 0.42 : 1,
        borderWidth: lifted ? 2.5 : 1,
        borderColor: lifted ? '#c4b5fd' : 'rgba(0,0,0,.25)',
        transform: lifted ? [{ translateY: -10 }] : undefined,
        shadowColor: '#000',
        shadowOpacity: lifted ? 0.42 : 0.24,
        shadowRadius: lifted ? 12 : 5,
        shadowOffset: { width: 0, height: lifted ? 7 : 3 },
        elevation: lifted ? 9 : 3,
      }}
    >
      {isWild ? (
        <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
          <View style={{ width: '50%', height: '50%', backgroundColor: CLASH_COLOR_HEX.coral }} />
          <View style={{ width: '50%', height: '50%', backgroundColor: CLASH_COLOR_HEX.violet }} />
          <View style={{ width: '50%', height: '50%', backgroundColor: CLASH_COLOR_HEX.amber }} />
          <View style={{ width: '50%', height: '50%', backgroundColor: CLASH_COLOR_HEX.teal }} />
        </View>
      ) : (
        <LinearGradient colors={[color ?? '#333', shade(color ?? '#333', -0.16)]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }} />
      )}

      {/* ust cam parlaklik */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '30%', backgroundColor: 'rgba(255,255,255,.16)' }} />

      {/* kose etiketleri: renk-korlugu icin sembol + deger */}
      {!isWild && symbol ? (
        <>
          <View style={{ position: 'absolute', top: 7, left: 8, alignItems: 'flex-start' }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: d.corner }}>{label}</Text>
            <Text style={{ color: 'rgba(255,255,255,.85)', fontSize: d.symbol, marginTop: -1 }}>{symbol}</Text>
          </View>
          <View style={{ position: 'absolute', bottom: 7, right: 8, alignItems: 'flex-end', transform: [{ rotate: '180deg' }] }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: d.corner }}>{label}</Text>
            <Text style={{ color: 'rgba(255,255,255,.85)', fontSize: d.symbol, marginTop: -1 }}>{symbol}</Text>
          </View>
        </>
      ) : null}

      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: d.num, textShadowColor: 'rgba(0,0,0,.35)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 3 }}>
          {label}
        </Text>
      </View>
    </View>
  );
}

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp(((n >> 16) & 0xff) * (1 + amt));
  const g = clamp(((n >> 8) & 0xff) * (1 + amt));
  const b = clamp((n & 0xff) * (1 + amt));
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}
