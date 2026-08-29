import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useExposeMeGame } from '@/hooks/useExposeMeGame';
import { questionText } from '@/lib/exposeMe/engine';
import type { ExposeMeCategoryFilter, ExposeMeIntensity, ExposeMeRoundCount, ExposeMeSettings, ExposeMeVoter } from '@/lib/exposeMe/types';
import { DEFAULT_EXPOSE_ME_SETTINGS } from '@/lib/exposeMe/types';

type Seat = { id: string; name: string; c1: string; c2: string };

const CATEGORY_OPTIONS: ExposeMeCategoryFilter[] = ['mixed', 'stalking', 'flirty', 'messages', 'funny', 'savage', 'confession', 'quick'];
const INTENSITY_OPTIONS: ExposeMeIntensity[] = ['soft', 'balanced', 'bold'];
const ROUND_OPTIONS: ExposeMeRoundCount[] = [5, 10, 20, 'endless'];

const CATEGORY_KEY: Record<ExposeMeCategoryFilter, string> = {
  mixed: 'emCatMixed',
  stalking: 'emCatStalking',
  flirty: 'emCatFlirty',
  messages: 'emCatMessages',
  funny: 'emCatFunny',
  savage: 'emCatSavage',
  confession: 'emCatConfession',
  quick: 'emCatQuick',
};
const INTENSITY_KEY: Record<ExposeMeIntensity, string> = {
  soft: 'emIntensitySoft',
  balanced: 'emIntensityBalanced',
  bold: 'emIntensityBold',
};

function CloseButton({ onPress, top }: { onPress: () => void; top: number }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ position: 'absolute', top, left: 14, zIndex: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}
    >
      <X size={17} color="#fff" />
    </Pressable>
  );
}

function GradientButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ opacity: disabled ? 0.5 : 1 }}>
      <LinearGradient colors={['#3b82f6', '#8b5cf6', '#ec4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 52, paddingHorizontal: 28, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? '#8b5cf6' : '#1b1629',
        borderWidth: 1,
        borderColor: active ? '#8b5cf6' : 'rgba(255,255,255,.08)',
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12.5 }}>{label}</Text>
    </Pressable>
  );
}

