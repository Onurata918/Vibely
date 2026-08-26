import { Eye, EyeOff, X } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { GradientView } from '@/components/ui/GradientView';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

export function VampireGameOverlay() {
  const insets = useSafeAreaInsets();
  const {
    vampireGame: vk,
    closeVampireGame,
    toggleVkCard,
    nextVkPlayer,
    selectNightVictim,
    continueToVote,
    selectDayVote,
    continueToNight,
    restartVampireGame,
  } = useApp();
  const { t } = useLanguage();

  if (!vk) return null;

  const currentPlayer = vk.players[vk.revealIndex];
  const isVampireCard = currentPlayer?.role === 'vampire';
  const otherVampires = vk.players.filter((p) => p.role === 'vampire' && p.id !== currentPlayer?.id);
  const alivePlayers = vk.players.filter((p) => p.alive);
  const aliveVampires = alivePlayers.filter((p) => p.role === 'vampire').length;
  const aliveVillagers = alivePlayers.filter((p) => p.role === 'villager').length;
  const lastEliminated = vk.players.find((p) => p.id === vk.lastEliminatedId);

  return (
    <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
      <Pressable
        onPress={closeVampireGame}
        style={{ position: 'absolute', top: insets.top + 10, left: 14, zIndex: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}
      >
        <X size={17} color="#fff" />
      </Pressable>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26, paddingTop: 40 }}>
        {vk.phase === 'reveal' ? (
          <View style={{ width: '100%', alignItems: 'center', gap: 22 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#635c73', letterSpacing: 0.6 }}>
              {t('vampirePlayerCounter', { current: vk.revealIndex + 1, total: vk.players.length })}
            </Text>
            <Avatar person={currentPlayer} size={64} />
            <Text style={{ fontSize: 19, fontWeight: '800', color: '#fff' }}>{currentPlayer?.name}</Text>

            <Pressable onPress={toggleVkCard} style={{ width: '100%' }}>
              <GradientView
                angle={135}
                style={{ width: '100%', minHeight: 190, borderRadius: 24, alignItems: 'center', justifyContent: 'center', padding: 24 }}
              >
                {!vk.cardShown ? (
                  <>
                    <Eye size={30} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, marginTop: 12, textAlign: 'center' }}>
                      {t('vampireTapToReveal')}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                      {t('vampirePhoneHolderHint', { name: currentPlayer?.name ?? '' })}
                    </Text>
                  </>
                ) : isVampireCard ? (
                  <>
                    <Text style={{ fontSize: 40 }}>🧛</Text>
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18, marginTop: 8 }}>{t('vampireYouAreVampire')}</Text>
                    <Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 12.5, marginTop: 6, textAlign: 'center', lineHeight: 18 }}>
                      {t('vampireVampireInstructions')}
                    </Text>
                    {otherVampires.length ? (
                      <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5, marginTop: 10, textAlign: 'center' }}>
                        {t(otherVampires.length > 1 ? 'vampireOtherVampiresPlural' : 'vampireOtherVampireSingular', {
                          names: otherVampires.map((p) => p.name).join(', '),
                        })}
                      </Text>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Text style={{ fontSize: 40 }}>🧑‍🌾</Text>
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18, marginTop: 8 }}>{t('vampireYouAreVillager')}</Text>
                    <Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 12.5, marginTop: 6, textAlign: 'center' }}>
                      {t('vampireVillagerInstructions')}
                    </Text>
                  </>
                )}
              </GradientView>
            </Pressable>

            {vk.cardShown ? (
              <Pressable onPress={nextVkPlayer} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20 }}>
                <EyeOff size={15} color="#8e879f" />
                <Text style={{ color: '#8e879f', fontWeight: '600', fontSize: 13.5 }}>{t('vampireHideAndNext')}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {vk.phase === 'night' ? (
          <View style={{ width: '100%', gap: 14 }}>
            <View style={{ alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Text style={{ fontSize: 36 }}>🌙</Text>
              <Text style={{ fontSize: 21, fontWeight: '800', color: '#fff' }}>{t('vampireNightTitle')}</Text>
              <Text style={{ fontSize: 12.5, color: '#8e879f', textAlign: 'center', lineHeight: 18 }}>
                {t('vampireNightInstructions')}
              </Text>
            </View>
            <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: 9 }}>
              {alivePlayers.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => selectNightVictim(p.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#141020', borderWidth: 1, borderColor: 'rgba(255,255,255,.07)', borderRadius: 16, padding: 12 }}
                >
                  <Avatar person={p} size={40} />
                  <Text style={{ flex: 1, color: '#fff', fontWeight: '600', fontSize: 14.5 }}>{p.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {vk.phase === 'night-result' ? (
          <View style={{ width: '100%', alignItems: 'center', gap: 16 }}>
            <Text style={{ fontSize: 44 }}>💀</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' }}>
              {t('vampireKilledMessage', { name: lastEliminated?.name ?? '' })}
            </Text>
            <Text style={{ fontSize: 13, color: '#8e879f' }}>
              {t(lastEliminated?.role === 'vampire' ? 'vampireNightRevealVampire' : 'vampireNightRevealVillager')}
            </Text>
            <Text style={{ fontSize: 12.5, color: '#635c73' }}>
              {t('vampireRemainingCount', { villagers: aliveVillagers, vampires: aliveVampires })}
            </Text>
            <Pressable onPress={continueToVote} style={{ marginTop: 6 }}>
              <GradientView angle={90} style={{ height: 52, paddingHorizontal: 28, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{t('vampireGoToVoteButton')}</Text>
              </GradientView>
            </Pressable>
          </View>
        ) : null}

        {vk.phase === 'day-vote' ? (
          <View style={{ width: '100%', gap: 14 }}>
            <View style={{ alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Text style={{ fontSize: 36 }}>☀️</Text>
              <Text style={{ fontSize: 21, fontWeight: '800', color: '#fff' }}>{t('vampireDayVoteTitle')}</Text>
              <Text style={{ fontSize: 12.5, color: '#8e879f', textAlign: 'center' }}>{t('vampireDayVoteSubtitle')}</Text>
            </View>
            <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: 9 }}>
              {alivePlayers.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => selectDayVote(p.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#141020', borderWidth: 1, borderColor: 'rgba(255,255,255,.07)', borderRadius: 16, padding: 12 }}
                >
                  <Avatar person={p} size={40} />
                  <Text style={{ flex: 1, color: '#fff', fontWeight: '600', fontSize: 14.5 }}>{p.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {vk.phase === 'day-result' ? (
          <View style={{ width: '100%', alignItems: 'center', gap: 16 }}>
            <Text style={{ fontSize: 44 }}>⚖️</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' }}>
              {t('vampireHangedMessage', { name: lastEliminated?.name ?? '' })}
            </Text>
            <Text style={{ fontSize: 13, color: '#8e879f' }}>
              {t(lastEliminated?.role === 'vampire' ? 'vampireDayRevealVampire' : 'vampireDayRevealVillager')}
            </Text>
            <Text style={{ fontSize: 12.5, color: '#635c73' }}>
              {t('vampireRemainingCount', { villagers: aliveVillagers, vampires: aliveVampires })}
            </Text>
            <Pressable onPress={continueToNight} style={{ marginTop: 6 }}>
              <GradientView angle={90} style={{ height: 52, paddingHorizontal: 28, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{t('vampireGoToNightButton')}</Text>
              </GradientView>
            </Pressable>
          </View>
        ) : null}

        {vk.phase === 'end' ? (
          <View style={{ width: '100%', alignItems: 'center', gap: 16 }}>
            <Text style={{ fontSize: 44 }}>{vk.winner === 'villagers' ? '🎉' : '🧛'}</Text>
            <Text style={{ fontSize: 21, fontWeight: '800', color: '#fff', textAlign: 'center' }}>
              {t(vk.winner === 'villagers' ? 'vampireVillagersWin' : 'vampireVampiresWin')}
            </Text>
            <ScrollView style={{ width: '100%', maxHeight: 260 }} contentContainerStyle={{ gap: 8 }}>
              {vk.players.map((p) => (
                <View
                  key={p.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    backgroundColor: '#141020',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,.07)',
                    borderRadius: 14,
                    padding: 10,
                    opacity: p.alive ? 1 : 0.55,
                  }}
                >
                  <Avatar person={p} size={34} />
                  <Text style={{ flex: 1, color: '#fff', fontWeight: '600', fontSize: 13.5 }}>{p.name}</Text>
                  <Text style={{ fontSize: 12, color: p.role === 'vampire' ? '#f87171' : '#8e879f' }}>
                    {t(p.role === 'vampire' ? 'vampireRoleVampireBadge' : 'vampireRoleVillagerBadge')}
                    {!p.alive ? t('vampireEliminatedSuffix') : ''}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
              <Pressable onPress={closeVampireGame} style={{ height: 50, paddingHorizontal: 18, borderRadius: 15, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{t('vampireCloseButton')}</Text>
              </Pressable>
              <Pressable onPress={restartVampireGame}>
                <GradientView angle={90} style={{ height: 50, paddingHorizontal: 22, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{t('vampirePlayAgainButton')}</Text>
                </GradientView>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}
