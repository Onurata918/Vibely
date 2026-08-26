import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BilBakalimOverlay } from '@/components/call/BilBakalimOverlay';
import { BlindRankOverlay } from '@/components/call/BlindRankOverlay';
import { CallHeader, LockBanner } from '@/components/call/CallChrome';
import { ChatPanel } from '@/components/call/ChatPanel';
import { ColorClashOverlay } from '@/components/call/ColorClashOverlay';
import { ControlsBar } from '@/components/call/ControlsBar';
import { DrawGameOverlay } from '@/components/call/DrawGameOverlay';
import { HeadsUpOverlay } from '@/components/call/HeadsUpOverlay';
import { Okey101Overlay } from '@/components/call/Okey101Overlay';
import { OkeyOverlay } from '@/components/call/OkeyOverlay';
import { SpyGameOverlay } from '@/components/call/SpyGameOverlay';
import { TabuOverlay } from '@/components/call/TabuOverlay';
import { InviteTile, ParticipantTile, SelfTile, TileGrid } from '@/components/call/Tiles';
import { TruthOrDareOverlay } from '@/components/call/TruthOrDareOverlay';
import { VampireGameOverlay } from '@/components/call/VampireGameOverlay';
import { SheetActionRow, SheetParagraph, SheetTitle } from '@/components/ui/Sheet';
import { useApp, type RankGameKey } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { localizeName } from '@/lib/i18n/itemNames';
import { GAMES, PEOPLE, RANK_GAMES } from '@/lib/vibely-data';

