import { Plus, RotateCw, X } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { GradientView } from '@/components/ui/GradientView';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { UNO_COLOR_HEX, cardLabel, isPlayable, type UnoCard, type UnoColor } from '@/lib/uno-data';

function CardView({ card, size = 'md', dim = false, lifted = false }: { card: UnoCard; size?: 'md' | 'lg'; dim?: boolean; lifted?: boolean }) {
  const dims = size === 'lg' ? { w: 100, h: 140 } : { w: 74, h: 104 };
  const label = cardLabel(card);
  const cornerFont = size === 'lg' ? 15 : 12;
  const badgeW = dims.w * 0.72;
  const badgeH = dims.h * 0.5;
  const bigFont = size === 'lg' ? 34 : 26;

  return (
    <View
      style={{
        width: dims.w,
        height: dims.h,
        borderRadius: 14,
        overflow: 'hidden',
        opacity: dim ? 0.4 : 1,
        borderWidth: lifted ? 2.5 : 0,
        borderColor: '#c4b5fd',
        transform: lifted ? [{ translateY: -8 }] : undefined,
        shadowColor: '#000',
        shadowOpacity: lifted ? 0.4 : 0.22,
        shadowRadius: lifted ? 12 : 5,
        shadowOffset: { width: 0, height: lifted ? 7 : 3 },
        elevation: lifted ? 9 : 3,
      }}
    >
      {card.color === 'wild' ? (
        <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
          <View style={{ width: '50%', height: '50%', backgroundColor: UNO_COLOR_HEX.red }} />
          <View style={{ width: '50%', height: '50%', backgroundColor: UNO_COLOR_HEX.blue }} />
          <View style={{ width: '50%', height: '50%', backgroundColor: UNO_COLOR_HEX.yellow }} />
          <View style={{ width: '50%', height: '50%', backgroundColor: UNO_COLOR_HEX.green }} />
        </View>
      ) : (
        <View style={{ flex: 1, backgroundColor: UNO_COLOR_HEX[card.color] }} />
      )}

      <Text style={{ position: 'absolute', top: 6, left: 8, color: '#fff', fontWeight: '800', fontSize: cornerFont }}>{label}</Text>
      <Text
        style={{ position: 'absolute', bottom: 6, right: 8, color: '#fff', fontWeight: '800', fontSize: cornerFont, transform: [{ rotate: '180deg' }] }}
      >
        {label}
      </Text>

      <View
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: badgeW,
          height: badgeH,
          marginLeft: -badgeW / 2,
          marginTop: -badgeH / 2,
          backgroundColor: '#fff',
          borderRadius: badgeH / 2,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ rotate: '-20deg' }],
        }}
      >
        <Text
          style={{
            color: card.color === 'wild' ? '#141020' : UNO_COLOR_HEX[card.color],
            fontWeight: '900',
            fontSize: bigFont,
            transform: [{ rotate: '20deg' }],
          }}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

const COLOR_LABEL_KEY: Record<UnoColor, string> = {
  red: 'unoColorRed',
  yellow: 'unoColorYellow',
  green: 'unoColorGreen',
  blue: 'unoColorBlue',
};

const MAIN_SCREEN_PHASES = ['playing', 'color-picker', 'uno-declare', 'draw-four-challenge'];

