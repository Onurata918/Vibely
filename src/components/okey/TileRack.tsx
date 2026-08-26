import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View } from 'react-native';

// Gercek okey ıstakasini cagristiran ahsap raf: eldeki taslar bunun uzerinde
// oturur gibi gorunur (alt kertik + ust parlaklik seridiyle derinlik verilir).
export function TileRack({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        marginHorizontal: 12,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 10,
      }}
    >
      <LinearGradient
        colors={['#b9834b', '#8a5a2c', '#5c3a1a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ paddingTop: 12, paddingBottom: 18, paddingHorizontal: 12 }}
      >
        {/* ust ahsap parlaklik */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(255,255,255,.35)' }} />
        {/* taslarin oturdugu iz/kertik */}
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 10, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,.32)' }} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center' }}>{children}</View>
      </LinearGradient>
    </View>
  );
}
