import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import type { ViewProps } from 'react-native';

const GRAD_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899'] as const;

type Props = ViewProps & { angle?: 90 | 135 };

// --grad (90deg, soldan saga) ve --grad-135 (135deg, capraz) icin ortak sarmalayici.
export function GradientView({ angle = 90, style, children, ...rest }: Props) {
  const end = angle === 135 ? { x: 1, y: 1 } : { x: 1, y: 0 };
  return (
    <LinearGradient colors={GRAD_COLORS} start={{ x: 0, y: 0 }} end={end} style={style} {...rest}>
      {children}
    </LinearGradient>
  );
}