export function ExposeMeOverlay({ participants, onClose }: { participants: Seat[]; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { user } = useApp();
  const game = useExposeMeGame();
  const g = game.state;

  const [settings, setSettings] = useState<ExposeMeSettings>(DEFAULT_EXPOSE_ME_SETTINGS);
  const [revealed, setRevealed] = useState(false);

  const voters: ExposeMeVoter[] = useMemo(
    () => [{ id: 'me', name: user?.name || t('you'), c1: '#6366f1', c2: '#ec4899' }, ...participants],
    [participants, user?.name, t]
  );

  const round = g.round;
  const activePlayer = round ? g.voters.find((v) => v.id === round.activePlayerId) ?? voters.find((v) => v.id === round.activePlayerId) ?? null : null;

  useEffect(() => {
    setRevealed(false);
  }, [round?.question.id]);

  const startSession = () => game.startSession(voters, settings);

  if (g.phase === 'setup') {
    return (
      <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
        <CloseButton onPress={onClose} top={insets.top + 10} />
        <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingHorizontal: 22, paddingTop: 70, paddingBottom: 40, gap: 16 }}>
          <Text style={{ fontSize: 34 }}>🙈</Text>
          <Text style={{ fontSize: 21, fontWeight: '800', color: '#fff', textAlign: 'center' }}>{t('emSetupTitle')}</Text>
          <Text style={{ fontSize: 12.5, color: '#8e879f', textAlign: 'center' }}>{t('emSetupSubtitle')}</Text>

          <View style={{ width: '100%', gap: 8 }}>
            <Text style={{ fontSize: 11.5, color: '#8e879f', fontWeight: '700' }}>{t('emCategoryLabel')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORY_OPTIONS.map((c) => (
                <Chip key={c} label={t(CATEGORY_KEY[c])} active={settings.category === c} onPress={() => setSettings((s) => ({ ...s, category: c }))} />
              ))}
            </View>
          </View>

          <View style={{ width: '100%', gap: 8 }}>
            <Text style={{ fontSize: 11.5, color: '#8e879f', fontWeight: '700' }}>{t('emIntensityLabel')}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {INTENSITY_OPTIONS.map((i) => (
                <Chip key={i} label={t(INTENSITY_KEY[i])} active={settings.intensity === i} onPress={() => setSettings((s) => ({ ...s, intensity: i }))} />
              ))}
            </View>
          </View>

          <View style={{ width: '100%', gap: 8 }}>
            <Text style={{ fontSize: 11.5, color: '#8e879f', fontWeight: '700' }}>{t('emRoundsLabel')}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {ROUND_OPTIONS.map((rc) => (
                <Chip key={String(rc)} label={rc === 'endless' ? t('emRoundsEndless') : String(rc)} active={settings.roundCount === rc} onPress={() => setSettings((s) => ({ ...s, roundCount: rc }))} />
              ))}
            </View>
          </View>

          {voters.length < 2 ? <Text style={{ fontSize: 11.5, color: '#f87171', textAlign: 'center' }}>{t('emTwoPlayersNote')}</Text> : null}

          <GradientButton label={t('emStartButton')} onPress={startSession} disabled={voters.length < 2} />
        </ScrollView>
      </View>
    );
  }

  if (g.phase === 'summary') {
    return (
      <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
        <CloseButton onPress={onClose} top={insets.top + 10} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, gap: 14 }}>
          <Text style={{ fontSize: 44 }}>🎉</Text>
          <Text style={{ fontSize: 19, fontWeight: '800', color: '#fff', textAlign: 'center' }}>{t('emSummaryTitle')}</Text>
          <Text style={{ fontSize: 13, color: '#8e879f' }}>{t('emSummarySubtitle', { count: g.roundsPlayed })}</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
            <Pressable onPress={onClose} style={{ height: 50, paddingHorizontal: 18, borderRadius: 15, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>{t('emCloseButton')}</Text>
            </Pressable>
            <GradientButton label={t('emPlayAgainButton')} onPress={game.restart} />
          </View>
        </View>
      </View>
    );
  }

  if (!round) return null;

  if (!revealed) {
    return (
      <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
        <CloseButton onPress={onClose} top={insets.top + 10} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, gap: 14 }}>
          <Text style={{ fontSize: 12.5, color: '#8e879f' }}>{t('emYourTurnTitle')}</Text>
          {activePlayer ? <Avatar person={activePlayer} size={76} ring /> : null}
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' }}>{activePlayer ? t('emYourTurnLabel', { name: activePlayer.name }) : ''}</Text>
          <GradientButton label={t('emShowQuestionButton')} onPress={() => setRevealed(true)} />
        </View>
      </View>
    );
  }

  if (round.status === 'showing') {
    return (
      <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
        <CloseButton onPress={onClose} top={insets.top + 10} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, gap: 20 }}>
          {activePlayer ? <Avatar person={activePlayer} size={64} ring /> : null}
          <Text style={{ fontSize: 19, fontWeight: '800', color: '#fff', textAlign: 'center' }}>{questionText(round.question, language)}</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
            <Pressable onPress={game.skipQuestion} style={{ height: 52, paddingHorizontal: 22, borderRadius: 16, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#8e879f', fontWeight: '800', fontSize: 14 }}>{t('emSkipButton')}</Text>
            </Pressable>
            <Pressable
              onPress={game.markAnswered}
              style={{ height: 52, paddingHorizontal: 22, borderRadius: 16, backgroundColor: 'rgba(74,222,128,.15)', borderWidth: 1, borderColor: '#4ade80', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#4ade80', fontWeight: '800', fontSize: 14 }}>{t('emAnsweredButton')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // status === 'answered' | 'skipped'
  const isLast = g.settings.roundCount !== 'endless' && g.roundsPlayed + 1 >= g.settings.roundCount;
  return (
    <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
      <CloseButton onPress={onClose} top={insets.top + 10} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, gap: 14 }}>
        {activePlayer ? <Avatar person={activePlayer} size={64} ring /> : null}
        <Text style={{ fontSize: 18, fontWeight: '800', color: round.status === 'answered' ? '#4ade80' : '#8e879f' }}>
          {round.status === 'answered' ? t('emAnsweredButton') : t('emSkipButton')}
        </Text>
        <GradientButton label={isLast ? t('emFinishButton') : t('emNextButton')} onPress={game.nextRound} />
      </View>
    </View>
  );
}
