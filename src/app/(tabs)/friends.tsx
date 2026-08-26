import { useRouter } from 'expo-router';
import { Search, Video, X } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { PEOPLE } from '@/lib/vibely-data';

export default function FriendsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fquery, setFquery, startDial } = useApp();
  const { t } = useLanguage();

  const q = fquery.trim().toLocaleLowerCase('tr-TR');
  const list = useMemo(() => PEOPLE.filter((p) => p.name.toLocaleLowerCase('tr-TR').includes(q)), [q]);
  const online = list.filter((p) => p.state === 'online');
  const other = list.filter((p) => p.state !== 'online');

  const call = (p: (typeof PEOPLE)[number]) => {
    startDial({ kind: 'user', id: p.id, title: p.name });
    router.push('/dialing');
  };

  const Row = (p: (typeof PEOPLE)[number]) => (
    <View key={p.id} className="flex-row items-center" style={{ gap: 13, paddingHorizontal: 20, paddingVertical: 11 }}>
      <Avatar person={p} size={44} dot state={p.state} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14.5, fontWeight: '600', color: '#fff' }}>{p.name}</Text>
        <Text style={{ fontSize: 12, color: '#635c73', marginTop: 2 }}>{p.status}</Text>
      </View>
      <Pressable onPress={() => call(p)} className="items-center justify-center" style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#8b5cf6' }}>
        <Video size={15} color="#fff" />
      </Pressable>
    </View>
  );

  return (
    <View className="flex-1 bg-vbg" style={{ paddingTop: insets.top }}>
      <Text style={{ fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 18 }}>
        {t('friendsTitle')}
      </Text>
      <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
        <View className="flex-row items-center bg-vinput border border-vline rounded-2xl" style={{ height: 48, gap: 11, paddingHorizontal: 15 }}>
          <Search size={17} color="#635c73" />
          <TextInput
            value={fquery}
            onChangeText={setFquery}
            placeholder={t('searchFriendsPlaceholder')}
            placeholderTextColor="#635c73"
            style={{ flex: 1, color: '#fff', fontSize: 14 }}
          />
          {fquery ? (
            <Pressable onPress={() => setFquery('')}>
              <X size={14} color="#635c73" />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {list.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#635c73', fontSize: 13, paddingVertical: 40 }}>{t('noMatchingFriends')}</Text>
        ) : (
          <>
            {online.length ? (
              <>
                <Text style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, fontSize: 11.5, fontWeight: '700', color: '#635c73', letterSpacing: 0.6 }}>
                  {`${t('online')} — ${online.length}`}
                </Text>
                {online.map(Row)}
              </>
            ) : null}
            {other.length ? (
              <>
                <Text style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, fontSize: 11.5, fontWeight: '700', color: '#635c73', letterSpacing: 0.6 }}>
                  {`${t('busyOrInGame')} — ${other.length}`}
                </Text>
                {other.map(Row)}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}
