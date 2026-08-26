import React, { useEffect, useRef } from 'react';
import { Animated, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/context/AppContext';

export function ToastHost() {
  const { toastMsg } = useApp();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-24)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: toastMsg ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
    Animated.timing(translateY, {
      toValue: toastMsg ? 0 : -24,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [toastMsg, opacity, translateY]);

  if (!toastMsg) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: insets.top + 14,
        alignItems: 'center',
        opacity,
        transform: [{ translateY }],
        zIndex: 500,
      }}
    >
      <Animated.View
        style={{
          backgroundColor: 'rgba(28,23,44,.97)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,.12)',
          borderRadius: 14,
          paddingHorizontal: 17,
          paddingVertical: 11,
          maxWidth: '86%',
        }}
      >
        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>{toastMsg}</Text>
      </Animated.View>
    </Animated.View>
  );
}
