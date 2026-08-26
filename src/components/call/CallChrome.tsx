import { ArrowLeft, Gamepad2, LockKeyhole, Sparkles, UserPlus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useLanguage } from '@/context/LanguageContext';
import { fmtDuration } from '@/lib/utils';

export function CallHeader({
  title,
  count,
  startedAt,
  onBack,
  onEffects,
  onGames,
  onInvite,
}: {
  title: string;
  count: number;
  startedAt: number;
  onBack: () => void;
  onEffects: () => void;
  onGames: () => void;
  onInvite: () => void;
}) {
  const { t } = useLanguage();
  const [seconds, setSeconds] = useState(() => Math.floor((Date.now() - startedAt) / 1000));
  useEffect(() => {
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 }}>
      <Pressable onPress={onBack} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#141020', borderWidth: 1, borderColor: 'rgba(255,255,255,.07)', alignItems: 'center', justifyContent: 'center' }}>
        <ArrowLeft size={15} color="#cfc9db" />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: -0.2 }} numberOfLines={1}>
          {title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' }} />
          <Text style={{ fontSize: 11.5, color: '#8e879f' }}>{`${t('peopleCount', { count })} • ${fmtDuration(seconds)}`}</Text>
        </View>
      </View>
      <HeadBtn icon={Sparkles} label={t('effects')} onPress={onEffects} />
      <HeadBtn icon={Gamepad2} label={t('games')} onPress={onGames} />
      <HeadBtn icon={UserPlus} label={t('inviteAction')} onPress={onInvite} />
    </View>
  );
}

function HeadBtn({ icon: Icon, label, onPress }: { icon: typeof Sparkles; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ minWidth: 50, height: 44, borderRadius: 14, backgroundColor: '#141020', borderWidth: 1, borderColor: 'rgba(255,255,255,.07)', alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 5 }}>
      <Icon size={16} color="#cfc9db" />
      <Text style={{ fontSize: 8, fontWeight: '600', color: '#cfc9db' }}>{label}</Text>
    </Pressable>
  );
}

export function LockBanner({ locked, onPress }: { locked: boolean; onPress: () => void }) {
  const { t } = useLanguage();
  if (!locked) return null;
  return (
    <Pressable
      onPress={onPress}
      style={{
        marginHorizontal: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(34,197,94,.13)',
        borderWidth: 1,
        borderColor: 'rgba(34,197,94,.32)',
        borderRadius: 15,
        paddingHorizontal: 13,
        paddingVertical: 11,
      }}
    >
      <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(34,197,94,.26)', alignItems: 'center', justifyContent: 'center' }}>
        <LockKeyhole size={17} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>{t('roomLockedBanner')}</Text>
        <Text style={{ fontSize: 10.5, color: '#8e879f' }}>{t('roomLockedSub')}</Text>
      </View>
    </Pressable>
  );
}
