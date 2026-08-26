import { Image } from 'expo-image';
import React from 'react';
import { Text, View } from 'react-native';

import { GradientText } from './GradientText';

type Props = {
  size?: 'lg' | 'sm';
  tagline?: boolean;
};

export function Logo({ size = 'lg', tagline = false }: Props) {
  const badge = size === 'lg' ? 118 : 54;
  const radius = size === 'lg' ? 30 : 16;
  const wordmarkSize = size === 'lg' ? 34 : 22;

  return (
    <View className="items-center" style={{ gap: 14 }}>
      <View
        style={{
          width: badge,
          height: badge,
          borderRadius: radius,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
        }}
      >
        {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
        <Image source={require('@/assets/vibely/vibely-logo.jpg')} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      </View>
      <GradientText style={{ fontSize: wordmarkSize, fontWeight: '800', letterSpacing: -0.6 }}>Vibely</GradientText>
      {tagline ? <Text style={{ fontSize: 12.5, color: '#8e879f', marginTop: -6 }}>Play. Chat. Vibely.</Text> : null}
    </View>
  );
}