export default function CallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const {
    call,
    mic,
    cam,
    share,
    locked,
    chatOpen,
    unread,
    toggleMic,
    toggleCam,
    toggleShare,
    toggleChat,
    toggleLock,
    leaveCall,
    inviteToRoom,
    openSheet,
    closeSheet,
    openRankGame,
    openSpyGame,
    openTruthOrDare,
    openVampireGame,
    openDrawGame,
    openHeadsUp,
    openTabu,
    openQuiz,
    openOkeyGame,
    toast,
    rank,
    spy,
    truthOrDare,
    vampireGame,
    drawGame,
    headsUp,
    tabu,
    quiz,
    okeyGame,
  } = useApp();
  const [okey101Open, setOkey101Open] = useState(false);
  const [colorClashOpen, setColorClashOpen] = useState(false);

  useEffect(() => {
    if (!call) router.back();
  }, [call, router]);

  if (!call) return null;

  const goBack = () => {
    toast(t('inBackgroundToast'));
    router.back();
  };

  const openEffects = () => {
    openSheet(
      'effects',
      <View>
        <SheetTitle>{t('effectsSheetTitle')}</SheetTitle>
        <SheetParagraph>{t('effectsSheetSubtitle')}</SheetParagraph>
        <View style={{ gap: 9 }}>
          {(RANK_GAMES as readonly { n: string; e: string }[]).map((g) => (
            <Pressable
              key={g.n}
              onPress={() => {
                closeSheet();
                openRankGame(g.n as RankGameKey);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 50, borderRadius: 15, backgroundColor: '#1b1629', borderWidth: 1, borderColor: 'rgba(255,255,255,.07)', paddingHorizontal: 16 }}
            >
              <Text style={{ fontSize: 20 }}>{g.e}</Text>
              <Text style={{ fontSize: 14.5, fontWeight: '600', color: '#fff' }}>{localizeName(g.n, language)}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  const openGames = () => {
    const builtInGames: { emoji: string; label: string; onPress: () => void }[] = [
      { emoji: '🕵️', label: t('gameSpy'), onPress: openSpyGame },
      { emoji: '🎲', label: t('gameTruthOrDare'), onPress: openTruthOrDare },
      { emoji: '🧛', label: t('gameVampire'), onPress: openVampireGame },
      { emoji: '🤳', label: t('gameHeadsUp'), onPress: openHeadsUp },
      { emoji: '🎴', label: t('gameUno'), onPress: () => setColorClashOpen(true) },
      { emoji: '🎨', label: t('gameDraw'), onPress: openDrawGame },
      { emoji: '🚫', label: t('gameTabu'), onPress: openTabu },
      { emoji: '🧠', label: t('gameQuiz'), onPress: openQuiz },
      { emoji: '🀄', label: t('gameOkey'), onPress: openOkeyGame },
      { emoji: '🎲', label: t('gameYuzBir'), onPress: () => setOkey101Open(true) },
    ];
    openSheet(
      'games',
      <View>
        <SheetTitle>{t('gamesSheetTitle')}</SheetTitle>
        <SheetParagraph>{t('gamesSheetSubtitle')}</SheetParagraph>
        <View style={{ gap: 9 }}>
          {builtInGames.map((g) => (
            <Pressable
              key={g.label}
              onPress={() => {
                closeSheet();
                g.onPress();
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 50, borderRadius: 15, backgroundColor: '#1b1629', borderWidth: 1, borderColor: 'rgba(139,92,246,.4)', paddingHorizontal: 16 }}
            >
              <Text style={{ fontSize: 20 }}>{g.emoji}</Text>
              <Text style={{ fontSize: 14.5, fontWeight: '600', color: '#fff' }}>{g.label}</Text>
            </Pressable>
          ))}
          {(GAMES as readonly { n: string; e: string }[])
            .filter((g) => g.n !== 'Doğruluk mu?' && g.n !== 'Çizim Tahmin' && g.n !== 'Bil Bakalım')
            .map((g) => (
            <Pressable
              key={g.n}
              onPress={() => {
                closeSheet();
                toast(t('gameStartedToast', { game: localizeName(g.n, language) }));
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 50, borderRadius: 15, backgroundColor: '#1b1629', borderWidth: 1, borderColor: 'rgba(255,255,255,.07)', paddingHorizontal: 16 }}
            >
              <Text style={{ fontSize: 20 }}>{g.e}</Text>
              <Text style={{ fontSize: 14.5, fontWeight: '600', color: '#fff' }}>{localizeName(g.n, language)}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  const openInvite = () => {
    const inRoom = new Set(call.parts.map((p) => p.id));
    const rest = PEOPLE.filter((p) => !inRoom.has(p.id));
    openSheet(
      'invite',
      <View>
        <SheetTitle>{t('inviteFriendTitle')}</SheetTitle>
        <SheetParagraph>{rest.length ? t('inviteFriendPickSub') : t('inviteFriendAllInSub')}</SheetParagraph>
        {rest.map((p) => (
          <SheetActionRow
            key={p.id}
            label={p.name}
            sub={p.status}
            avatarPerson={p}
            trailing={t('inviteChip')}
            onPress={() => {
              closeSheet();
              inviteToRoom(p);
            }}
          />
        ))}
      </View>
    );
  };

  const confirmLeave = () => {
    openSheet(
      'leave',
      <View>
        <SheetTitle>{t('leaveRoomTitle')}</SheetTitle>
        <SheetParagraph>
          <Text style={{ fontWeight: '700', color: '#fff' }}>{call.title}</Text> {t('leaveRoomConfirm')}{t('leaveRoomConfirmSuffix')}
        </SheetParagraph>
        <Pressable
          onPress={() => {
            closeSheet();
            leaveCall();
            router.back();
          }}
          style={{ height: 52, borderRadius: 15, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{t('leaveAction2')}</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-vbg" style={{ paddingTop: insets.top }}>
      <CallHeader title={call.title} count={call.parts.length + 1} startedAt={call.started} onBack={goBack} onEffects={openEffects} onGames={openGames} onInvite={openInvite} />
      <LockBanner locked={locked} onPress={toggleLock} />

      <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
        <TileGrid>
          {call.parts.map((p) => (
            <ParticipantTile key={p.id} p={p} />
          ))}
          <SelfTile />
          <InviteTile onPress={openInvite} />
        </TileGrid>

        <ChatPanel />
      </ScrollView>

      <ControlsBar
        mic={mic}
        cam={cam}
        share={share}
        chatOpen={chatOpen}
        locked={locked}
        unread={unread}
        onEffects={openEffects}
        onMic={toggleMic}
        onCam={toggleCam}
        onShare={toggleShare}
        onChat={() => toggleChat()}
        onLock={toggleLock}
        onLeave={confirmLeave}
      />
      <View style={{ height: Math.max(insets.bottom, 8) }} />

      {rank ? <BlindRankOverlay /> : null}
      {spy ? <SpyGameOverlay /> : null}
      {truthOrDare ? <TruthOrDareOverlay /> : null}
      {vampireGame ? <VampireGameOverlay /> : null}
      {drawGame ? <DrawGameOverlay /> : null}
      {headsUp ? <HeadsUpOverlay /> : null}
      {colorClashOpen ? <ColorClashOverlay participants={call.parts} onClose={() => setColorClashOpen(false)} /> : null}
      {tabu ? <TabuOverlay /> : null}
      {quiz ? <BilBakalimOverlay /> : null}
      {okeyGame ? <OkeyOverlay /> : null}
      {okey101Open ? <Okey101Overlay participants={call.parts} onClose={() => setOkey101Open(false)} /> : null}
    </View>
  );
}
