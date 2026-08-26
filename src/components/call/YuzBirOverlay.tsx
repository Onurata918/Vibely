import { LinearGradient } from 'expo-linear-gradient';
import { ArrowDownToLine, Layers, Shuffle, X } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { GradientView } from '@/components/ui/GradientView';
import { useApp, type YuzBirMeld } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { canAddTileToMeld, isWildTile, type OkeyColor, type OkeyTile } from '@/lib/okey/engine';
import { TileView } from '@/components/okey/TileView';
import { TileRack } from '@/components/okey/TileRack';

function MeldRow({
  meld,
  okeyOf,
  highlighted,
  dim,
  onPress,
}: {
  meld: YuzBirMeld;
  okeyOf: { color: OkeyColor; number: number } | null;
  highlighted?: boolean;
  dim?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={{
        flexDirection: 'row',
        gap: 3,
        padding: 5,
        borderRadius: 10,
        backgroundColor: highlighted ? 'rgba(74,222,128,.16)' : 'rgba(255,255,255,.04)',
        borderWidth: 1.5,
        borderColor: highlighted ? '#4ade80' : 'rgba(255,255,255,.08)',
        opacity: dim ? 0.4 : 1,
      }}
    >
      {meld.tiles.map((tile, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <TileView key={`${meld.id}-${i}`} tile={tile} size="sm" isWild={isWildTile(tile, okeyOf)} />
      ))}
    </Pressable>
  );
}

