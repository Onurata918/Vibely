import { Video } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { GradientView } from '@/components/ui/GradientView';
import { useLanguage } from '@/context/LanguageContext';
import { person } from '@/lib/utils';

type Room = {
  id: string;
  name: string;
  icon: string;
  locked: boolean;
  members: readonly string[];
};

export function GradRoomCard({ room, onJoin }: { room: Room; onJoin: () => void }) {
  const { t } = useLanguage();
  const shown = room.members.slice(0, 4).map((id) => person(id)).filter((p): p is NonNullable<typeof p> => !!p);
  const extra = room.members.length - shown.length;

  return (
    <View className="flex-1" style={{ borderRadius: 22, overflow: 'hidden' }}>
      <GradientView angle={135} style={{ padding: 14, paddingTop: 15 }}>
        <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(0,0,0,.28)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 16 }}>{room.icon}</Text>
        </View>
        <Text style={{ fontSize: 14.5, fontWeight: '800', color: '#fff', letterSpacing: -0.2 }}>
          {room.name}
          {room.locked ? ' 🔒' : ''}
        </Text>
        <Text style={{ fontSize: 11.5, color: 'rgba(255,255,255,.82)', marginTop: 2, marginBottom: 12 }}>{t('peopleHereCount', { count: room.members.length })}</Text>

        <View className="flex-row items-center" style={{ marginBottom: 13 }}>
          {shown.map((p, i) => (
            <View key={p.id} style={{ marginLeft: i === 0 ? 0 : -9 }}>
              <Avatar person={p} size={28} />
            </View>
          ))}
          {extra > 0 ? (
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,.4)', alignItems: 'center', justifyContent: 'center', marginLeft: 14 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>{`+${extra}`}</Text>
            </View>
          ) : null}
        </View>

        <Pressable
          onPress={onJoin}
          style={{ height: 34, borderRadius: 11, backgroundColor: 'rgba(0,0,0,.32)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}
        >
          <Video size={15} color="#fff" />
          <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#fff' }}>{room.locked ? t('sendRequestShort') : t('join')}</Text>
        </Pressable>
      </GradientView>
    </View>
  );
}
