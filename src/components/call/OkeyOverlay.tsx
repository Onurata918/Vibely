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
import { MeldBoard, OkeyFelt, SideRack, SortButton, TopRack } from '@/components/okey/TableChrome';
import { splitRackRows, TileRack } from '@/components/okey/TileRack';

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
  const others = o.players.filter((p) => p.id !== 'me');
  const seatOf = (p: (typeof o.players)[number]) => ({
    name: p.name,
    c1: p.c1,
    c2: p.c2,
    tiles: o.handCounts[p.id] ?? 0,
    active: p.id === currentPlayer?.id,
  });

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
    <View className="absolute inset-0 z-[300]" style={{ paddingTop: insets.top }}>
      <OkeyFelt />
      <Pressable
        onPress={closeOkeyGame}
        style={{ position: 'absolute', top: insets.top + 8, left: 12, zIndex: 40, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(5,16,30,.85)', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' }}
      >
        <X size={17} color="#fff" />
      </Pressable>

      {o.phase !== 'game-over' ? (
        <View style={{ flex: 1 }}>
          {/* ---- Ust serit ---- */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 2, paddingBottom: 6, paddingHorizontal: 56 }}>
            <View style={{ alignItems: 'center', gap: 2 }}>
              <Text style={{ fontSize: 8.5, color: '#9fb6d4', fontWeight: '800' }}>{t('okeyIndicatorLabel')}</Text>
              {o.indicator ? <TileView tile={o.indicator} size="xs" /> : null}
            </View>
            <View style={{ alignItems: 'center', gap: 2 }}>
              <Text style={{ fontSize: 8.5, color: '#fbbf24', fontWeight: '800' }}>{t('okeyOkeyLabel')}</Text>
              {o.okeyOf ? <TileView tile={{ id: 'okey-of', kind: 'number', color: o.okeyOf.color, number: o.okeyOf.number }} size="xs" isWild /> : null}
            </View>
          </View>

          {/* ---- Masa ---- */}
          <View style={{ flex: 1, flexDirection: 'row', paddingHorizontal: 8, gap: 6 }}>
            {others[0] ? <SideRack seat={seatOf(others[0])} side="left" /> : null}

            <View style={{ flex: 1, gap: 6 }}>
              {others[1] ? <TopRack seat={seatOf(others[1])} /> : null}

              <MeldBoard>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 26 }}>
                    <Pressable onPress={drawOkeyFromPile} disabled={o.phase !== 'draw'} style={{ alignItems: 'center', gap: 5, opacity: o.phase === 'draw' ? 1 : 0.45 }}>
                      <View style={{ width: 50, height: 68, borderRadius: 7, backgroundColor: '#1d3250', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                        <Layers size={18} color="#cfe0f5" />
                        <Text style={{ fontSize: 10, color: '#cfe0f5', fontWeight: '800' }}>{o.drawPileCount}</Text>
                      </View>
                      <Text style={{ fontSize: 9, color: '#9fb6d4', fontWeight: '800' }}>{t('okeyDrawFromPileButton')}</Text>
                    </Pressable>

                    <Pressable onPress={drawOkeyFromDiscard} disabled={o.phase !== 'draw' || !o.discardTop} style={{ alignItems: 'center', gap: 5, opacity: o.phase === 'draw' && o.discardTop ? 1 : 0.45 }}>
                      {o.discardTop ? (
                        <TileView tile={o.discardTop} size="lg" isWild={isWildTile(o.discardTop, o.okeyOf)} />
                      ) : (
                        <View style={{ width: 50, height: 68, borderRadius: 7, borderWidth: 1.5, borderColor: 'rgba(255,255,255,.18)', borderStyle: 'dashed' }} />
                      )}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <ArrowDownToLine size={11} color="#9fb6d4" />
                        <Text style={{ fontSize: 9, color: '#9fb6d4', fontWeight: '800' }}>{t('okeyDrawFromDiscardButton')}</Text>
                      </View>
                    </Pressable>
                  </View>

                  <Text style={{ fontSize: 10.5, color: 'rgba(255,255,255,.45)', textAlign: 'center', paddingHorizontal: 16 }}>
                    {o.phase === 'draw' ? t('okeyTurnDraw', { name: currentPlayer?.name ?? '' }) : t('okeyArrangeHint')}
                  </Text>
                </View>
              </MeldBoard>
            </View>

            {others[2] ? <SideRack seat={seatOf(others[2])} side="right" /> : null}
          </View>

          {/* ---- Istaka ---- */}
          <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 6, paddingHorizontal: 8, paddingTop: 6, paddingBottom: 4 }}>
            <Pressable onPress={autoSortOkeyHand}>
              <SortButton label={'SIRA\nLA'} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <TileRack
                rows={splitRackRows(
                  o.hand.map((tile, i) => (
                    <Pressable key={tile.id} onPress={() => tapTile(i)}>
                      <TileView tile={tile} size="sm" selected={selectedIndex === i} isWild={isWildTile(tile, o.okeyOf)} />
                    </Pressable>
                  ))
                )}
              />
            </View>
            <Pressable onPress={autoSortOkeyHand}>
              <SortButton label={'RENK'} />
            </Pressable>
          </View>

          {/* ---- Aksiyonlar ---- */}
          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', paddingBottom: insets.bottom + 8, minHeight: 44 }}>
            {o.phase === 'discard' && selectedIndex !== null ? (
              <Pressable onPress={discardSelected} style={{ height: 38, paddingHorizontal: 18, borderRadius: 11, backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)' }}>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>{t('okeyDiscardSelectedButton')}</Text>
              </Pressable>
            ) : null}
            {o.phase === 'discard' && o.canWinMelds ? (
              <Pressable onPress={declareOkeyWin}>
                <GradientView angle={90} style={{ height: 38, paddingHorizontal: 20, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>{t('okeyDeclareWinButton')}</Text>
                </GradientView>
              </Pressable>
            ) : null}
          </View>
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
