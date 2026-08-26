import { BlurView } from 'expo-blur';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/context/AppContext';

import { Avatar } from './Avatar';
import { DangerButton, GhostButton, PrimaryButton } from './PrimaryButton';

export function SheetTitle({ children }: { children: string }) {
  return <Text style={{ fontSize: 18, fontWeight: '800', letterSpacing: -0.3, color: '#fff', marginBottom: 5 }}>{children}</Text>;
}

export function SheetParagraph({ children }: { children: React.ReactNode }) {
  return <Text style={{ fontSize: 13, color: '#8e879f', lineHeight: 19, marginBottom: 18 }}>{children}</Text>;
}

function SheetShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View className="absolute inset-0 z-[200]" pointerEvents="box-none">
      <Pressable onPress={onClose} style={{ position: 'absolute', inset: 0 }}>
        <BlurView intensity={20} tint="dark" style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.4)' }} />
      </Pressable>
      <View
        className="bg-vbg2"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,.12)',
          borderBottomWidth: 0,
          maxHeight: '80%',
        }}
      >
        <View style={{ width: 38, height: 4, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.12)', alignSelf: 'center', marginTop: 10, marginBottom: 18 }} />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 26 + insets.bottom }}>{children}</ScrollView>
      </View>
    </View>
  );
}

export function SheetHost() {
  const { sheet, closeSheet, knockRequest, acceptKnock, rejectKnock } = useApp();

  if (knockRequest) {
    return (
      <SheetShell onClose={rejectKnock}>
        <SheetTitle>Katılma isteği 🔔</SheetTitle>
        <SheetParagraph>
          <Text style={{ fontWeight: '700', color: '#fff' }}>{knockRequest.name}</Text> kilitli odana katılmak istiyor.
        </SheetParagraph>
        <PrimaryButton onPress={acceptKnock}>Kabul Et</PrimaryButton>
        <GhostButton onPress={rejectKnock} style={{ marginTop: 9 }}>
          Reddet
        </GhostButton>
      </SheetShell>
    );
  }

  if (!sheet) return null;
  return <SheetShell onClose={closeSheet}>{sheet.node}</SheetShell>;
}

export function SheetActionRow({
  label,
  sub,
  avatarPerson,
  onPress,
  trailing,
}: {
  label: string;
  sub?: string;
  avatarPerson?: { name: string; c1: string; c2: string };
  onPress?: () => void;
  trailing?: string;
}) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center" style={{ gap: 13, paddingVertical: 11, borderRadius: 12 }}>
      {avatarPerson ? <Avatar person={avatarPerson} size={40} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14.5, fontWeight: '600', color: '#fff' }}>{label}</Text>
        {sub ? <Text style={{ fontSize: 12, color: '#635c73', marginTop: 2 }}>{sub}</Text> : null}
      </View>
      {trailing ? <Text style={{ fontSize: 12, fontWeight: '700', color: '#8b5cf6' }}>{trailing}</Text> : null}
    </Pressable>
  );
}

export { DangerButton, GhostButton, PrimaryButton };
