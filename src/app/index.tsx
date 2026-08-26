import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

import { GradientView } from '@/components/ui/GradientView';
import { Logo } from '@/components/ui/Logo';

export default function SplashScreen() {
  const router = useRouter();
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(x, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
    );
    loop.start();
    const t = setTimeout(() => router.replace('/login'), 1900);
    return () => {
      loop.stop();
      clearTimeout(t);
    };
  }, [router, x]);

  return (
    <View className="flex-1 bg-vbg items-center justify-center">
      <Logo size="lg" tagline />
      <View style={{ position: 'absolute', bottom: 110, width: 150, height: 3, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.09)', overflow: 'hidden' }}>
        <Animated.View
          style={{
            width: '40%',
            height: '100%',
            borderRadius: 3,
            transform: [
              {
                translateX: x.interpolate({ inputRange: [0, 1], outputRange: [-70, 220] }),
              },
            ],
          }}
        >
          <GradientView angle={90} style={{ width: '100%', height: '100%', borderRadius: 3 }} />
        </Animated.View>
      </View>
    </View>
  );
}