export function SonKartOverlay() {
  const insets = useSafeAreaInsets();
  const {
    unoGame: u,
    closeUnoGame,
    playUnoCard,
    chooseUnoWildColor,
    drawUnoCard,
    endUnoTurnAfterDraw,
    declareUno,
    skipUnoDeclare,
    catchUnoForgetter,
    resolveDrawFourChallenge,
    startNextUnoRound,
    restartUnoGame,
  } = useApp();
  const { t } = useLanguage();

  if (!u) return null;

  const currentPlayer = u.players[u.currentPlayerIndex];
  const winner = u.players.find((p) => p.id === u.winnerId);
  const catchablePlayer = u.players.find((p) => p.id === u.catchableId);

  return (
    <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
      <Pressable
        onPress={closeUnoGame}
        style={{ position: 'absolute', top: insets.top + 10, left: 14, zIndex: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}
      >
        <X size={17} color="#fff" />
      </Pressable>
      <View style={{ position: 'absolute', top: insets.top + 10, right: 14, zIndex: 10, backgroundColor: '#1b1629', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 }}>
        <Text style={{ fontSize: 11, color: '#a78bfa', fontWeight: '700' }}>{t('unoRoundLabel', { round: u.roundNumber })}</Text>
      </View>

      {MAIN_SCREEN_PHASES.includes(u.phase) && u.topCard && u.activeColor ? (
        <View style={{ flex: 1, paddingBottom: insets.bottom + 16 }}>
          <View style={{ alignItems: 'center', paddingTop: 8, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#141020', borderWidth: 1, borderColor: 'rgba(139,92,246,.35)', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 }}>
              <Avatar person={currentPlayer} size={26} />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{t('unoTurnLabel', { name: currentPlayer?.name ?? '' })}</Text>
            </View>
            {catchablePlayer ? (
              <Pressable
                onPress={() => catchUnoForgetter(catchablePlayer.id)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(239,68,68,.16)', borderWidth: 1, borderColor: 'rgba(239,68,68,.4)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5 }}
              >
                <Text style={{ color: '#f87171', fontSize: 11.5, fontWeight: '700' }}>{t('unoCatchButton', { name: catchablePlayer.name })}</Text>
              </Pressable>
            ) : null}
            {u.lastMessage ? (
              <View style={{ backgroundColor: 'rgba(139,92,246,.16)', borderWidth: 1, borderColor: 'rgba(139,92,246,.35)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5 }}>
                <Text style={{ color: '#c4b5fd', fontSize: 11.5, fontWeight: '600' }}>{u.lastMessage}</Text>
              </View>
            ) : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingLeft: 20, paddingRight: 20, paddingTop: 12, paddingBottom: 6 }}
          >
            {u.players
              .filter((p) => p.id !== currentPlayer?.id)
              .map((p) => (
                <View key={p.id} style={{ alignItems: 'center', gap: 4 }}>
                  <Avatar person={p} size={34} />
                  <View style={{ backgroundColor: '#1b1629', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 10.5, color: '#d6d1e0', fontWeight: '600' }}>{t('unoHandCount', { count: u.handCounts[p.id] ?? 0 })}</Text>
                  </View>
                </View>
              ))}
          </ScrollView>

          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <RotateCw size={13} color="#635c73" style={{ transform: [{ scaleX: u.direction === -1 ? -1 : 1 }] }} />
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: UNO_COLOR_HEX[u.activeColor] }} />
              <Text style={{ fontSize: 11.5, color: '#8e879f', fontWeight: '600' }}>{t(COLOR_LABEL_KEY[u.activeColor])}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
              <Pressable onPress={drawUnoCard} disabled={u.hasDrawnThisTurn} style={{ opacity: u.hasDrawnThisTurn ? 0.4 : 1 }}>
                <View style={{ width: 66, height: 92, borderRadius: 12, backgroundColor: '#1b1629', borderWidth: 1.5, borderColor: 'rgba(255,255,255,.15)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <Plus size={18} color="#8e879f" />
                  <Text style={{ fontSize: 9.5, color: '#8e879f' }}>{u.drawPileCount}</Text>
                </View>
              </Pressable>

              <CardView card={u.topCard} size="lg" />
            </View>

            {u.hasDrawnThisTurn ? (
              <Pressable onPress={endUnoTurnAfterDraw}>
                <View style={{ height: 44, paddingHorizontal: 20, borderRadius: 14, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>{t('unoEndTurnButton')}</Text>
                </View>
              </Pressable>
            ) : null}
          </View>

          <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
            <Text style={{ fontSize: 11, color: '#635c73', textAlign: 'center' }}>{t('unoPlayCardHint')}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 20, paddingVertical: 14 }}>
            {u.hand.map((card) => {
              const playable = isPlayable(card, u.topCard!, u.activeColor!);
              return (
                <Pressable key={card.id} onPress={() => playable && playUnoCard(card.id)} disabled={!playable} hitSlop={4}>
                  <CardView card={card} size="md" dim={!playable} lifted={playable} />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {u.phase === 'color-picker' ? (
        <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(8,5,15,.9)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 }}>
          <View style={{ alignItems: 'center', gap: 20 }}>
            <Text style={{ fontSize: 19, fontWeight: '800', color: '#fff' }}>{t('unoColorPickerTitle')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center', maxWidth: 220 }}>
              {(Object.keys(UNO_COLOR_HEX) as UnoColor[]).map((color) => (
                <Pressable key={color} onPress={() => chooseUnoWildColor(color)}>
                  <View style={{ width: 88, height: 88, borderRadius: 20, backgroundColor: UNO_COLOR_HEX[color], alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{t(COLOR_LABEL_KEY[color])}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      ) : null}

      {u.phase === 'uno-declare' ? (
        <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(8,5,15,.9)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 }}>
          <View style={{ alignItems: 'center', gap: 20 }}>
            <Text style={{ fontSize: 44 }}>🎉</Text>
            <Text style={{ fontSize: 21, fontWeight: '800', color: '#fff', textAlign: 'center' }}>
              {t('unoOneCardLeftTitle', { name: currentPlayer?.name ?? '' })}
            </Text>
            <Text style={{ fontSize: 12.5, color: '#8e879f', textAlign: 'center', maxWidth: 260 }}>
              {t('unoDeclareInstructions')}
            </Text>
            <Pressable onPress={declareUno}>
              <GradientView angle={90} style={{ height: 58, paddingHorizontal: 34, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 17 }}>{t('unoDeclareButton')}</Text>
              </GradientView>
            </Pressable>
            <Pressable onPress={skipUnoDeclare}>
              <Text style={{ color: '#635c73', fontWeight: '600', fontSize: 12.5 }}>{t('unoSkipDeclareButton')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {u.phase === 'draw-four-challenge' ? (
        <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(8,5,15,.9)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 }}>
          <View style={{ alignItems: 'center', gap: 18 }}>
            <Text style={{ fontSize: 40 }}>🤨</Text>
            <Text style={{ fontSize: 19, fontWeight: '800', color: '#fff', textAlign: 'center' }}>
              {t('unoDrawFourTitle', { name: currentPlayer?.name ?? '' })}
            </Text>
            <Text style={{ fontSize: 12.5, color: '#8e879f', textAlign: 'center', maxWidth: 280 }}>
              {t('unoDrawFourInstructions', { name: u.drawFourVictimName ?? '' })}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable onPress={() => resolveDrawFourChallenge(false)} style={{ height: 50, paddingHorizontal: 18, borderRadius: 15, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{t('unoAcceptDrawFourButton')}</Text>
              </Pressable>
              <Pressable onPress={() => resolveDrawFourChallenge(true)}>
                <GradientView angle={90} style={{ height: 50, paddingHorizontal: 18, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{t('unoChallengeButton')}</Text>
                </GradientView>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      {u.phase === 'game-over' && winner ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 }}>
          <View style={{ alignItems: 'center', gap: 14, width: '100%' }}>
            <Text style={{ fontSize: 44 }}>🏆</Text>
            <Avatar person={winner} size={60} />
            <Text style={{ fontSize: 19, fontWeight: '800', color: '#fff', textAlign: 'center' }}>
              {t('unoWinnerTitle', { name: winner?.name ?? '' })}
            </Text>
            {u.lastRoundScore !== null ? (
              <Text style={{ fontSize: 13, color: '#4ade80', fontWeight: '700' }}>{t('unoScoreGained', { score: u.lastRoundScore })}</Text>
            ) : null}

            {u.lastRoundHandCounts ? (
              <View style={{ width: '100%', gap: 6, backgroundColor: '#141020', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(139,92,246,.25)', padding: 12 }}>
                {u.players.map((p) => (
                  <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Avatar person={p} size={22} />
                    <Text style={{ flex: 1, color: '#fff', fontWeight: '600', fontSize: 12.5 }}>{p.name}</Text>
                    <Text style={{ fontSize: 11, color: '#8e879f' }}>
                      {p.id === u.winnerId ? t('unoFinishedHand') : t('unoCardsLeft', { count: u.lastRoundHandCounts?.[p.id] ?? 0 })}
                    </Text>
                    <Text style={{ fontSize: 12.5, color: '#a78bfa', fontWeight: '800', minWidth: 40, textAlign: 'right' }}>
                      {t('unoTotalScore', { score: u.cumulativeScores[p.id] ?? 0 })}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Pressable onPress={closeUnoGame} style={{ height: 50, paddingHorizontal: 16, borderRadius: 15, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{t('unoCloseButton')}</Text>
              </Pressable>
              <Pressable onPress={restartUnoGame} style={{ height: 50, paddingHorizontal: 16, borderRadius: 15, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{t('unoRestartButton')}</Text>
              </Pressable>
              <Pressable onPress={startNextUnoRound}>
                <GradientView angle={90} style={{ height: 50, paddingHorizontal: 22, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{t('unoNextRoundButton')}</Text>
                </GradientView>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
