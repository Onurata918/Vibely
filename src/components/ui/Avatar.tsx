import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, View } from 'react-native';

import { initial } from '@/lib/utils';

type AvatarPerson = { name: string; c1: string; c2: string };
type PersonState = 'online' | 'busy' | 'game';

type Props = {
  person: AvatarPerson;
  size?: number;
  dot?: boolean;
  state?: PersonState;
  ring?: boolean;
};

const DOT_COLOR: Record<PersonState, string> = {
  online: '#22c55e',
  busy: '#ef4444',
  game: '#8b5cf6',
};

export function Avatar({ person, size = 40, dot, state = 'online', ring }: Props) {
  const fontSize = Math.max(11, Math.round(size * 0.4));
  return (
    <View style={{ width: size, height: size }} className="relative shrink-0">
      <LinearGradient
        colors={[person.c1, person.c2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: ring ? 2 : 0,
          borderColor: '#8b5cf6',
        }}
      >
        <Text style={{ fontSize, fontWeight: '700', color: '#fff' }}>{initial(person.name)}</Text>
      </LinearGradient>
      {dot ? (
        <View
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: Math.max(9, size * 0.26),
            height: Math.max(9, size * 0.26),
            borderRadius: 999,
            borderWidth: 2,
            borderColor: '#08050f',
            backgroundColor: DOT_COLOR[state],
          }}
        />
      ) : null}
    </View>
  );
}
