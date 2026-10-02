import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, View } from 'react-native';

import { CLASH_COLOR_HEX, CLASH_COLOR_SYMBOL, type ClashCard } from '@/lib/colorClash/types';
import { cardLabel } from '@/lib/colorClash/validation';

type Size = 'xs' | 'sm' | 'md' | 'lg';

type Props = {
  card: ClashCard;
  size?: Size;
  dim?: boolean;
  lifted?: boolean;
  faceDown?: boolean;
};

const SIZES: Record<Size, { w: number; h: number; num: number; corner: number; frame: number; radius: number }> = {
  xs: { w: 30, h: 43, num: 12, corner: 7, frame: 2, radius: 6 },
  sm: { w: 54, h: 78, num: 22, corner: 10, frame: 4, radius: 9 },
  md: { w: 76, h: 108, num: 31, corner: 13, frame: 5, radius: 12 },
  lg: { w: 98, h: 138, num: 40, corner: 16, frame: 6, radius: 15 },
};

function frameStyle(d: (typeof SIZES)[Size], lifted: boolean, dim: boolean) {
  return {
    width: d.w,
    height: d.h,
    borderRadius: d.radius,
    backgroundColor: '#fdfdff',
    padding: d.frame,
    opacity: dim ? 0.58 : 1,
    shadowColor: '#000',
    shadowOpacity: lifted ? 0.5 : 0.35,
    shadowRadius: lifted ? 14 : 6,
    shadowOffset: { width: 0, height: lifted ? 9 : 4 },
    elevation: lifted ? 12 : 4,
  } as const;
}

/** Kart sirti: marka moru uzerine halka motifi. UNO'nun sirtina benzemez. */
export function CardBack({ size = 'md' }: { size?: Size }) {
  const d = SIZES[size];
  return (
    <View style={frameStyle(d, false, false)}>
      <LinearGradient
        colors={['#4c3aa0', '#2b1d63', '#16103a']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={{ flex: 1, borderRadius: d.radius - d.frame + 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
      >
        <View
          style={{
            width: d.w * 0.62,
            height: d.w * 0.62,
            borderRadius: 999,
            borderWidth: Math.max(1.5, d.frame * 0.5),
            borderColor: 'rgba(196,181,253,.55)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: 'rgba(221,214,254,.95)', fontWeight: '900', fontSize: d.num * 0.6 }}>V</Text>
        </View>
        <View style={{ position: 'absolute', top: -d.h * 0.2, left: -d.w * 0.3, width: d.w * 0.9, height: d.h * 0.5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.07)' }} />
      </LinearGradient>
    </View>
  );
}

export function Card({ card, size = 'md', dim = false, lifted = false, faceDown = false }: Props) {
  const d = SIZES[size];
  if (faceDown) return <CardBack size={size} />;

  const label = cardLabel(card);
  const isWild = card.kind === 'wild' || card.kind === 'drawFour';
  const color = card.color ? CLASH_COLOR_HEX[card.color] : '#4b4464';
  const symbol = card.color ? CLASH_COLOR_SYMBOL[card.color] : null;
  const inner = d.radius - d.frame + 1;
  const badge = d.w * 0.6;

  return (
    <View style={[frameStyle(d, lifted, dim), lifted ? { transform: [{ translateY: -14 }] } : null]}>
      <View style={{ flex: 1, borderRadius: inner, overflow: 'hidden' }}>
        {isWild ? (
          <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
            <View style={{ width: '50%', height: '50%', backgroundColor: CLASH_COLOR_HEX.coral }} />
            <View style={{ width: '50%', height: '50%', backgroundColor: CLASH_COLOR_HEX.violet }} />
            <View style={{ width: '50%', height: '50%', backgroundColor: CLASH_COLOR_HEX.amber }} />
            <View style={{ width: '50%', height: '50%', backgroundColor: CLASH_COLOR_HEX.teal }} />
          </View>
        ) : (
          <LinearGradient colors={[shade(color, 0.14), color, shade(color, -0.2)]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ flex: 1 }} />
        )}

        {/* ust kenarda cam parlaklik */}
        <View style={{ position: 'absolute', top: -d.h * 0.28, left: -d.w * 0.2, width: d.w * 1.1, height: d.h * 0.52, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.14)' }} />

        {/* ortadaki beyaz rozet */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <View
            style={{
              minWidth: badge,
              height: badge,
              paddingHorizontal: d.frame,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,.95)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: isWild ? '#2b1d63' : shade(color, -0.3), fontWeight: '900', fontSize: d.num }} numberOfLines={1}>
              {label}
            </Text>
          </View>
        </View>

        {/* kose isaretleri — renk korlugu icin sembol de var */}
        {size !== 'xs' ? (
          <>
            <View style={{ position: 'absolute', top: d.frame - 1, left: d.frame + 1 }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: d.corner }}>{label}</Text>
              {symbol ? <Text style={{ color: 'rgba(255,255,255,.9)', fontSize: d.corner * 0.72, marginTop: -2 }}>{symbol}</Text> : null}
            </View>
            <View style={{ position: 'absolute', bottom: d.frame - 1, right: d.frame + 1, transform: [{ rotate: '180deg' }] }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: d.corner }}>{label}</Text>
              {symbol ? <Text style={{ color: 'rgba(255,255,255,.9)', fontSize: d.corner * 0.72, marginTop: -2 }}>{symbol}</Text> : null}
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const mix = (c: number) => (amt >= 0 ? c + (255 - c) * amt : c * (1 + amt));
  const r = clamp(mix((n >> 16) & 0xff));
  const g = clamp(mix((n >> 8) & 0xff));
  const b = clamp(mix(n & 0xff));
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}
