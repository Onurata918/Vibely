import React from 'react';
import { ActivityIndicator, Pressable, Text, type ViewStyle } from 'react-native';

import { GradientView } from './GradientView';

type Props = {
  children: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function PrimaryButton({ children, onPress, disabled, loading, style }: Props) {
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }, style]}>
      <GradientView
        angle={90}
        style={{
          height: 54,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 9,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {loading ? <ActivityIndicator color="#fff" size="small" /> : null}
        <Text style={{ color: '#fff', fontSize: 15.5, fontWeight: '700', letterSpacing: 0.2 }}>{children}</Text>
      </GradientView>
    </Pressable>
  );
}

export function GhostButton({ children, onPress, style }: { children: string; onPress?: () => void; style?: ViewStyle }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          height: 50,
          borderRadius: 15,
          backgroundColor: '#1b1629',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,.07)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text style={{ color: '#fff', fontSize: 14.5, fontWeight: '600' }}>{children}</Text>
    </Pressable>
  );
}

export function DangerButton({ children, onPress, style }: { children: string; onPress?: () => void; style?: ViewStyle }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        { height: 52, borderRadius: 15, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>{children}</Text>
    </Pressable>
  );
}
