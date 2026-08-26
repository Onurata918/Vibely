import { useRouter } from 'expo-router';
import type { TabListProps, TabTriggerSlotProps } from 'expo-router/ui';
import { Home, type LucideIcon, Video } from 'lucide-react-native';
import React, { forwardRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Field } from '@/components/ui/Field';
import { GradientView } from '@/components/ui/GradientView';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SheetParagraph, SheetTitle } from '@/components/ui/Sheet';
import { useApp } from '@/context/AppContext';

export const TabButton = forwardRef<View, TabTriggerSlotProps & { icon: LucideIcon; label: string }>(
  ({ icon: Icon, label, isFocused, ...props }, ref) => (
    <Pressable ref={ref} {...props} className="flex-1 items-center" style={{ gap: 4, paddingVertical: 5 }}>
      <Icon size={21} color={isFocused ? '#8b5cf6' : '#635c73'} />
      <Text style={{ fontSize: 10, fontWeight: '600', color: isFocused ? '#fff' : '#635c73' }}>{label}</Text>
    </Pressable>
  )
);
TabButton.displayName = 'TabButton';

function CenterCallButton() {
  const router = useRouter();
  const { call, openSheet, createRoom, enterCall, toast } = useApp();

  const openCreateRoom = () => {
    openSheet(
      'create-room-quick',
      <CreateRoomQuick
        onCreate={(name) => {
          const room = createRoom(name, []);
          enterCall({ kind: 'room', id: room.id, title: room.name });
          router.push('/call');
        }}
      />
    );
  };

  return (
    <Pressable
      onPress={() => {
        if (call) {
          router.push('/call');
          toast('Aktif görüşmene döndün');
        } else {
          openCreateRoom();
        }
      }}
      style={{ flex: 0, alignItems: 'center' }}
    >
      <GradientView
        angle={135}
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -16,
          borderWidth: 4,
          borderColor: '#0c0817',
        }}
      >
        <Video size={23} color="#fff" />
      </GradientView>
    </Pressable>
  );
}

export function CustomTabBarShell(props: TabListProps) {
  const insets = useSafeAreaInsets();
  const children = React.Children.toArray(props.children);
  return (
    <View
      className="flex-row items-end justify-around bg-vbg2 border-t border-vline"
      style={{ paddingBottom: Math.max(insets.bottom, 10), paddingTop: 9, paddingHorizontal: 8 }}
    >
      {children[0]}
      {children[1]}
      <CenterCallButton />
      {children[2]}
      {children[3]}
    </View>
  );
}

function CreateRoomQuick({ onCreate }: { onCreate: (name: string) => void }) {
  const { closeSheet } = useApp();
  const [name, setName] = useState('');
  return (
    <View>
      <SheetTitle>Oda Oluştur 🏠</SheetTitle>
      <SheetParagraph>Odana bir isim ver.</SheetParagraph>
      <Field icon={Home} placeholder="Oda adı (örn. Cuma Gecesi)" value={name} onChangeText={setName} />
      <PrimaryButton
        style={{ marginTop: 12 }}
        onPress={() => {
          closeSheet();
          onCreate(name.trim());
        }}
      >
        Odayı Oluştur ve Başlat
      </PrimaryButton>
    </View>
  );
}
