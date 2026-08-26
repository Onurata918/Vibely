import { ArrowDownToLine, Layers, Shuffle, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { GradientView } from '@/components/ui/GradientView';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { isWildTile } from '@/lib/okey/engine';
import { TileView } from '@/components/okey/TileView';
import { TileRack } from '@/components/okey/TileRack';

export function OkeyOverlay() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const {
    okeyGame: o,
    closeOkeyGame,
    drawOkeyFromPile,
    drawOkeyFromDiscard,
    reorderOkeyHand,
    autoSortOkeyHand,
    discardOkeyTile,
    declareOkeyWin,
    restartOkeyGame,
  } = useApp();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!o) return null;

  const currentPlayer = o.players[o.currentPlayerIndex];
  const winner = o.players.find((p) => p.id === o.winnerId);

  const tapTile = (i: number) => {
    if (o.phase !== 'discard') return;
    if (selectedIndex === null) setSelectedIndex(i);
    else if (selectedIndex === i) setSelectedIndex(null);
    else {
      reorderOkeyHand(selectedIndex, i);
      setSelectedIndex(null);
    }
  };

  const discardSelected = () => {
    if (selectedIndex === null) return;
    const tile = o.hand[selectedIndex];
    if (tile) discardOkeyTile(tile.id);
    setSelectedIndex(null);
  };

  return (
    <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
      <Pressable
        onPress={closeOkeyGame}
        style={{ position: 'absolute', top: insets.top + 10, left: 14, zIndex: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}
      >
        <X size={17} color="#fff" />
      </Pressable>

      {o.phase !== 'game-over' ? (
        <View style={{ flex: 1, paddingBottom: insets.bottom + 16 }}>
          <View style={{ alignItems: 'center', paddingTop: 8, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#141020', borderWidth: 1, borderColor: 'rgba(139,92,246,.35)', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 }}>
              <Avatar person={currentPlayer} size={26} />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                {o.phase === 'draw'
                  ? t('okeyTurnDraw', { name: currentPlayer?.name ?? '' })
                  : t('okeyTurnDiscard', { name: currentPlayer?.name ?? '' })}
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 20 }}>
              {o.players
                .filter((p) => p.id !== currentPlayer?.id)
                .map((p) => (
                  <View key={p.id} style={{ alignItems: 'center', gap: 3 }}>
                    <Avatar person={p} size={28} />
                    <View style={{ backgroundColor: '#1b1629', borderRadius: 9, paddingHorizontal: 6, paddingVertical: 1 }}>
                      <Text style={{ fontSize: 9.5, color: '#d6d1e0', fontWeight: '600' }}>{`${o.handCounts[p.id] ?? 0}`}</Text>
                    </View>
                  </View>
                ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 22 }}>
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 9.5, color: '#635c73', fontWeight: '700' }}>{t('okeyIndicatorLabel')}</Text>
                {o.indicator ? <TileView tile={o.indicator} size="sm" /> : null}
              </View>
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 9.5, color: '#eab308', fontWeight: '700' }}>{t('okeyOkeyLabel')}</Text>
                {o.okeyOf ? <TileView tile={{ id: 'okey-of', kind: 'number', color: o.okeyOf.color, number: o.okeyOf.number }} size="sm" isWild /> : null}
              </View>
            </View>
          </View>

          {o.phase === 'draw' ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 26 }}>
              <Pressable onPress={drawOkeyFromPile} style={{ alignItems: 'center', gap: 6 }}>
                <View style={{ width: 60, height: 78, borderRadius: 9, backgroundColor: '#1b1629', borderWidth: 1.5, borderColor: 'rgba(255,255,255,.15)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <Layers size={20} color="#8e879f" />
                  <Text style={{ fontSize: 10, color: '#8e879f' }}>{o.drawPileCount}</Text>
                </View>
                <Text style={{ fontSize: 11, color: '#8e879f', fontWeight: '600' }}>{t('okeyDrawFromPileButton')}</Text>
              </Pressable>

              <Pressable onPress={drawOkeyFromDiscard} disabled={!o.discardTop} style={{ alignItems: 'center', gap: 6, opacity: o.discardTop ? 1 : 0.35 }}>
                {o.discardTop ? (
                  <TileView tile={o.discardTop} size="lg" isWild={isWildTile(o.discardTop, o.okeyOf)} />
                ) : (
                  <View style={{ width: 52, height: 68, borderRadius: 9, borderWidth: 1.5, borderColor: 'rgba(255,255,255,.12)', borderStyle: 'dashed' }} />
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <ArrowDownToLine size={12} color="#8e879f" />
                  <Text style={{ fontSize: 11, color: '#8e879f', fontWeight: '600' }}>{t('okeyDrawFromDiscardButton')}</Text>
                </View>
              </Pressable>
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ fontSize: 11, color: '#635c73' }}>{t('okeyArrangeHint')}</Text>
            </View>
          )}

          <View style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
            <TileRack>
              {o.hand.map((tile, i) => (
                <Pressable key={tile.id} onPress={() => tapTile(i)}>
                  <TileView tile={tile} size="md" selected={selectedIndex === i} isWild={isWildTile(tile, o.okeyOf)} />
                </Pressable>
              ))}
            </TileRack>
          </View>

          {o.phase === 'discard' ? (
            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', paddingTop: 4 }}>
              <Pressable onPress={autoSortOkeyHand} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 44, paddingHorizontal: 14, borderRadius: 14, backgroundColor: '#1b1629' }}>
                <Shuffle size={14} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12.5 }}>{t('okeySortButton')}</Text>
              </Pressable>
              {selectedIndex !== null ? (
                <Pressable onPress={discardSelected} style={{ height: 44, paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12.5 }}>{t('okeyDiscardSelectedButton')}</Text>
                </Pressable>
              ) : null}
              {o.canWinMelds ? (
                <Pressable onPress={declareOkeyWin}>
                  <GradientView angle={90} style={{ height: 44, paddingHorizontal: 18, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12.5 }}>{t('okeyDeclareWinButton')}</Text>
                  </GradientView>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 }}>
          <View style={{ alignItems: 'center', gap: 16 }}>
            <Text style={{ fontSize: 48 }}>{winner ? '🏆' : '🤝'}</Text>
            {winner ? (
              <>
                <Avatar person={winner} size={64} />
                <Text style={{ fontSize: 21, fontWeight: '800', color: '#fff', textAlign: 'center' }}>{t('okeyPlayerWon', { name: winner.name })}</Text>
                <Text style={{ fontSize: 13, color: '#8e879f' }}>{o.winType === 'pairs' ? t('okeyWonPairs') : t('okeyWonRunsGroups')}</Text>
              </>
            ) : (
              <Text style={{ fontSize: 21, fontWeight: '800', color: '#fff', textAlign: 'center' }}>{t('okeyNoTilesDraw')}</Text>
            )}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <Pressable onPress={closeOkeyGame} style={{ height: 50, paddingHorizontal: 18, borderRadius: 15, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{t('okeyCloseButton')}</Text>
              </Pressable>
              <Pressable onPress={restartOkeyGame}>
                <GradientView angle={90} style={{ height: 50, paddingHorizontal: 22, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{t('okeyPlayAgainButton')}</Text>
                </GradientView>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
