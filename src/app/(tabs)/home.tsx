import { useRouter } from 'expo-router';
import { Bell, Check, Globe, Plus, Search, UserPlus, Video, X } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradRoomCard } from '@/components/RoomCard';
import { Avatar } from '@/components/ui/Avatar';
import { Logo } from '@/components/ui/Logo';
import { SheetActionRow, SheetParagraph, SheetTitle } from '@/components/ui/Sheet';
import { useApp } from '@/context/AppContext';
import { useLanguage, type Language } from '@/context/LanguageContext';
import { PEOPLE } from '@/lib/vibely-data';

type PersonT = (typeof PEOPLE)[number];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { query, setQuery, rooms, startDial, openSheet, closeSheet, toast, createRoom, enterCall } = useApp();
  const { t, language, setLanguage } = useLanguage();

  const q = query.trim().toLocaleLowerCase('tr-TR');
  const filtered = useMemo(() => PEOPLE.filter((p) => p.name.toLocaleLowerCase('tr-TR').includes(q)), [q]);
  const active = filtered.filter((p) => p.state !== undefined).slice(0, 6);
  const friendsList = filtered.slice(0, 4);
  const searching = query.trim().length > 0;

  const call = (p: PersonT) => {
    if (p.state === 'busy') {
      openSheet(
        'busy',
        <View>
          <SheetTitle>{t('notAvailable', { name: p.name })}</SheetTitle>
          <SheetParagraph>{t('busyModeMessage', { mood: p.mood })}</SheetParagraph>
          <Pressable
            onPress={() => {
              startDial({ kind: 'user', id: p.id, title: p.name });
              router.push('/dialing');
            }}
          >
            <Text style={{ color: '#8b5cf6', fontWeight: '700', paddingVertical: 10 }}>{t('callAnyway')}</Text>
          </Pressable>
        </View>
      );
      return;
    }
    startDial({ kind: 'user', id: p.id, title: p.name });
    router.push('/dialing');
  };

  const joinRoom = (roomId: string) => {
    const r = rooms.find((x) => x.id === roomId);
    if (!r) return;
    if (r.locked) {
      openSheet(
        'join-locked',
        <View>
          <SheetTitle>{t('roomLocked', { name: r.name })}</SheetTitle>
          <SheetParagraph>{t('lockedRoomMessage')}</SheetParagraph>
          <Pressable
            onPress={() => {
              toast(t('requestSentToast'));
              setTimeout(() => {
                toast(t('requestAcceptedToast', { owner: r.owner }));
                setTimeout(() => {
                  enterCall({ kind: 'room', id: r.id, title: r.name });
                  router.push('/call');
                }, 700);
              }, 1600);
            }}
          >
            <Text style={{ color: '#8b5cf6', fontWeight: '700', paddingVertical: 10 }}>{t('sendJoinRequest')}</Text>
          </Pressable>
        </View>
      );
      return;
    }
    enterCall({ kind: 'room', id: r.id, title: r.name });
    router.push('/call');
  };

  const createRoomSheet = () => {
    openSheet(
      'create-room',
      <CreateRoomForm
        onCreate={(name) => {
          const room = createRoom(name, []);
          enterCall({ kind: 'room', id: room.id, title: room.name });
          router.push('/call');
        }}
      />
    );
  };

  const showNotifications = () => {
    openSheet(
      'notifications',
      <View>
        <SheetTitle>{t('notifications')}</SheetTitle>
        <View style={{ marginTop: -4, marginBottom: 6 }}>
          <SheetActionRow label="Zeynep" sub={t('notifInvited')} avatarPerson={PEOPLE.find((p) => p.name === 'Zeynep')} trailing="2 dk" />
          <SheetActionRow label="Mert" sub={t('notifFriendRequest')} avatarPerson={PEOPLE.find((p) => p.name === 'Mert')} trailing="18 dk" />
          <SheetActionRow label="İrem" sub={t('notifLive')} avatarPerson={PEOPLE.find((p) => p.name === 'İrem')} trailing="1 sa" />
        </View>
      </View>
    );
  };

  const addFriendSheet = () => {
    openSheet(
      'add-friend',
      <AddFriendForm
        onSend={(v) => {
          toast(t('friendRequestSentToast', { name: v }));
        }}
      />
    );
  };

  const languageSheet = () => {
    openSheet(
      'language',
      <LanguagePicker
        current={language}
        onPick={(lang) => {
          setLanguage(lang);
          closeSheet();
        }}
      />
    );
  };

  return (
    <View className="flex-1 bg-vbg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between" style={{ paddingHorizontal: 20, paddingVertical: 8 }}>
        <Logo size="sm" />
        <View className="flex-row items-center" style={{ gap: 6 }}>
          <Pressable
            onPress={languageSheet}
            className="flex-row items-center justify-center bg-vinput rounded-full"
            style={{ height: 40, paddingHorizontal: 12, gap: 5 }}
          >
            <Globe size={15} color="#cfc9db" />
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#cfc9db' }}>{language.toUpperCase()}</Text>
          </Pressable>
          <Pressable onPress={showNotifications} className="items-center justify-center bg-vinput rounded-full" style={{ width: 40, height: 40 }}>
            <Bell size={16} color="#cfc9db" />
          </Pressable>
          <Pressable onPress={addFriendSheet} className="items-center justify-center bg-vinput rounded-full" style={{ width: 40, height: 40 }}>
            <UserPlus size={16} color="#cfc9db" />
          </Pressable>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <View className="flex-row items-center bg-vinput border border-vline rounded-2xl" style={{ height: 48, gap: 11, paddingHorizontal: 15 }}>
          <Search size={17} color="#635c73" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('searchFriendsPlaceholder')}
            placeholderTextColor="#635c73"
            style={{ flex: 1, color: '#fff', fontSize: 14 }}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')}>
              <X size={14} color="#635c73" />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        {searching ? (
          <View style={{ paddingTop: 6 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 12 }}>{t('resultsCount', { count: filtered.length })}</Text>
            {filtered.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#635c73', fontSize: 13, paddingVertical: 40 }}>{t('noFriendMatch', { query })}</Text>
            ) : (
              filtered.map((p) => (
                <View key={p.id} className="flex-row items-center bg-vsurface border border-vline rounded-2xl" style={{ gap: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 }}>
                  <Avatar person={p} size={40} dot state={p.state} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13.5, fontWeight: '600', color: '#fff' }}>{p.name}</Text>
                    <Text style={{ fontSize: 12, color: '#8e879f' }}>{p.status}</Text>
                  </View>
                  <Pressable onPress={() => call(p)} className="items-center justify-center" style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#8b5cf6' }}>
                    <Video size={16} color="#fff" />
                  </Pressable>
                </View>
              ))
            )}
          </View>
        ) : (
          <>
            <SectionHeader title={t('activeNow')} onMore={() => router.push('/(tabs)/friends')} />
            {active.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 11, paddingBottom: 4, marginBottom: 26 }}>
                {active.map((p) => (
                  <Pressable key={p.id} onPress={() => call(p)} className="bg-vsurface border border-vline rounded-2xl items-center" style={{ width: 96, paddingVertical: 12, paddingHorizontal: 8, gap: 3 }}>
                    <Avatar person={p} size={58} dot state={p.state} ring />
                    <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#fff', marginTop: 7 }}>{p.name}</Text>
                    <Text style={{ fontSize: 10, color: '#635c73', marginBottom: 9 }} numberOfLines={1}>
                      {p.status}
                    </Text>
                    <View style={{ width: '100%', height: 29, borderRadius: 9, backgroundColor: '#8b5cf6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                      <Video size={12} color="#fff" />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>{t('join')}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <Text style={{ textAlign: 'center', color: '#635c73', fontSize: 13, paddingVertical: 12, marginBottom: 14 }}>{t('noActiveFriends')}</Text>
            )}

            <SectionHeader title={t('yourRooms')} hint={t('roomsHint')} onMore={() => {}} />
            <View className="flex-row" style={{ gap: 12, marginBottom: 26 }}>
              {rooms.map((r) => (
                <GradRoomCard key={r.id} room={r} onJoin={() => joinRoom(r.id)} />
              ))}
            </View>

            <SectionHeader title={t('yourFriends')} onMore={() => router.push('/(tabs)/friends')} />
            <View className="flex-row flex-wrap" style={{ gap: 10 }}>
              {friendsList.map((p) => (
                <View key={p.id} className="flex-row items-center bg-vsurface border border-vline rounded-2xl" style={{ width: '47.5%', gap: 9, paddingHorizontal: 10, paddingVertical: 9 }}>
                  <Avatar person={p} size={34} dot state={p.state} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={{ fontSize: 10, color: p.mood === 'Uygun' ? '#4ade80' : p.mood === 'Oyunda' ? '#a78bfa' : '#f87171' }}>{p.mood}</Text>
                  </View>
                  <Pressable onPress={() => call(p)} className="items-center justify-center" style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.1)' }}>
                    <Video size={13} color="#fff" />
                  </Pressable>
                </View>
              ))}
              <Pressable onPress={createRoomSheet} className="items-center justify-center bg-vsurface rounded-2xl" style={{ width: '47.5%', paddingVertical: 12, gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,.15)', borderStyle: 'dashed' }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={14} color="#fff" />
                </View>
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#d6d1e0' }}>{t('createRoom')}</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SectionHeader({ title, hint, onMore }: { title: string; hint?: string; onMore: () => void }) {
  const { t } = useLanguage();
  return (
    <View className="flex-row items-center justify-between" style={{ marginBottom: 13 }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: -0.2 }}>
        {title} {hint ? <Text style={{ fontSize: 12, fontWeight: '500', color: '#635c73' }}>{hint}</Text> : null}
      </Text>
      <Pressable onPress={onMore}>
        <Text style={{ fontSize: 12.5, fontWeight: '600', color: '#8b5cf6' }}>{t('seeAll')}</Text>
      </Pressable>
    </View>
  );
}

function CreateRoomForm({ onCreate }: { onCreate: (name: string) => void }) {
  const { closeSheet } = useApp();
  const { t } = useLanguage();
  const [name, setName] = React.useState('');
  return (
    <View>
      <SheetTitle>{t('createRoomTitle')}</SheetTitle>
      <SheetParagraph>{t('createRoomSubtitle')}</SheetParagraph>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={t('roomNamePlaceholder')}
        placeholderTextColor="#635c73"
        style={{ backgroundColor: '#171326', borderRadius: 14, paddingHorizontal: 14, height: 52, color: '#fff', marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,.07)' }}
      />
      <Pressable
        onPress={() => {
          closeSheet();
          onCreate(name.trim());
        }}
        style={{ height: 54, borderRadius: 16, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>{t('createAndStartRoom')}</Text>
      </Pressable>
    </View>
  );
}

function AddFriendForm({ onSend }: { onSend: (v: string) => void }) {
  const { closeSheet } = useApp();
  const { t } = useLanguage();
  const [v, setV] = React.useState('');
  return (
    <View>
      <SheetTitle>{t('addFriend')}</SheetTitle>
      <SheetParagraph>{t('findFriendSubtitle')}</SheetParagraph>
      <TextInput
        value={v}
        onChangeText={setV}
        placeholder={t('usernameInputPlaceholder')}
        placeholderTextColor="#635c73"
        autoCapitalize="none"
        style={{ backgroundColor: '#171326', borderRadius: 14, paddingHorizontal: 14, height: 52, color: '#fff', marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,.07)' }}
      />
      <Pressable
        onPress={() => {
          if (!v.trim()) return;
          closeSheet();
          onSend(v.trim());
        }}
        style={{ height: 54, borderRadius: 16, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>{t('sendRequest')}</Text>
      </Pressable>
    </View>
  );
}

function LanguagePicker({ current, onPick }: { current: Language; onPick: (lang: Language) => void }) {
  const options: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  ];
  return (
    <View>
      <SheetTitle>Language / Dil</SheetTitle>
      <View style={{ gap: 9, marginTop: 4 }}>
        {options.map((o) => (
          <Pressable
            key={o.code}
            onPress={() => onPick(o.code)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              height: 54,
              borderRadius: 15,
              backgroundColor: '#1b1629',
              borderWidth: 1,
              borderColor: current === o.code ? 'rgba(139,92,246,.6)' : 'rgba(255,255,255,.07)',
              paddingHorizontal: 16,
            }}
          >
            <Text style={{ fontSize: 20 }}>{o.flag}</Text>
            <Text style={{ flex: 1, fontSize: 14.5, fontWeight: '600', color: '#fff' }}>{o.label}</Text>
            {current === o.code ? <Check size={18} color="#8b5cf6" /> : null}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
