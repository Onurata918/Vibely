import { LinearGradient } from 'expo-linear-gradient';
import { ArrowDownToLine, Layers, Shuffle, Volume2, VolumeX, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { useLanguage } from '@/context/LanguageContext';
import { useOkey101Game } from '@/hooks/useOkey101Game';
import { useOkey101Sounds } from '@/hooks/useOkey101Sounds';
import { canAddTileToMeld, computeOkeyOf, isWildTile, validateMeld } from '@/lib/okey/engine';
import { calculateOpeningTotal } from '@/lib/okey101/meldValidator';
import { OKEY101_RULE_PRESETS, type Okey101Meld, type Okey101RuleVariant } from '@/lib/okey101/types';
import { TileRack } from '@/components/okey/TileRack';
import { TileView } from '@/components/okey/TileView';
import { OpeningProgress } from '@/components/okey101/OpeningProgress';

type Seat = { id: string; name: string; c1: string; c2: string };

const RULE_LABELS: Record<Okey101RuleVariant, string> = {
  normal101: 'Normal 101',
  katlamali: 'Katlamalı',
  esli: 'Eşli',
  ciftAcma: 'Çift Açma',
  custom: 'Özel',
};

const PLACEHOLDER_COLORS: [string, string][] = [
  ['#f59e0b', '#ef4444'],
  ['#10b981', '#0ea5e9'],
  ['#8b5cf6', '#ec4899'],
];

function MeldRow({ meld, highlighted, onPress }: { meld: Okey101Meld; highlighted?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={{
        flexDirection: 'row',
        gap: 3,
        padding: 5,
        borderRadius: 10,
        backgroundColor: highlighted ? 'rgba(74,222,128,.18)' : 'rgba(255,255,255,.06)',
        borderWidth: 1.5,
        borderColor: highlighted ? '#4ade80' : 'rgba(255,255,255,.1)',
      }}
    >
      {meld.tiles.map((tile, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <TileView key={`${meld.id}-${i}`} tile={tile} size="sm" />
      ))}
    </Pressable>
  );
}

export function Okey101Overlay({ participants, onClose }: { participants: Seat[]; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const game = useOkey101Game();
  const sounds = useOkey101Sounds();
  const [ruleVariant, setRuleVariant] = useState<Okey101RuleVariant>('normal101');
  const g = game.state;

  const startGame = () => {
    const real: Seat[] = [{ id: 'me', name: t('you'), c1: '#6366f1', c2: '#ec4899' }, ...participants];
    const players = real.slice(0, 4);
    while (players.length < 4) {
      const i = players.length;
      const [c1, c2] = PLACEHOLDER_COLORS[(i - 1) % PLACEHOLDER_COLORS.length];
      players.push({ id: `misafir-${i}`, name: `Oyuncu ${i + 1}`, c1, c2 });
    }
    game.startGame(players, OKEY101_RULE_PRESETS[ruleVariant]);
  };

  if (g.phase === 'WAITING_FOR_PLAYERS') {
    return (
      <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
        <Pressable
          onPress={onClose}
          style={{ position: 'absolute', top: insets.top + 10, left: 14, zIndex: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={17} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 18 }}>
          <Text style={{ fontSize: 40 }}>🀄</Text>
          <Text style={{ fontSize: 21, fontWeight: '800', color: '#fff' }}>101 Okey</Text>

          <View style={{ width: '100%', gap: 10 }}>
            <Text style={{ fontSize: 11.5, color: '#8e879f', fontWeight: '700' }}>Kural</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(Object.keys(RULE_LABELS) as Okey101RuleVariant[])
                .filter((k) => k !== 'custom')
                .map((k) => (
                  <Pressable
                    key={k}
                    onPress={() => setRuleVariant(k)}
                    style={{
                      paddingHorizontal: 14,
                      height: 40,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: ruleVariant === k ? '#8b5cf6' : '#1b1629',
                      borderWidth: 1,
                      borderColor: ruleVariant === k ? '#8b5cf6' : 'rgba(255,255,255,.1)',
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12.5 }}>{RULE_LABELS[k]}</Text>
                  </Pressable>
                ))}
            </View>
            <Text style={{ fontSize: 11, color: '#635c73' }}>
              Açılış eşiği: {OKEY101_RULE_PRESETS[ruleVariant].openingScore} puan
            </Text>
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
        </View>
      </View>
    );
  }

  const currentPlayer = g.players[g.currentPlayerIndex];
  const me = currentPlayer; // hot-seat: ekran her zaman sirasi gelen oyuncunun elini gosterir
  const okeyOf = g.indicator ? computeOkeyOf(g.indicator) : null;
  const singleSelectedTile = g.selectedRackIds.length === 1 && me ? (me.rack.find((t) => t.id === g.selectedRackIds[0]) ?? null) : null;
  const anyMeldAddable = me?.hasOpened && singleSelectedTile ? g.tableMelds.some((m) => canAddTileToMeld(m.tiles, singleSelectedTile, okeyOf).ok) : false;
  const pendingValue = calculateOpeningTotal(g.pendingMelds, okeyOf, g.rules);
  const selectedTiles = me ? me.rack.filter((t) => g.selectedRackIds.includes(t.id)) : [];
  const canFormMeld = selectedTiles.length >= 3 && validateMeld(selectedTiles, okeyOf).valid;

  const handleDraw = (fromDiscard: boolean) => {
    if (!me) return;
    if (fromDiscard) game.drawFromDiscard(me.id);
    else game.drawFromPile(me.id);
    sounds.playTilePickup();
  };

  const handleFormMeld = () => {
    if (!me) return;
    game.formMeld(me.id);
    sounds.playTilePlace();
  };

  const handleCommitOpening = () => {
    if (!me) return;
    game.commitOpening(me.id);
    sounds.playOpenSuccess();
  };

  const handleAddToMeld = (meldId: string) => {
    if (!me) return;
    game.addToMeld(me.id, meldId);
    sounds.playTilePlace();
  };

  const handleDiscard = () => {
    if (!me || g.selectedRackIds.length !== 1) return;
    game.discardTile(me.id, g.selectedRackIds[0]);
    sounds.playDiscard();
    if (g.players.length > 1) sounds.playTurnNotify();
  };

  if (g.phase === 'ROUND_FINISHED' || g.phase === 'GAME_FINISHED') {
    const winner = g.players.find((p) => p.id === g.winnerId);
    if (winner && !game.lastError) sounds.playRoundWin();
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
            <Text style={{ fontSize: 44 }}>{winner ? '🏆' : '🤝'}</Text>
            <Text style={{ fontSize: 19, fontWeight: '800', color: '#fff', textAlign: 'center' }}>
              {winner ? `${winner.name} kazandı!` : 'Deste bitti, berabere'}
            </Text>

            {g.lastRoundResults ? (
              <View style={{ width: '100%', gap: 6, backgroundColor: '#141020', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(139,92,246,.25)', padding: 12 }}>
                {g.lastRoundResults.map((r) => {
                  const p = g.players.find((x) => x.id === r.playerId);
                  if (!p) return null;
                  return (
                    <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Avatar person={p} size={24} />
                      <Text style={{ flex: 1, color: '#fff', fontWeight: '600', fontSize: 12.5 }}>{p.name}</Text>
                      <Text style={{ fontSize: 10.5, color: r.playerId === g.winnerId ? '#4ade80' : r.opened ? '#8e879f' : '#f87171', fontWeight: '600' }}>
                        {r.playerId === g.winnerId ? 'Kazandı' : r.opened ? 'Açtı' : 'Açamadı'}
                      </Text>
                      <Text style={{ fontSize: 12.5, color: r.scoreDelta <= 0 ? '#4ade80' : '#f87171', fontWeight: '800', minWidth: 34, textAlign: 'right' }}>
                        {r.scoreDelta > 0 ? `+${r.scoreDelta}` : r.scoreDelta}
                      </Text>
                      <Text style={{ fontSize: 10.5, color: '#635c73', minWidth: 44, textAlign: 'right' }}>{p.score} p</Text>
                    </View>
                  );
                })}
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Pressable onPress={onClose} style={{ height: 50, paddingHorizontal: 16, borderRadius: 15, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Kapat</Text>
              </Pressable>
              <Pressable onPress={game.startNextRound}>
                <LinearGradient colors={['#3b82f6', '#8b5cf6', '#ec4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 50, paddingHorizontal: 22, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Yeni El</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (!me) return null;

  return (
    <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
      <Pressable
        onPress={onClose}
        style={{ position: 'absolute', top: insets.top + 10, left: 14, zIndex: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}
      >
        <X size={17} color="#fff" />
      </Pressable>
      <Pressable
        onPress={() => sounds.setEnabled(!sounds.enabled)}
        style={{ position: 'absolute', top: insets.top + 10, right: 14, zIndex: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}
      >
        {sounds.enabled ? <Volume2 size={16} color="#8e879f" /> : <VolumeX size={16} color="#8e879f" />}
      </Pressable>

      <View style={{ flex: 1, paddingBottom: insets.bottom + 10 }}>
        <View style={{ alignItems: 'center', paddingTop: 54, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#141020', borderWidth: 1, borderColor: 'rgba(139,92,246,.35)', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 }}>
            <Avatar person={me} size={24} />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12.5 }}>
              {g.phase === 'TURN_DRAW' ? `Sıra: ${me.name} — taş çek` : `Sıra: ${me.name} — düzenle/at`}
            </Text>
            {me.hasOpened ? (
              <View style={{ backgroundColor: 'rgba(74,222,128,.18)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ fontSize: 9, color: '#4ade80', fontWeight: '800' }}>Açtı</Text>
              </View>
            ) : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 20 }}>
            {g.players
              .filter((p) => p.id !== me.id)
              .map((p) => (
                <View key={p.id} style={{ alignItems: 'center', gap: 2 }}>
                  <Avatar person={p} size={26} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <View style={{ backgroundColor: '#1b1629', borderRadius: 9, paddingHorizontal: 6, paddingVertical: 1 }}>
                      <Text style={{ fontSize: 9, color: '#d6d1e0', fontWeight: '600' }}>{p.rack.length} taş</Text>
                    </View>
                    {p.hasOpened ? <Text style={{ fontSize: 9 }}>🔓</Text> : null}
                  </View>
                  <Text style={{ fontSize: 9, color: p.score <= 0 ? '#4ade80' : '#f87171', fontWeight: '700' }}>{p.score} p</Text>
                </View>
              ))}
          </ScrollView>

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 20 }}>
            <View style={{ alignItems: 'center', gap: 3 }}>
              <Text style={{ fontSize: 9, color: '#635c73', fontWeight: '700' }}>Gösterge</Text>
              {g.indicator ? <TileView tile={g.indicator} size="sm" /> : null}
            </View>
            <View style={{ alignItems: 'center', gap: 3 }}>
              <Text style={{ fontSize: 9, color: '#eab308', fontWeight: '700' }}>Okey</Text>
              {okeyOf ? <TileView tile={{ id: 'okey-of', kind: 'number', color: okeyOf.color, number: okeyOf.number }} size="sm" isWild /> : null}
            </View>
            <View style={{ alignItems: 'center', gap: 3 }}>
              <Text style={{ fontSize: 9, color: '#635c73', fontWeight: '700' }}>Puanın</Text>
              <Text style={{ fontSize: 14, color: (g.players.find((p) => p.id === 'me')?.score ?? 0) <= 0 ? '#4ade80' : '#f87171', fontWeight: '800' }}>
                {g.players.find((p) => p.id === 'me')?.score ?? 0}
              </Text>
            </View>
          </View>
        </View>

        <LinearGradient
          colors={['#146e46', '#0d5234', '#0a3f28']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ marginTop: 8, marginHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,.08)', overflow: 'hidden' }}
        >
          <ScrollView
            style={{ maxHeight: 190, flexGrow: 0, flexShrink: 0 }}
            contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12, paddingVertical: 10, alignContent: 'flex-start' }}
          >
            {g.tableMelds.length === 0 ? (
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', paddingVertical: 10, width: '100%', textAlign: 'center' }}>Masada henüz taş yok</Text>
            ) : (
              g.tableMelds.map((meld) => {
                const canAdd = !!(me.hasOpened && singleSelectedTile && canAddTileToMeld(meld.tiles, singleSelectedTile, okeyOf).ok);
                return <MeldRow key={meld.id} meld={meld} highlighted={canAdd} onPress={me.hasOpened ? () => handleAddToMeld(meld.id) : undefined} />;
              })
            )}
          </ScrollView>
        </LinearGradient>

        {g.pendingMelds.length > 0 ? (
          <>
            <OpeningProgress current={pendingValue} required={g.rules.openingScore} />
            <View style={{ marginHorizontal: 12, marginTop: 6, padding: 8, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(234,179,8,.5)', borderStyle: 'dashed', backgroundColor: 'rgba(234,179,8,.06)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 10.5, color: '#eab308', fontWeight: '800' }}>Bekleyen açılış</Text>
                <Pressable onPress={() => game.cancelPending(me.id)}>
                  <Text style={{ fontSize: 10.5, color: '#f87171', fontWeight: '700' }}>Geri al</Text>
                </Pressable>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {g.pendingMelds.map((meld) => (
                  <MeldRow key={meld.id} meld={meld} />
                ))}
              </View>
              {pendingValue >= g.rules.openingScore ? (
                <Pressable onPress={handleCommitOpening} style={{ marginTop: 8 }}>
                  <LinearGradient colors={['#3b82f6', '#8b5cf6', '#ec4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12.5 }}>Aç ({pendingValue} p)</Text>
                  </LinearGradient>
                </Pressable>
              ) : null}
            </View>
          </>
        ) : null}

        {g.phase === 'TURN_DRAW' ? (
          <View style={{ paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 26 }}>
            <Pressable onPress={() => handleDraw(false)} style={{ alignItems: 'center', gap: 6 }}>
              <View style={{ width: 52, height: 68, borderRadius: 9, backgroundColor: '#1b1629', borderWidth: 1.5, borderColor: 'rgba(255,255,255,.15)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Layers size={18} color="#8e879f" />
                <Text style={{ fontSize: 10, color: '#8e879f' }}>{g.drawPile.length}</Text>
              </View>
              <Text style={{ fontSize: 11, color: '#8e879f', fontWeight: '600' }}>Desteden çek</Text>
            </Pressable>

            <Pressable onPress={() => handleDraw(true)} disabled={g.discardPile.length === 0} style={{ alignItems: 'center', gap: 6, opacity: g.discardPile.length > 0 ? 1 : 0.35 }}>
              {g.discardPile.length > 0 ? (
                <TileView tile={g.discardPile[g.discardPile.length - 1]} size="md" isWild={isWildTile(g.discardPile[g.discardPile.length - 1], okeyOf)} />
              ) : (
                <View style={{ width: 42, height: 56, borderRadius: 9, borderWidth: 1.5, borderColor: 'rgba(255,255,255,.12)', borderStyle: 'dashed' }} />
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <ArrowDownToLine size={12} color="#8e879f" />
                <Text style={{ fontSize: 11, color: '#8e879f', fontWeight: '600' }}>Atılandan çek</Text>
              </View>
            </Pressable>
          </View>
        ) : null}

        <View style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
          <TileRack>
            {me.rack.map((tile) => (
              <Pressable key={tile.id} onPress={() => game.toggleSelect(me.id, tile.id)}>
                <TileView tile={tile} size="sm" selected={g.selectedRackIds.includes(tile.id)} isWild={isWildTile(tile, okeyOf)} />
              </Pressable>
            ))}
          </TileRack>
        </View>

        {g.phase === 'TURN_ACTION' || g.phase === 'TURN_DISCARD' ? (
          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', paddingTop: 4, flexWrap: 'wrap' }}>
            <Pressable onPress={() => game.sortRack(me.id, 'number')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 42, paddingHorizontal: 12, borderRadius: 13, backgroundColor: '#1b1629' }}>
              <Shuffle size={14} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>Sayıya Göre</Text>
            </Pressable>
            <Pressable onPress={() => game.sortRack(me.id, 'color')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 42, paddingHorizontal: 12, borderRadius: 13, backgroundColor: '#1b1629' }}>
              <Shuffle size={14} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>Renge Göre</Text>
            </Pressable>
            {g.selectedRackIds.length >= 3 ? (
              <Pressable
                onPress={handleFormMeld}
                disabled={!canFormMeld}
                style={{ height: 42, paddingHorizontal: 14, borderRadius: 13, backgroundColor: canFormMeld ? '#4ade80' : '#2a2438', alignItems: 'center', justifyContent: 'center', opacity: canFormMeld ? 1 : 0.6 }}
              >
                <Text style={{ color: canFormMeld ? '#0b0714' : '#8e879f', fontWeight: '700', fontSize: 12 }}>{canFormMeld ? 'Perde Yap' : 'Geçersiz'}</Text>
              </Pressable>
            ) : null}
            {g.selectedRackIds.length === 1 && g.pendingMelds.length === 0 ? (
              <Pressable onPress={handleDiscard} style={{ height: 42, paddingHorizontal: 14, borderRadius: 13, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Taşı At</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {g.selectedRackIds.length === 1 && me.hasOpened ? (
          <Text style={{ fontSize: 10.5, color: anyMeldAddable ? '#4ade80' : '#635c73', textAlign: 'center', paddingTop: 4 }}>
            {anyMeldAddable ? 'Bu taş bir perdeye eklenebilir — perdeye dokun' : 'Bu taş hiçbir perdeye eklenemiyor'}
          </Text>
        ) : null}
        {game.lastError ? <Text style={{ fontSize: 10.5, color: '#f87171', textAlign: 'center', paddingTop: 4 }}>{game.lastError}</Text> : null}
      </View>
    </View>
  );
}
