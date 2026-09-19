import { useRouter } from 'expo-router';
import { Coins } from 'lucide-react-native';
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
import { ExposeMeOverlay } from '@/components/call/ExposeMeOverlay';
import { FiveSecondOverlay } from '@/components/call/FiveSecondOverlay';
import { HeadsUpOverlay } from '@/components/call/HeadsUpOverlay';
import { Okey101Overlay } from '@/components/call/Okey101Overlay';
import { OkeyOverlay } from '@/components/call/OkeyOverlay';
import { SpyGameOverlay } from '@/components/call/SpyGameOverlay';
import { TabuOverlay } from '@/components/call/TabuOverlay';
import { InviteTile, ParticipantTile, SelfTile, TileGrid } from '@/components/call/Tiles';
import { ThisOrThatOverlay } from '@/components/call/ThisOrThatOverlay';
import { TruthOrDareOverlay } from '@/components/call/TruthOrDareOverlay';
import { VampireGameOverlay } from '@/components/call/VampireGameOverlay';
import { WhosMostOverlay } from '@/components/call/WhosMostOverlay';
import { PaywallOverlay } from '@/components/payments/PaywallOverlay';
import { SheetActionRow, SheetParagraph, SheetTitle } from '@/components/ui/Sheet';
import { useApp, type RankGameKey } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePayments } from '@/context/PaymentsContext';
import { localizeDataName } from '@/lib/i18n/itemNames.data';
import { localizeName } from '@/lib/i18n/itemNames';
import { isCallBlocked } from '@/lib/payments/engine';
import { GAME_COST_HIGH, GAME_COST_LOW } from '@/lib/payments/types';
import { GAMES, PEOPLE, RANK_GAMES } from '@/lib/vibely-data';

