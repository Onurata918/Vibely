import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, View } from 'react-native';

import { OKEY_COLOR_HEX, type OkeyTile } from '@/lib/okey/engine';

type Size = 'xs' | 'sm' | 'md' | 'lg';

type Props = {
  tile: OkeyTile;
  size?: Size;
  selected?: boolean;
  dim?: boolean;
  isWild?: boolean;
};

const DIMS: Record<Size, { w: number; h: number; font: number; dot: number }> = {
  xs: { w: 24, h: 33, font: 12, dot: 4.5 },
  sm: { w: 32, h: 44, font: 16, dot: 6 },
  md: { w: 40, h: 55, font: 21, dot: 7.5 },
  lg: { w: 50, h: 68, font: 26, dot: 9 },
};

/**
 * Tek bir okey tasi. Gercek taslardaki gibi fildisi yuz, renkli rakam ve
 * rakamin altinda kucuk bir daire var; ust kenarda ince bir parlaklik seridi
 * tasa kabarik bir his veriyor.
 */
export function TileView({ tile, size = 'md', selected = false, dim = false, isWild = false }: Props) {
  const d = DIMS[size];
  const isJoker = tile.kind === 'fakejoker';
  const color = isJoker ? '#7c3aed' : OKEY_COLOR_HEX[tile.color];

  return (
    <View
      style={{
        width: d.w,
        height: d.h,
        borderRadius: 6,
        opacity: dim ? 0.5 : 1,
        transform: selected ? [{ translateY: -10 }] : undefined,
        backgroundColor: '#cbbfa6',
        padding: 1.5,
        shadowColor: '#000',
        shadowOpacity: selected ? 0.5 : 0.35,
        shadowRadius: selected ? 8 : 3,
        shadowOffset: { width: 0, height: selected ? 5 : 2 },
        elevation: selected ? 8 : 3,
      }}
    >
      <LinearGradient
        colors={isWild ? ['#fffbe8', '#fdeec0'] : ['#fffefa', '#f0e8d6']}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={{
          flex: 1,
          borderRadius: 5,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          borderWidth: selected ? 1.5 : 0,
          borderColor: selected ? '#8b5cf6' : 'transparent',
        }}
      >
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '26%', backgroundColor: 'rgba(255,255,255,.75)' }} />
        {isWild ? <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(234,179,8,.14)' }} /> : null}

        {isJoker ? (
          <Text style={{ fontSize: d.font * 0.9, color, fontWeight: '900' }}>★</Text>
        ) : (
          <Text style={{ color, fontWeight: '900', fontSize: d.font, marginTop: -d.dot * 0.5, lineHeight: d.font * 1.12 }}>{tile.number}</Text>
        )}

        {/* rakamin altindaki daire — gercek okey tasindaki isaret */}
        <View
          style={{
            position: 'absolute',
            bottom: d.h * 0.1,
            width: d.dot,
            height: d.dot,
            borderRadius: d.dot / 2,
            backgroundColor: '#ffffff',
            borderWidth: 0.8,
            borderColor: 'rgba(0,0,0,.28)',
          }}
        />
      </LinearGradient>
    </View>
  );
}
