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
import { MeldBoard, OkeyFelt, SideRack, SortButton, TopRack } from '@/components/okey/TableChrome';
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

  const others = g.players.filter((p) => p.id !== 'me');
  const myState = g.players.find((p) => p.id === 'me') ?? me;
  const activeId = g.players[g.currentPlayerIndex]?.id;
  const seatOf = (p: (typeof g.players)[number]) => ({ name: p.name, c1: p.c1, c2: p.c2, tiles: p.rack.length, opened: p.hasOpened, active: p.id === activeId });

  // Istaka iki katli: taslar ikiye bolunur.
  const rackTiles = myState.rack;
  const half = Math.ceil(rackTiles.length / 2);
  const rackRows = [rackTiles.slice(0, half), rackTiles.slice(half)].map((row) =>
    row.map((tile) => (
      <Pressable key={tile.id} onPress={() => game.toggleSelect(me.id, tile.id)}>
        <TileView tile={tile} size="sm" selected={g.selectedRackIds.includes(tile.id)} isWild={isWildTile(tile, okeyOf)} />
      </Pressable>
    ))
  );

  return (
    <View className="absolute inset-0 z-[300]" style={{ paddingTop: insets.top }}>
      <OkeyFelt />

      {/* ---- Ust serit ---- */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 6, paddingBottom: 4 }}>
        <Pressable onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(5,16,30,.85)', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' }}>
          <X size={17} color="#fff" />
        </Pressable>

        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Text style={{ fontSize: 8.5, color: '#9fb6d4', fontWeight: '800' }}>GÖSTERGE</Text>
            {g.indicator ? <TileView tile={g.indicator} size="xs" /> : null}
          </View>
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Text style={{ fontSize: 8.5, color: '#fbbf24', fontWeight: '800' }}>OKEY</Text>
            {okeyOf ? <TileView tile={{ id: 'okey-of', kind: 'number', color: okeyOf.color, number: okeyOf.number }} size="xs" isWild /> : null}
          </View>
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Text style={{ fontSize: 8.5, color: '#9fb6d4', fontWeight: '800' }}>PUAN</Text>
            <View style={{ backgroundColor: 'rgba(5,16,30,.85)', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,.14)' }}>
              <Text style={{ fontSize: 13, fontWeight: '900', color: (myState.score ?? 0) <= 0 ? '#4ade80' : '#fca5a5' }}>{myState.score ?? 0}</Text>
            </View>
          </View>
        </View>

        <Pressable onPress={() => sounds.setEnabled(!sounds.enabled)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(5,16,30,.85)', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' }}>
          {sounds.enabled ? <Volume2 size={16} color="#fff" /> : <VolumeX size={16} color="#fff" />}
        </Pressable>
      </View>

      {/* ---- Masa ---- */}
      <View style={{ flex: 1, flexDirection: 'row', paddingHorizontal: 8, gap: 6 }}>
        {others[0] ? <SideRack seat={seatOf(others[0])} side="left" /> : null}

        <View style={{ flex: 1, gap: 6 }}>
          {others[1] ? <TopRack seat={seatOf(others[1])} /> : null}

          <MeldBoard>
            <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, padding: 8, alignContent: 'flex-start' }}>
              {g.tableMelds.length === 0 ? (
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,.32)', paddingVertical: 14, width: '100%', textAlign: 'center' }}>Masada henüz perde yok</Text>
              ) : (
                g.tableMelds.map((meld) => {
                  const canAdd = !!(myState.hasOpened && singleSelectedTile && canAddTileToMeld(meld.tiles, singleSelectedTile, okeyOf).ok);
                  return <MeldRow key={meld.id} meld={meld} highlighted={canAdd} onPress={myState.hasOpened ? () => handleAddToMeld(meld.id) : undefined} />;
                })
              )}
            </ScrollView>
          </MeldBoard>

          {/* cekme ve atilan destesi */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 22, paddingVertical: 2 }}>
            <Pressable onPress={() => handleDraw(false)} disabled={g.phase !== 'TURN_DRAW'} style={{ alignItems: 'center', gap: 3, opacity: g.phase === 'TURN_DRAW' ? 1 : 0.45 }}>
              <View style={{ width: 40, height: 55, borderRadius: 6, backgroundColor: '#1d3250', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={16} color="#cfe0f5" />
                <Text style={{ fontSize: 9.5, color: '#cfe0f5', fontWeight: '800', marginTop: 2 }}>{g.drawPile.length}</Text>
              </View>
              <Text style={{ fontSize: 9, color: '#9fb6d4', fontWeight: '700' }}>DESTE</Text>
            </Pressable>

            <Pressable onPress={() => handleDraw(true)} disabled={g.phase !== 'TURN_DRAW' || g.discardPile.length === 0} style={{ alignItems: 'center', gap: 3, opacity: g.phase === 'TURN_DRAW' && g.discardPile.length > 0 ? 1 : 0.45 }}>
              {g.discardPile.length > 0 ? (
                <TileView tile={g.discardPile[g.discardPile.length - 1]} size="md" isWild={isWildTile(g.discardPile[g.discardPile.length - 1], okeyOf)} />
              ) : (
                <View style={{ width: 40, height: 55, borderRadius: 6, borderWidth: 1.5, borderColor: 'rgba(255,255,255,.18)', borderStyle: 'dashed' }} />
              )}
              <Text style={{ fontSize: 9, color: '#9fb6d4', fontWeight: '700' }}>ATILAN</Text>
            </Pressable>
          </View>
        </View>

        {others[2] ? <SideRack seat={seatOf(others[2])} side="right" /> : null}
      </View>

      {/* ---- Bekleyen acilis ---- */}
      {g.pendingMelds.length > 0 ? (
        <View style={{ paddingHorizontal: 10, paddingBottom: 4 }}>
          <OpeningProgress current={pendingValue} required={g.rules.openingScore} />
          <View style={{ marginTop: 4, padding: 7, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(250,204,21,.5)', borderStyle: 'dashed', backgroundColor: 'rgba(250,204,21,.08)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <Text style={{ fontSize: 10, color: '#fbbf24', fontWeight: '900' }}>BEKLEYEN AÇILIŞ</Text>
              <Pressable onPress={() => game.cancelPending(me.id)}>
                <Text style={{ fontSize: 10, color: '#fca5a5', fontWeight: '800' }}>Geri al</Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
              {g.pendingMelds.map((meld) => (
                <MeldRow key={meld.id} meld={meld} />
              ))}
            </View>
            {pendingValue >= g.rules.openingScore ? (
              <Pressable onPress={handleCommitOpening} style={{ marginTop: 6 }}>
                <LinearGradient colors={['#22c55e', '#16a34a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>AÇ ({pendingValue} p)</Text>
                </LinearGradient>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* ---- Istaka ---- */}
      <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 6, paddingHorizontal: 8, paddingBottom: 4 }}>
        <Pressable onPress={() => game.sortRack(me.id, 'number')}>
          <SortButton label={'SIRA\nLA'} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <TileRack rows={rackRows} />
        </View>
        <Pressable onPress={() => game.sortRack(me.id, 'color')}>
          <SortButton label={'RENK'} />
        </Pressable>
      </View>

      {/* ---- Aksiyonlar ---- */}
      <View style={{ paddingHorizontal: 10, paddingBottom: insets.bottom + 6, gap: 4 }}>
        {g.phase === 'TURN_ACTION' || g.phase === 'TURN_DISCARD' ? (
          <View style={{ flexDirection: 'row', gap: 7, justifyContent: 'center', flexWrap: 'wrap' }}>
            {g.selectedRackIds.length >= 3 ? (
              <Pressable
                onPress={handleFormMeld}
                disabled={!canFormMeld}
                style={{ height: 38, paddingHorizontal: 16, borderRadius: 11, backgroundColor: canFormMeld ? '#22c55e' : 'rgba(5,16,30,.8)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' }}
              >
                <Text style={{ color: canFormMeld ? '#06250f' : '#8fa6c2', fontWeight: '900', fontSize: 12 }}>{canFormMeld ? 'PERDE YAP' : 'GEÇERSİZ'}</Text>
              </Pressable>
            ) : null}
            {g.selectedRackIds.length === 1 && g.pendingMelds.length === 0 ? (
              <Pressable onPress={handleDiscard} style={{ height: 38, paddingHorizontal: 18, borderRadius: 11, backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)' }}>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>TAŞI AT</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {g.selectedRackIds.length === 1 && myState.hasOpened ? (
          <Text style={{ fontSize: 10, color: anyMeldAddable ? '#4ade80' : '#7f99b8', textAlign: 'center' }}>
            {anyMeldAddable ? 'Bu taş bir perdeye eklenebilir — perdeye dokun' : 'Bu taş hiçbir perdeye eklenemiyor'}
          </Text>
        ) : null}
        {game.lastError ? <Text style={{ fontSize: 10.5, color: '#fca5a5', textAlign: 'center', fontWeight: '700' }}>{game.lastError}</Text> : null}
      </View>
    </View>
  );
}
