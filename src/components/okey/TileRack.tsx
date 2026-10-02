import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View } from 'react-native';

/** Taslari istakanin iki katina esit bolmek icin. */
export function splitRackRows(nodes: React.ReactNode[]): React.ReactNode[][] {
  const half = Math.ceil(nodes.length / 2);
  return [nodes.slice(0, half), nodes.slice(half)];
}

/**
 * Okey istakasi: taslarin uzerine dizildigi ahsap raf. Gercek istakadaki gibi
 * iki katli; ust kenarda parlaklik, her katin altinda taslarin oturdugu oluk var.
 */
export function TileRack({ rows }: { rows: React.ReactNode[][] }) {
  return (
    <View
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.55,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 12,
      }}
    >
      <LinearGradient colors={['#d9a765', '#a9742f', '#6d4418']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ paddingVertical: 7, paddingHorizontal: 8, gap: 6 }}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, backgroundColor: 'rgba(255,255,255,.45)' }} />
        {rows.map((row, i) => (
          <View key={i} style={{ borderRadius: 7, backgroundColor: 'rgba(0,0,0,.22)', paddingHorizontal: 5, paddingTop: 4, paddingBottom: 6 }}>
            <View style={{ position: 'absolute', left: 6, right: 6, bottom: 3, height: 2.5, borderRadius: 2, backgroundColor: 'rgba(0,0,0,.45)' }} />
            <View style={{ flexDirection: 'row', gap: 3, justifyContent: 'center', minHeight: 44 }}>{row}</View>
          </View>
        ))}
      </LinearGradient>
    </View>
  );
}