const CALL_TICK_SECONDS = 10;

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
  const [whosMostOpen, setWhosMostOpen] = useState(false);
  const [thisOrThatOpen, setThisOrThatOpen] = useState(false);
  const [fiveSecondOpen, setFiveSecondOpen] = useState(false);
  const [exposeMeOpen, setExposeMeOpen] = useState(false);
  const [limitPaywallOpen, setLimitPaywallOpen] = useState(false);
  const [jetonPaywallOpen, setJetonPaywallOpen] = useState(false);
  const payments = usePayments();

  useEffect(() => {
    if (!call) router.back();
  }, [call, router]);

  // Premium olmayan kullanicilar icin gunluk/aylik konusma suresini takip et;
  // sinira ulasinca zorunlu paywall'i ac.
  useEffect(() => {
    if (!call || payments.payments.isPremium) return;
    const id = setInterval(() => {
      payments.tickCallSeconds(CALL_TICK_SECONDS);
    }, CALL_TICK_SECONDS * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call, payments.payments.isPremium]);

  useEffect(() => {
    if (isCallBlocked(payments.payments)) setLimitPaywallOpen(true);
  }, [payments.payments]);

  if (!call) return null;

  const callTitle = call.kind === 'room' ? localizeDataName(call.title, language) : call.title;

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
          <Pressable
            onPress={() => {
              closeSheet();
              setWhosMostOpen(true);
            }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 50, borderRadius: 15, backgroundColor: '#1b1629', borderWidth: 1, borderColor: 'rgba(139,92,246,.4)', paddingHorizontal: 16 }}
          >
            <Text style={{ fontSize: 20 }}>🗳️</Text>
            <Text style={{ fontSize: 14.5, fontWeight: '600', color: '#fff' }}>{t('gameWhosMost')}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              closeSheet();
              setThisOrThatOpen(true);
            }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 50, borderRadius: 15, backgroundColor: '#1b1629', borderWidth: 1, borderColor: 'rgba(139,92,246,.4)', paddingHorizontal: 16 }}
          >
            <Text style={{ fontSize: 20 }}>⚡</Text>
            <Text style={{ fontSize: 14.5, fontWeight: '600', color: '#fff' }}>{t('gameThisOrThat')}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              closeSheet();
              setFiveSecondOpen(true);
            }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 50, borderRadius: 15, backgroundColor: '#1b1629', borderWidth: 1, borderColor: 'rgba(139,92,246,.4)', paddingHorizontal: 16 }}
          >
            <Text style={{ fontSize: 20 }}>⏱️</Text>
            <Text style={{ fontSize: 14.5, fontWeight: '600', color: '#fff' }}>{t('gameFiveSecond')}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              closeSheet();
              setExposeMeOpen(true);
            }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 50, borderRadius: 15, backgroundColor: '#1b1629', borderWidth: 1, borderColor: 'rgba(139,92,246,.4)', paddingHorizontal: 16 }}
          >
            <Text style={{ fontSize: 20 }}>🙈</Text>
            <Text style={{ fontSize: 14.5, fontWeight: '600', color: '#fff' }}>{t('gameExposeMe')}</Text>
          </Pressable>
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

  // Premium kullanicilar ucretsiz oynar; degilse jeton bakiyesi yetiyorsa dusulur,
  // yetmiyorsa jeton paywall'i acilir.
  const startGame = (label: string, cost: number, open: () => void) => {
    if (!payments.payments.isPremium) {
      if (payments.payments.jetonBalance < cost) {
        closeSheet();
        toast(t('payGameNeedJetonsToast', { cost, game: label }));
        setJetonPaywallOpen(true);
        return;
      }
      payments.spendJetonsForGame(cost);
      toast(t('payGameChargedToast', { cost }));
    }
    closeSheet();
    open();
  };

  const openGames = () => {
    const builtInGames: { emoji: string; label: string; cost: number; onPress: () => void }[] = [
      { emoji: '🕵️', label: t('gameSpy'), cost: GAME_COST_LOW, onPress: openSpyGame },
      { emoji: '🎲', label: t('gameTruthOrDare'), cost: GAME_COST_LOW, onPress: openTruthOrDare },
      { emoji: '🧛', label: t('gameVampire'), cost: GAME_COST_LOW, onPress: openVampireGame },
      { emoji: '🤳', label: t('gameHeadsUp'), cost: GAME_COST_LOW, onPress: openHeadsUp },
      { emoji: '🎴', label: t('gameUno'), cost: GAME_COST_HIGH, onPress: () => setColorClashOpen(true) },
      { emoji: '🎨', label: t('gameDraw'), cost: GAME_COST_LOW, onPress: openDrawGame },
      { emoji: '🚫', label: t('gameTabu'), cost: GAME_COST_LOW, onPress: openTabu },
      { emoji: '🧠', label: t('gameQuiz'), cost: GAME_COST_LOW, onPress: openQuiz },
      { emoji: '🀄', label: t('gameOkey'), cost: GAME_COST_HIGH, onPress: openOkeyGame },
      { emoji: '🎲', label: t('gameYuzBir'), cost: GAME_COST_HIGH, onPress: () => setOkey101Open(true) },
    ];
    openSheet(
      'games',
      <View>
        <SheetTitle>{t('gamesSheetTitle')}</SheetTitle>
        <SheetParagraph>{t('gamesSheetSubtitle')}</SheetParagraph>
        <View style={{ gap: 9 }}>
          {builtInGames.map((g) => {
            const free = payments.payments.isPremium;
            const affordable = free || payments.payments.jetonBalance >= g.cost;
            return (
              <Pressable
                key={g.label}
                onPress={() => startGame(g.label, g.cost, g.onPress)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 50, borderRadius: 15, backgroundColor: '#1b1629', borderWidth: 1, borderColor: 'rgba(139,92,246,.4)', paddingHorizontal: 16 }}
              >
                <Text style={{ fontSize: 20 }}>{g.emoji}</Text>
                <Text style={{ flex: 1, fontSize: 14.5, fontWeight: '600', color: '#fff' }}>{g.label}</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    height: 24,
                    paddingHorizontal: 9,
                    borderRadius: 999,
                    backgroundColor: free ? 'rgba(74,222,128,.15)' : affordable ? 'rgba(250,204,21,.13)' : 'rgba(248,113,113,.13)',
                  }}
                >
                  {free ? null : <Coins size={12} color={affordable ? '#facc15' : '#f87171'} />}
                  <Text style={{ fontSize: 11, fontWeight: '800', color: free ? '#4ade80' : affordable ? '#facc15' : '#f87171' }}>
                    {free ? t('payGameFreeBadge') : t('payGameCostBadge', { cost: g.cost })}
                  </Text>
                </View>
              </Pressable>
            );
          })}
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
            sub={localizeDataName(p.status, language)}
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
          <Text style={{ fontWeight: '700', color: '#fff' }}>{callTitle}</Text> {t('leaveRoomConfirm')}{t('leaveRoomConfirmSuffix')}
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
      <CallHeader title={callTitle} count={call.parts.length + 1} startedAt={call.started} onBack={goBack} onEffects={openEffects} onGames={openGames} onInvite={openInvite} />
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
        onMic={toggleMic}
        onCam={toggleCam}
        onShare={toggleShare}
        onChat={() => toggleChat()}
        onLock={toggleLock}
        onLeave={confirmLeave}
      />
      <View style={{ height: Math.max(insets.bottom, 8) }} />

      {whosMostOpen ? <WhosMostOverlay participants={call.parts} onClose={() => setWhosMostOpen(false)} /> : null}
      {thisOrThatOpen ? <ThisOrThatOverlay participants={call.parts} onClose={() => setThisOrThatOpen(false)} /> : null}
      {fiveSecondOpen ? <FiveSecondOverlay participants={call.parts} onClose={() => setFiveSecondOpen(false)} /> : null}
      {exposeMeOpen ? <ExposeMeOverlay participants={call.parts} onClose={() => setExposeMeOpen(false)} /> : null}
      {limitPaywallOpen ? <PaywallOverlay reason="limit" onClose={() => setLimitPaywallOpen(false)} /> : null}
      {jetonPaywallOpen ? <PaywallOverlay reason="manual" focus="jetons" onClose={() => setJetonPaywallOpen(false)} /> : null}
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
