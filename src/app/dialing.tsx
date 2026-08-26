import { useRouter } from 'expo-router';
import { PhoneOff } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { person } from '@/lib/utils';

export default function DialingScreen() {
  const router = useRouter();
  const { pending, cancelDial, enterCall } = useApp();
  const { t } = useLanguage();
  const [status, setStatus] = useState(t('calling'));
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!pending) {
      router.back();
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.12, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();

    let connectTimer: ReturnType<typeof setTimeout> | undefined;
    const statusTimer = setTimeout(() => {
      setStatus(t('connecting'));
      connectTimer = setTimeout(() => {
        enterCall(pending);
        router.replace('/call');
      }, 900);
    }, 1500);

    return () => {
      loop.stop();
      clearTimeout(statusTimer);
      if (connectTimer) clearTimeout(connectTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!pending) return null;

  const p = pending.kind === 'room' ? { name: pending.title, c1: '#7c3aed', c2: '#ec4899' } : person(pending.id) || { name: pending.title, c1: '#7c3aed', c2: '#ec4899' };

  return (
    <View className="flex-1 bg-vbg items-center justify-center">
      <View className="items-center" style={{ gap: 16, marginTop: -60 }}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Avatar person={p} size={128} />
        </Animated.View>
        <View className="items-center" style={{ gap: 6 }}>
          <Text style={{ fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.4 }}>{pending.title}</Text>
          <Text style={{ fontSize: 14, color: '#8e879f' }}>{pending.kind === 'room' ? t('connectingToRoom') : status}</Text>
        </View>
      </View>

      <View style={{ position: 'absolute', bottom: 120 }}>
        <Pressable
          onPress={() => {
            cancelDial();
            router.back();
          }}
          className="items-center justify-center"
          style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#ef4444' }}
        >
          <PhoneOff size={26} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}
