import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, View } from 'react-native';

/** Masa zemini: koyu mavi cuha, uzerinde silik dokular. */
export function OkeyFelt() {
  return (
    <>
      <LinearGradient colors={['#1b3a63', '#142d4e', '#0c1e36']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={{ position: 'absolute', inset: 0 }} />
      <View style={{ position: 'absolute', top: '12%', left: -60, width: 220, height: 220, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.028)' }} />
      <View style={{ position: 'absolute', top: '46%', right: -70, width: 260, height: 260, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.022)' }} />
      <View style={{ position: 'absolute', bottom: '18%', left: '22%', width: 180, height: 180, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.018)' }} />
      <LinearGradient colors={['rgba(0,0,0,.45)', 'transparent', 'rgba(0,0,0,.45)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ position: 'absolute', inset: 0 }} />
    </>
  );
}

/** Masadaki perdelerin dizildigi koyu pano (referanstaki izgarali alan). */
export function MeldBoard({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View
      style={[
        {
          flex: 1,
          borderRadius: 10,
          backgroundColor: 'rgba(5,16,30,.62)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,.1)',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {/* ince izgara */}
      {Array.from({ length: 7 }).map((_, i) => (
        <View key={`h${i}`} style={{ position: 'absolute', left: 0, right: 0, top: `${(i + 1) * 12.5}%`, height: 1, backgroundColor: 'rgba(255,255,255,.045)' }} />
      ))}
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={`v${i}`} style={{ position: 'absolute', top: 0, bottom: 0, left: `${(i + 1) * 16.6}%`, width: 1, backgroundColor: 'rgba(255,255,255,.045)' }} />
      ))}
      {children}
    </View>
  );
}

type SeatInfo = { name: string; c1: string; c2: string; tiles: number; opened?: boolean; active?: boolean };

/** Rakibin dikey istakasi (sol/sag kenar). */
export function SideRack({ seat, side }: { seat: SeatInfo; side: 'left' | 'right' }) {
  return (
    <View style={{ width: 40, alignItems: 'center', gap: 5 }}>
      <View
        style={{
          borderRadius: 11,
          padding: seat.active ? 2 : 0,
          backgroundColor: seat.active ? '#facc15' : 'transparent',
          shadowColor: seat.active ? '#facc15' : '#000',
          shadowOpacity: seat.active ? 0.85 : 0.4,
          shadowRadius: seat.active ? 9 : 4,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <LinearGradient
          colors={[seat.c1, seat.c2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,.3)' }}
        >
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>{seat.name.slice(0, 1).toUpperCase()}</Text>
        </LinearGradient>
      </View>

      {/* dikey istaka: uzerinde taslarin sirti, ortasinda dondurulmus isim */}
      <View style={{ flex: 1, width: 30 }}>
        <LinearGradient
          colors={['#2a3f5c', '#16263c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,.12)', paddingVertical: 6, gap: 2, alignItems: 'center' }}
        >
          {Array.from({ length: Math.min(8, Math.max(1, Math.ceil(seat.tiles / 2))) }).map((_, i) => (
            <View key={i} style={{ width: 20, height: 9, borderRadius: 2, backgroundColor: '#f0e8d6', borderWidth: 0.8, borderColor: 'rgba(0,0,0,.35)' }} />
          ))}
        </LinearGradient>
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, bottom: 0, left: -40, right: -40, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: 10,
              fontWeight: '900',
              textShadowColor: 'rgba(0,0,0,.9)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
              transform: [{ rotate: side === 'left' ? '-90deg' : '90deg' }],
            }}
          >
            {seat.name}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(5,16,30,.85)', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,.12)' }}>
        <Text style={{ fontSize: 9.5, color: '#fff', fontWeight: '900' }}>{seat.tiles}</Text>
        {seat.opened ? <Text style={{ fontSize: 8, color: '#4ade80', fontWeight: '900' }}>✓</Text> : null}
      </View>
    </View>
  );
}

/** Rakibin yatay istakasi (ust kenar). */
export function TopRack({ seat }: { seat: SeatInfo }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'center' }}>
      <View
        style={{
          borderRadius: 11,
          padding: seat.active ? 2 : 0,
          backgroundColor: seat.active ? '#facc15' : 'transparent',
          shadowColor: seat.active ? '#facc15' : '#000',
          shadowOpacity: seat.active ? 0.85 : 0.4,
          shadowRadius: seat.active ? 9 : 4,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <LinearGradient
          colors={[seat.c1, seat.c2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,.3)' }}
        >
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>{seat.name.slice(0, 1).toUpperCase()}</Text>
        </LinearGradient>
      </View>
      <LinearGradient
        colors={['#2a3f5c', '#16263c']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 30, paddingHorizontal: 11, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,.12)' }}
      >
        <Text style={{ color: '#cfe0f5', fontSize: 10.5, fontWeight: '800' }} numberOfLines={1}>
          {seat.name}
        </Text>
        <View style={{ backgroundColor: 'rgba(255,255,255,.16)', borderRadius: 999, minWidth: 17, paddingHorizontal: 4 }}>
          <Text style={{ fontSize: 9.5, color: '#fff', fontWeight: '900', textAlign: 'center' }}>{seat.tiles}</Text>
        </View>
        {seat.opened ? <Text style={{ fontSize: 9, color: '#4ade80', fontWeight: '900' }}>✓</Text> : null}
      </LinearGradient>
    </View>
  );
}

/** Istakanin iki yanindaki kompakt siralama butonu. */
export function SortButton({ label, onPress: _onPress }: { label: string; onPress?: () => void }) {
  return (
    <LinearGradient
      colors={['#3b5a85', '#1f3350']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ width: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,.18)' }}
    >
      <Text style={{ color: '#fff', fontSize: 9.5, fontWeight: '900', letterSpacing: 0.4 }}>{label}</Text>
    </LinearGradient>
  );
}
