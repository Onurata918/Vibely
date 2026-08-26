import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, View } from 'react-native';

import { OKEY_COLOR_HEX, type OkeyTile } from '@/lib/okey/engine';

type Props = {
  tile: OkeyTile;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  dim?: boolean;
  isWild?: boolean;
};

export function TileView({ tile, size = 'md', selected = false, dim = false, isWild = false }: Props) {
  const dims = size === 'lg' ? { w: 52, h: 68, font: 24, notch: 5 } : size === 'sm' ? { w: 34, h: 46, font: 15, notch: 3.5 } : { w: 42, h: 56, font: 19, notch: 4 };
  const isJoker = tile.kind === 'fakejoker';
  const color = isJoker ? '#7c3aed' : OKEY_COLOR_HEX[tile.color];
  const faceColors: [string, string] = isWild ? ['#fef9c3', '#fde68a'] : ['#fffdf7', '#eee2c3'];

  return (
    <View
      style={{
        width: dims.w,
        height: dims.h,
        borderRadius: 7,
        opacity: dim ? 0.45 : 1,
        transform: selected ? [{ translateY: -8 }] : undefined,
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: selected ? 7 : 3,
        shadowOffset: { width: 0, height: selected ? 5 : 2 },
        elevation: selected ? 7 : 3,
      }}
    >
      <LinearGradient
        colors={faceColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          flex: 1,
          borderRadius: 7,
          borderWidth: selected ? 2.5 : 1,
          borderColor: selected ? '#8b5cf6' : isWild ? '#eab308' : 'rgba(0,0,0,.22)',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* ust cam parlaklik seridi (fildisi tas hissi) */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '38%', backgroundColor: 'rgba(255,255,255,.5)', borderTopLeftRadius: 6, borderTopRightRadius: 6 }} />
        {/* alt notch: gercek okey tasindaki kertigi cagristiran ince cizgi */}
        <View style={{ position: 'absolute', bottom: dims.notch, left: '18%', right: '18%', height: 1.5, borderRadius: 1, backgroundColor: 'rgba(0,0,0,.14)' }} />
        {isJoker ? (
          <Text style={{ fontSize: dims.font * 0.85 }}>🃏</Text>
        ) : (
          <Text style={{ color, fontWeight: '900', fontSize: dims.font, textShadowColor: 'rgba(0,0,0,.12)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 0 }}>
            {tile.number}
          </Text>
        )}
      </LinearGradient>
    </View>
  );
}
