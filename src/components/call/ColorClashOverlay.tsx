import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { RotateCw, Volume2, VolumeX, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Card, CardBack } from '@/components/colorClash/Card';
import { useApp } from '@/context/AppContext';
import { useColorClashGame } from '@/hooks/useColorClashGame';
import { useColorClashSounds } from '@/hooks/useColorClashSounds';
import { canPlayCard } from '@/lib/colorClash/validation';
import { CLASH_COLOR_HEX, CLASH_COLOR_SYMBOL, DEFAULT_CLASH_RULES, type ClashColor, type ClashRules } from '@/lib/colorClash/types';

type Seat = { id: string; name: string; c1: string; c2: string };

function LocalVideoStrip() {
  const { mic, cam, front, user } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const showCamera = cam && permission?.granted;

  React.useEffect(() => {
    if (cam && !permission?.granted) requestPermission();
  }, [cam, permission?.granted, requestPermission]);

  return (
    <View style={{ width: 46, height: 46, borderRadius: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: mic ? '#8b5cf6' : 'rgba(255,255,255,.15)' }}>
      {showCamera ? (
        <CameraView style={{ flex: 1 }} facing={front ? 'front' : 'back'} mirror={front} />
      ) : (
        <View style={{ flex: 1, backgroundColor: '#2a1a5e', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{(user?.name || '?').slice(0, 1).toUpperCase()}</Text>
        </View>
      )}
    </View>
  );
}

// Diger katilimcilarin gercek kamera akisi yok (Vibely'de henuz gercek
// cihazlar-arasi baglanti kurulmadi) — mevcut ParticipantTile deseniyle
// tutarli sekilde isim/avatar gosterilir.
function OpponentVideoTile({ seat }: { seat: Seat }) {
  return (
    <View style={{ alignItems: 'center', gap: 3 }}>
      <Avatar person={seat} size={40} ring />
    </View>
  );
}

export function ColorClashOverlay({ participants, onClose }: { participants: Seat[]; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const game = useColorClashGame();
  const sounds = useColorClashSounds();
  const [rules, setRules] = useState<ClashRules>(DEFAULT_CLASH_RULES);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const g = game.state;

  const startGame = () => {
    const real: Seat[] = [{ id: 'me', name: user?.name || 'Sen', c1: '#6366f1', c2: '#ec4899' }, ...participants];
    game.startGame(real, rules);
  };

  const toggleRule = (key: keyof ClashRules) => {
    setRules((r) => ({ ...r, [key]: !r[key] }));
  };

  if (g.phase === 'lobby') {
    return (
      <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
        <Pressable
          onPress={onClose}
          style={{ position: 'absolute', top: insets.top + 10, left: 14, zIndex: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={17} color="#fff" />
        </Pressable>
        <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 60, gap: 16 }}>
          <View style={{ flexDirection: 'row', gap: -6 }}>
            {(['coral', 'violet', 'teal', 'amber'] as const).map((c, i) => (
              <View key={c} style={{ width: 30, height: 42, borderRadius: 7, backgroundColor: CLASH_COLOR_HEX[c], marginLeft: i === 0 ? 0 : -14, borderWidth: 2, borderColor: '#0b0714', transform: [{ rotate: `${(i - 1.5) * 10}deg` }] }} />
            ))}
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>Color Clash</Text>

          <View style={{ width: '100%', gap: 10 }}>
            <Text style={{ fontSize: 11.5, color: '#8e879f', fontWeight: '700' }}>Kurallar</Text>
            {(
              [
                ['stacking', 'Yığma (Stacking)'],
                ['forcePlay', 'Zorunlu Oyna (Force Play)'],
                ['drawFourChallenge', '+4 İtirazı'],
                ['lastCardCallRequired', 'Son Kart Bildirimi'],
              ] as [keyof ClashRules, string][]
            ).map(([key, label]) => (
              <Pressable
                key={key}
                onPress={() => toggleRule(key)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 46, paddingHorizontal: 14, borderRadius: 13, backgroundColor: '#1b1629', borderWidth: 1, borderColor: 'rgba(255,255,255,.08)' }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>{label}</Text>
                <View style={{ width: 40, height: 24, borderRadius: 12, backgroundColor: rules[key] ? '#8b5cf6' : 'rgba(255,255,255,.14)', padding: 2, alignItems: rules[key] ? 'flex-end' : 'flex-start' }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' }} />
                </View>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={() => sounds.setEnabled(!sounds.enabled)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {sounds.enabled ? <Volume2 size={16} color="#8e879f" /> : <VolumeX size={16} color="#8e879f" />}
            <Text style={{ fontSize: 12.5, color: '#8e879f', fontWeight: '600' }}>Ses {sounds.enabled ? 'Açık' : 'Kapalı'}</Text>
          </Pressable>

          <Pressable onPress={startGame} style={{ marginTop: 6 }}>
            <LinearGradient colors={['#3b82f6', '#8b5cf6', '#ec4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 52, paddingHorizontal: 28, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Oyunu Başlat</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  if (g.phase === 'roundFinished' || g.phase === 'matchFinished') {
    const winner = g.players.find((p) => p.id === g.winnerId);
    return (
      <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
        <Pressable
          onPress={onClose}
          style={{ position: 'absolute', top: insets.top + 10, left: 14, zIndex: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={17} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 }}>
          <View style={{ alignItems: 'center', gap: 14, width: '100%' }}>
            <Text style={{ fontSize: 44 }}>🏆</Text>
            {winner ? <Avatar person={winner} size={60} /> : null}
            <Text style={{ fontSize: 19, fontWeight: '800', color: '#fff', textAlign: 'center' }}>{winner ? `${winner.name} kazandı!` : 'Round bitti'}</Text>
            {g.lastRoundScore !== null ? <Text style={{ fontSize: 13, color: '#4ade80', fontWeight: '700' }}>+{g.lastRoundScore} puan</Text> : null}

            {g.lastRoundHandCounts ? (
              <View style={{ width: '100%', gap: 6, backgroundColor: '#141020', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(139,92,246,.25)', padding: 12 }}>
                {g.players.map((p) => (
                  <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Avatar person={p} size={22} />
                    <Text style={{ flex: 1, color: '#fff', fontWeight: '600', fontSize: 12.5 }}>{p.name}</Text>
                    <Text style={{ fontSize: 11, color: '#8e879f' }}>{p.id === g.winnerId ? 'Elini bitirdi' : `${g.lastRoundHandCounts?.[p.id] ?? 0} kart`}</Text>
                    <Text style={{ fontSize: 12.5, color: '#a78bfa', fontWeight: '800', minWidth: 40, textAlign: 'right' }}>{p.score} p</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <Pressable onPress={onClose} style={{ height: 50, paddingHorizontal: 16, borderRadius: 15, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Çağrıya Dön</Text>
              </Pressable>
              <Pressable onPress={game.startNextRound}>
                <LinearGradient colors={['#3b82f6', '#8b5cf6', '#ec4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 50, paddingHorizontal: 22, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Tekrar Oyna</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  }

  const me = g.players[g.currentPlayerIndex];
  if (!me) return null;
  const top = g.discardPile[g.discardPile.length - 1];
  const declarer = g.pendingDeclareId ? g.players.find((p) => p.id === g.pendingDeclareId) : null;
  const challenger = g.challenge ? g.players.find((p) => p.id === g.challenge!.challengerId) : null;
  const accused = g.challenge ? g.players.find((p) => p.id === g.challenge!.accusedId) : null;
  const catchable = g.players.find((p) => p.hand.length === 1 && !p.declaredLastCard);

  const handlePlay = (cardId: string) => {
    game.playCard(me.id, cardId);
    sounds.playCardPlay();
    setSelectedCardId(null);
  };

  return (
    <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
      <Pressable
        onPress={onClose}
        style={{ position: 'absolute', top: insets.top + 10, left: 14, zIndex: 20, width: 38, height: 38, borderRadius: 19, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}
      >
        <X size={17} color="#fff" />
      </Pressable>
      <Pressable
        onPress={() => sounds.setEnabled(!sounds.enabled)}
        style={{ position: 'absolute', top: insets.top + 10, right: 14, zIndex: 20, width: 38, height: 38, borderRadius: 19, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}
      >
        {sounds.enabled ? <Volume2 size={16} color="#8e879f" /> : <VolumeX size={16} color="#8e879f" />}
      </Pressable>

      <View style={{ flex: 1, paddingBottom: insets.bottom + 10 }}>
        {/* kompakt katilimci seridi (Vibely'nin video-call farklandiricisi) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 60, paddingTop: 6, alignItems: 'center' }}>
          <LocalVideoStrip />
          {g.players
            .filter((p) => p.id !== 'me')
            .map((p) => (
              <OpponentVideoTile key={p.id} seat={p} />
            ))}
        </ScrollView>

        <View style={{ alignItems: 'center', paddingTop: 10, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#141020', borderWidth: 1, borderColor: 'rgba(139,92,246,.35)', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 }}>
            <Avatar person={me} size={22} />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12.5 }}>{me.id === 'me' ? 'Senin Sıran' : `Sıra: ${me.name}`}</Text>
          </View>
          {catchable ? (
            <Pressable
              onPress={() => game.catchForgotDeclare(me.id, catchable.id)}
              style={{ backgroundColor: 'rgba(239,68,68,.16)', borderWidth: 1, borderColor: 'rgba(239,68,68,.4)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5 }}
            >
              <Text style={{ color: '#f87171', fontSize: 11, fontWeight: '700' }}>{catchable.name} bildirmedi — Yakala!</Text>
            </Pressable>
          ) : null}
          {g.lastMessage ? (
            <View style={{ backgroundColor: 'rgba(139,92,246,.16)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 }}>
              <Text style={{ color: '#c4b5fd', fontSize: 11, fontWeight: '600' }}>{g.lastMessage}</Text>
            </View>
          ) : null}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingTop: 4 }}>
            {g.players
              .filter((p) => p.id !== me.id)
              .map((p) => (
                <View key={p.id} style={{ alignItems: 'center', gap: 2 }}>
                  <Text style={{ fontSize: 9.5, color: '#d6d1e0', fontWeight: '600' }}>{p.name}</Text>
                  <View style={{ backgroundColor: '#1b1629', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 }}>
                    <Text style={{ fontSize: 9.5, color: p.hand.length === 1 ? '#f87171' : '#8e879f', fontWeight: '700' }}>{p.hand.length} kart</Text>
                  </View>
                </View>
              ))}
          </ScrollView>
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <RotateCw size={13} color="#635c73" style={{ transform: [{ scaleX: g.direction === -1 ? -1 : 1 }] }} />
            {g.activeColor ? (
              <>
                <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: CLASH_COLOR_HEX[g.activeColor] }} />
                <Text style={{ fontSize: 11.5, color: '#8e879f', fontWeight: '600' }}>
                  {CLASH_COLOR_SYMBOL[g.activeColor]} {g.activeColor}
                </Text>
              </>
            ) : null}
            {g.pendingDrawPenalty > 0 ? (
              <View style={{ marginLeft: 8, backgroundColor: 'rgba(239,68,68,.18)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ color: '#f87171', fontWeight: '800', fontSize: 12 }}>+{g.pendingDrawPenalty}</Text>
              </View>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
            <Pressable onPress={() => { game.drawCard(me.id); sounds.playDraw(); }} disabled={g.hasDrawnThisTurn && g.pendingDrawPenalty === 0}>
              <View style={{ opacity: g.hasDrawnThisTurn && g.pendingDrawPenalty === 0 ? 0.4 : 1 }}>
                <CardBack size="lg" />
                <Text style={{ position: 'absolute', bottom: 6, right: 8, fontSize: 10, color: '#fff', fontWeight: '700' }}>{g.drawPile.length}</Text>
              </View>
            </Pressable>

            {top ? <Card card={top} size="lg" /> : null}
          </View>

          {g.hasDrawnThisTurn && g.pendingDrawPenalty === 0 ? (
            <Pressable onPress={() => game.endTurnAfterDraw(me.id)}>
              <View style={{ height: 40, paddingHorizontal: 18, borderRadius: 13, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12.5 }}>Turu Bitir</Text>
              </View>
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 20, paddingVertical: 14, alignItems: 'flex-end' }}>
          {me.hand.map((card) => {
            const playable = top ? canPlayCard(card, top, g.activeColor) : false;
            const isSelected = selectedCardId === card.id;
            return (
              <Pressable
                key={card.id}
                onPress={() => (isSelected ? handlePlay(card.id) : setSelectedCardId(card.id))}
                hitSlop={4}
              >
                <Card card={card} size="md" dim={!playable} lifted={isSelected} />
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Renk secici */}
      {g.phase === 'choosingColor' ? (
        <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(8,5,15,.92)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 }}>
          <View style={{ alignItems: 'center', gap: 20 }}>
            <Text style={{ fontSize: 19, fontWeight: '800', color: '#fff' }}>Renk Seç</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center', maxWidth: 220 }}>
              {(['coral', 'violet', 'teal', 'amber'] as ClashColor[]).map((color) => (
                <Pressable
                  key={color}
                  onPress={() => {
                    game.selectColor(me.id, color);
                    sounds.playWild();
                  }}
                >
                  <View style={{ width: 88, height: 88, borderRadius: 20, backgroundColor: CLASH_COLOR_HEX[color], alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: '900', fontSize: 22 }}>{CLASH_COLOR_SYMBOL[color]}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      ) : null}

      {/* LAST CARD bildirimi */}
      {declarer ? (
        <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(8,5,15,.92)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 }}>
          <View style={{ alignItems: 'center', gap: 20 }}>
            <Text style={{ fontSize: 44 }}>🎉</Text>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: 1 }}>LAST CARD!</Text>
            <Text style={{ fontSize: 12.5, color: '#8e879f', textAlign: 'center', maxWidth: 260 }}>{declarer.name}, tek kart kaldı — bildirmezsen başkası yakalayabilir.</Text>
            <Pressable
              onPress={() => {
                game.declareLastCard(declarer.id);
                sounds.playLastCard();
              }}
            >
              <LinearGradient colors={['#3b82f6', '#8b5cf6', '#ec4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 58, paddingHorizontal: 34, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 17 }}>Bildir!</Text>
              </LinearGradient>
            </Pressable>
            <Pressable onPress={() => game.skipDeclare(declarer.id)}>
              <Text style={{ color: '#635c73', fontWeight: '600', fontSize: 12.5 }}>Geç</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* +4 itiraz penceresi */}
      {g.phase === 'awaitingChallenge' && challenger ? (
        <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(8,5,15,.92)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 }}>
          <View style={{ alignItems: 'center', gap: 18 }}>
            <Text style={{ fontSize: 40 }}>🤨</Text>
            <Text style={{ fontSize: 19, fontWeight: '800', color: '#fff', textAlign: 'center' }}>{challenger.name}, +4 geldi</Text>
            <Text style={{ fontSize: 12.5, color: '#8e879f', textAlign: 'center', maxWidth: 280 }}>{accused?.name ?? ''} elinde uygun renk yokken mi oynadı?</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable onPress={() => game.resolveChallenge(challenger.id, false)} style={{ height: 50, paddingHorizontal: 18, borderRadius: 15, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>+4'ü Kabul Et</Text>
              </Pressable>
              <Pressable onPress={() => game.resolveChallenge(challenger.id, true)}>
                <LinearGradient colors={['#3b82f6', '#8b5cf6', '#ec4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 50, paddingHorizontal: 18, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>İtiraz Et</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      {game.lastError ? (
        <View style={{ position: 'absolute', bottom: insets.bottom + 6, left: 20, right: 20, alignItems: 'center' }}>
          <View style={{ backgroundColor: 'rgba(239,68,68,.9)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{game.lastError}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}
