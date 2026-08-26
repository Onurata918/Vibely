import React from 'react';
import { Text, View } from 'react-native';

// "Acilis: 87 / 101" canli gostergesi — oyuncu acilis icin tas dizerken
// guncellenir. Dokumanin acikca istedigi bir UI parcasi.
export function OpeningProgress({ current, required }: { current: number; required: number }) {
  const ratio = Math.max(0, Math.min(1, current / required));
  const met = current >= required;
  return (
    <View
      style={{
        marginHorizontal: 12,
        marginTop: 6,
        padding: 8,
        borderRadius: 12,
        backgroundColor: met ? 'rgba(74,222,128,.12)' : 'rgba(234,179,8,.08)',
        borderWidth: 1,
        borderColor: met ? 'rgba(74,222,128,.4)' : 'rgba(234,179,8,.35)',
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
        <Text style={{ fontSize: 10.5, fontWeight: '800', color: met ? '#4ade80' : '#eab308' }}>Açılış</Text>
        <Text style={{ fontSize: 11.5, fontWeight: '800', color: met ? '#4ade80' : '#eab308' }}>
          {current} / {required}
        </Text>
      </View>
      <View style={{ height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.1)', overflow: 'hidden' }}>
        <View style={{ width: `${ratio * 100}%`, height: '100%', backgroundColor: met ? '#4ade80' : '#eab308', borderRadius: 3 }} />
      </View>
    </View>
  );
}