export function YuzBirOverlay() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const {
    yuzbirGame: y,
    closeYuzBirGame,
    drawYuzBirFromPile,
    drawYuzBirFromDiscard,
    autoSortYuzBirHand,
    toggleYuzBirHandSelect,
    formYuzBirMeldFromSelection,
    commitYuzBirOpening,
    cancelYuzBirPendingMelds,
    addYuzBirSelectedTileToMeld,
    discardYuzBirTile,
    startNextYuzBirRound,
    restartYuzBirGame,
  } = useApp();

  if (!y) return null;

  const currentPlayer = y.players[y.currentPlayerIndex];
  const winner = y.players.find((p) => p.id === y.winnerId);
  const alreadyOpened = currentPlayer ? !!y.hasOpened[currentPlayer.id] : false;
  const singleSelectedTile: OkeyTile | null =
    y.selectedHandIds.length === 1 ? (y.hand.find((t) => t.id === y.selectedHandIds[0]) ?? null) : null;
  const anyMeldAddable =
    y.canAddToMeld && singleSelectedTile ? y.tableMelds.some((m) => canAddTileToMeld(m.tiles, singleSelectedTile, y.okeyOf).ok) : false;

  const discardSelected = () => {
    if (y.selectedHandIds.length !== 1) return;
    discardYuzBirTile(y.selectedHandIds[0]);
  };

  return (
    <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
      <Pressable
        onPress={closeYuzBirGame}
        style={{ position: 'absolute', top: insets.top + 10, left: 14, zIndex: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}
      >
        <X size={17} color="#fff" />
      </Pressable>

      <View style={{ position: 'absolute', top: insets.top + 10, right: 14, zIndex: 10, backgroundColor: '#1b1629', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 }}>
        <Text style={{ fontSize: 11, color: '#a78bfa', fontWeight: '700' }}>{t('ybRoundLabel', { n: y.roundNumber })}</Text>
      </View>

      {y.phase !== 'game-over' ? (
        <View style={{ flex: 1, paddingBottom: insets.bottom + 10 }}>
          <View style={{ alignItems: 'center', paddingTop: 8, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#141020', borderWidth: 1, borderColor: 'rgba(139,92,246,.35)', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 }}>
              <Avatar person={currentPlayer} size={24} />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12.5 }}>
                {t(y.phase === 'draw' ? 'ybTurnDraw' : 'ybTurnDiscard', { name: currentPlayer?.name ?? '' })}
              </Text>
              {alreadyOpened ? (
                <View style={{ backgroundColor: 'rgba(74,222,128,.18)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 9, color: '#4ade80', fontWeight: '800' }}>{t('ybOpenedBadge')}</Text>
                </View>
              ) : null}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 20 }}>
              {y.players
                .filter((p) => p.id !== currentPlayer?.id)
                .map((p) => (
                  <View key={p.id} style={{ alignItems: 'center', gap: 2 }}>
                    <Avatar person={p} size={26} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <View style={{ backgroundColor: '#1b1629', borderRadius: 9, paddingHorizontal: 6, paddingVertical: 1 }}>
                        <Text style={{ fontSize: 9, color: '#d6d1e0', fontWeight: '600' }}>{t('ybTileCount', { count: y.handCounts[p.id] ?? 0 })}</Text>
                      </View>
                      {y.hasOpened[p.id] ? <Text style={{ fontSize: 9 }}>🔓</Text> : null}
                    </View>
                    <Text style={{ fontSize: 9, color: (y.cumulativeScores[p.id] ?? 0) <= 0 ? '#4ade80' : '#f87171', fontWeight: '700' }}>
                      {`${y.cumulativeScores[p.id] ?? 0} p`}
                    </Text>
                  </View>
                ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 20 }}>
              <View style={{ alignItems: 'center', gap: 3 }}>
                <Text style={{ fontSize: 9, color: '#635c73', fontWeight: '700' }}>{t('ybIndicatorLabel')}</Text>
                {y.indicator ? <TileView tile={y.indicator} size="sm" /> : null}
              </View>
              <View style={{ alignItems: 'center', gap: 3 }}>
                <Text style={{ fontSize: 9, color: '#eab308', fontWeight: '700' }}>{t('ybOkeyLabel')}</Text>
                {y.okeyOf ? <TileView tile={{ id: 'okey-of', kind: 'number', color: y.okeyOf.color, number: y.okeyOf.number }} size="sm" isWild /> : null}
              </View>
              <View style={{ alignItems: 'center', gap: 3 }}>
                <Text style={{ fontSize: 9, color: '#635c73', fontWeight: '700' }}>{t('ybYourScoreLabel')}</Text>
                <Text style={{ fontSize: 14, color: (y.cumulativeScores.me ?? 0) <= 0 ? '#4ade80' : '#f87171', fontWeight: '800' }}>
                  {y.cumulativeScores.me ?? 0}
                </Text>
              </View>
            </View>
          </View>

          {/* Masa: su ana kadar acilmis tum seri/gruplar (yogunlastikca kendi icinde kayar) */}
          <LinearGradient
            colors={['#146e46', '#0d5234', '#0a3f28']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ marginTop: 8, marginHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,.08)', overflow: 'hidden' }}
          >
            <ScrollView
              style={{ maxHeight: 210, flexGrow: 0, flexShrink: 0 }}
              contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12, paddingVertical: 10, alignContent: 'flex-start' }}
            >
              {y.tableMelds.length === 0 ? (
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', paddingVertical: 10, width: '100%', textAlign: 'center' }}>{t('ybNoTilesOnTable')}</Text>
              ) : (
                y.tableMelds.map((meld) => {
                  const canAdd = !!(y.phase === 'discard' && y.canAddToMeld && singleSelectedTile && canAddTileToMeld(meld.tiles, singleSelectedTile, y.okeyOf).ok);
                  return (
                    <MeldRow
                      key={meld.id}
                      meld={meld}
                      okeyOf={y.okeyOf}
                      highlighted={canAdd}
                      onPress={y.canAddToMeld ? () => addYuzBirSelectedTileToMeld(meld.id) : undefined}
                    />
                  );
                })
              )}
            </ScrollView>
          </LinearGradient>

          {/* Bekleyen acilis: >=101 olana kadar masaya kesin konmaz */}
          {y.pendingMelds.length > 0 ? (
            <View style={{ marginHorizontal: 12, marginBottom: 6, padding: 8, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(234,179,8,.5)', borderStyle: 'dashed', backgroundColor: 'rgba(234,179,8,.06)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 10.5, color: '#eab308', fontWeight: '800' }}>{t('ybPendingOpening', { value: y.pendingValue })}</Text>
                <Pressable onPress={cancelYuzBirPendingMelds}>
                  <Text style={{ fontSize: 10.5, color: '#f87171', fontWeight: '700' }}>{t('ybUndoButton')}</Text>
                </Pressable>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {y.pendingMelds.map((meld) => (
                  <MeldRow key={meld.id} meld={meld} okeyOf={y.okeyOf} />
                ))}
              </View>
              {y.canCommitOpening ? (
                <Pressable onPress={commitYuzBirOpening} style={{ marginTop: 8 }}>
                  <GradientView angle={90} style={{ height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12.5 }}>{t('ybOpenButton', { value: y.pendingValue })}</Text>
                  </GradientView>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {y.phase === 'draw' ? (
            <View style={{ paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 26 }}>
              <Pressable onPress={drawYuzBirFromPile} style={{ alignItems: 'center', gap: 6 }}>
                <View style={{ width: 52, height: 68, borderRadius: 9, backgroundColor: '#1b1629', borderWidth: 1.5, borderColor: 'rgba(255,255,255,.15)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <Layers size={18} color="#8e879f" />
                  <Text style={{ fontSize: 10, color: '#8e879f' }}>{y.drawPileCount}</Text>
                </View>
                <Text style={{ fontSize: 11, color: '#8e879f', fontWeight: '600' }}>{t('ybDrawFromPileButton')}</Text>
              </Pressable>

              <Pressable onPress={drawYuzBirFromDiscard} disabled={!y.discardTop} style={{ alignItems: 'center', gap: 6, opacity: y.discardTop ? 1 : 0.35 }}>
                {y.discardTop ? (
                  <TileView tile={y.discardTop} size="md" isWild={isWildTile(y.discardTop, y.okeyOf)} />
                ) : (
                  <View style={{ width: 42, height: 56, borderRadius: 9, borderWidth: 1.5, borderColor: 'rgba(255,255,255,.12)', borderStyle: 'dashed' }} />
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <ArrowDownToLine size={12} color="#8e879f" />
                  <Text style={{ fontSize: 11, color: '#8e879f', fontWeight: '600' }}>{t('ybDrawFromDiscardButton')}</Text>
                </View>
              </Pressable>
            </View>
          ) : null}

          <View style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
            <TileRack>
              {y.hand.map((tile) => (
                <Pressable key={tile.id} onPress={() => toggleYuzBirHandSelect(tile.id)}>
                  <TileView tile={tile} size="sm" selected={y.selectedHandIds.includes(tile.id)} isWild={isWildTile(tile, y.okeyOf)} />
                </Pressable>
              ))}
            </TileRack>
          </View>

          {y.phase === 'discard' ? (
            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', paddingTop: 4, flexWrap: 'wrap' }}>
              <Pressable onPress={autoSortYuzBirHand} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 42, paddingHorizontal: 12, borderRadius: 13, backgroundColor: '#1b1629' }}>
                <Shuffle size={14} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>{t('ybSortButton')}</Text>
              </Pressable>
              {y.selectedHandIds.length >= 3 ? (
                <Pressable
                  onPress={formYuzBirMeldFromSelection}
                  disabled={!y.canFormMeld}
                  style={{ height: 42, paddingHorizontal: 14, borderRadius: 13, backgroundColor: y.canFormMeld ? '#4ade80' : '#2a2438', alignItems: 'center', justifyContent: 'center', opacity: y.canFormMeld ? 1 : 0.6 }}
                >
                  <Text style={{ color: y.canFormMeld ? '#0b0714' : '#8e879f', fontWeight: '700', fontSize: 12 }}>
                    {y.canFormMeld ? t('ybFormMeldButton') : t('ybNotAMeldLabel')}
                  </Text>
                </Pressable>
              ) : null}
              {y.selectedHandIds.length === 1 && y.canDiscard ? (
                <Pressable onPress={discardSelected} style={{ height: 42, paddingHorizontal: 14, borderRadius: 13, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{t('ybDiscardSelectedButton')}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
          {y.selectedHandIds.length === 1 && y.canAddToMeld ? (
            <Text style={{ fontSize: 10.5, color: anyMeldAddable ? '#4ade80' : '#635c73', textAlign: 'center', paddingTop: 4 }}>
              {anyMeldAddable ? t('ybMeldHintAddable') : t('ybMeldHintNotAddable')}
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 }}>
          <View style={{ alignItems: 'center', gap: 14, width: '100%' }}>
            <Text style={{ fontSize: 44 }}>{winner ? '🏆' : '🤝'}</Text>
            <Text style={{ fontSize: 19, fontWeight: '800', color: '#fff', textAlign: 'center' }}>
              {winner ? t('ybPlayerWon', { name: winner.name }) : t('ybNoTilesDraw')}
            </Text>

            {y.lastRoundResults ? (
              <View style={{ width: '100%', gap: 6, backgroundColor: '#141020', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(139,92,246,.25)', padding: 12 }}>
                {y.players.map((p) => {
                  const r = y.lastRoundResults?.[p.id];
                  if (!r) return null;
                  return (
                    <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Avatar person={p} size={24} />
                      <Text style={{ flex: 1, color: '#fff', fontWeight: '600', fontSize: 12.5 }}>{p.name}</Text>
                      <Text style={{ fontSize: 10.5, color: r.opened ? '#8e879f' : '#f87171', fontWeight: '600' }}>
                        {p.id === y.winnerId ? t('ybResultWon') : r.opened ? t('ybResultOpened') : t('ybResultNotOpened')}
                      </Text>
                      <Text style={{ fontSize: 12.5, color: r.scoreDelta <= 0 ? '#4ade80' : '#f87171', fontWeight: '800', minWidth: 34, textAlign: 'right' }}>
                        {r.scoreDelta > 0 ? `+${r.scoreDelta}` : r.scoreDelta}
                      </Text>
                      <Text style={{ fontSize: 10.5, color: '#635c73', minWidth: 44, textAlign: 'right' }}>
                        {t('ybTotalScoreSuffix', { score: y.cumulativeScores[p.id] ?? 0 })}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Pressable onPress={closeYuzBirGame} style={{ height: 50, paddingHorizontal: 16, borderRadius: 15, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{t('ybCloseButton')}</Text>
              </Pressable>
              <Pressable onPress={restartYuzBirGame} style={{ height: 50, paddingHorizontal: 16, borderRadius: 15, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{t('ybStartOverButton')}</Text>
              </Pressable>
              <Pressable onPress={startNextYuzBirRound}>
                <GradientView angle={90} style={{ height: 50, paddingHorizontal: 22, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{t('ybNewRoundButton')}</Text>
                </GradientView>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
