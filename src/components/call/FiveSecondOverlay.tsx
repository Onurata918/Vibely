import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useFiveSecondGame } from '@/hooks/useFiveSecondGame';
import { challengeText, computeSessionStats } from '@/lib/fiveSecond/engine';
import type {
  FiveSecondCategoryFilter,
  FiveSecondDifficultyFilter,
  FiveSecondJudgeMode,
  FiveSecondReadyCountdown,
  FiveSecondRoundCount,
  FiveSecondSettings,
  FiveSecondVoter,
} from '@/lib/fiveSecond/types';
import { ANSWER_SECONDS, DEFAULT_FIVE_SECOND_SETTINGS } from '@/lib/fiveSecond/types';

type Seat = { id: string; name: string; c1: string; c2: string };

const DIFFICULTY_OPTIONS: FiveSecondDifficultyFilter[] = ['mixed', 'easy', 'medium', 'hard', 'chaos'];
const CATEGORY_OPTIONS: FiveSecondCategoryFilter[] = ['mixed', 'geography', 'sports', 'entertainment', 'music', 'food', 'tech', 'social'];
const ROUND_OPTIONS: FiveSecondRoundCount[] = [5, 10, 20, 'endless'];
const READY_OPTIONS: FiveSecondReadyCountdown[] = [3, 1, 0];

const DIFFICULTY_KEY: Record<FiveSecondDifficultyFilter, string> = {
  mixed: 'fscDiffMixed',
  easy: 'fscDiffEasy',
  medium: 'fscDiffMedium',
  hard: 'fscDiffHard',
  chaos: 'fscDiffChaos',
};
const CATEGORY_KEY: Record<FiveSecondCategoryFilter, string> = {
  mixed: 'fscCatMixed',
  geography: 'fscCatGeography',
  sports: 'fscCatSports',
  entertainment: 'fscCatEntertainment',
  music: 'fscCatMusic',
  food: 'fscCatFood',
  tech: 'fscCatTech',
  social: 'fscCatSocial',
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

function Toggle({ label, value, onPress }: { label: string; value: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 46, paddingHorizontal: 14, borderRadius: 13, backgroundColor: '#1b1629', borderWidth: 1, borderColor: 'rgba(255,255,255,.08)' }}
    >
      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>{label}</Text>
      <View style={{ width: 40, height: 24, borderRadius: 12, backgroundColor: value ? '#8b5cf6' : 'rgba(255,255,255,.14)', padding: 2, alignItems: value ? 'flex-end' : 'flex-start' }}>
        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' }} />
      </View>
    </Pressable>
  );
}

export function FiveSecondOverlay({ participants, onClose }: { participants: Seat[]; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { user } = useApp();
  const game = useFiveSecondGame();
  const g = game.state;

  const [settings, setSettings] = useState<FiveSecondSettings>(DEFAULT_FIVE_SECOND_SETTINGS);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [answerSecondsLeft, setAnswerSecondsLeft] = useState<number | null>(null);
  const [judgeRevealed, setJudgeRevealed] = useState(false);

  const voters: FiveSecondVoter[] = useMemo(
    () => [{ id: 'me', name: user?.name || t('you'), c1: '#6366f1', c2: '#ec4899' }, ...participants],
    [participants, user?.name, t]
  );

  const round = g.round;
  const activePlayer = round ? g.voters.find((v) => v.id === round.activePlayerId) ?? voters.find((v) => v.id === round.activePlayerId) ?? null : null;
  const currentJudgeId = round ? round.judgeOrder[round.judgeIndex] ?? null : null;
  const currentJudge = currentJudgeId ? g.voters.find((v) => v.id === currentJudgeId) ?? null : null;

  // Ready-phase local 3-2-1 countdown, then hand off to the engine.
  useEffect(() => {
    setCountdownValue(null);
  }, [round?.challenge.id]);

  useEffect(() => {
    if (countdownValue === null) return;
    if (countdownValue <= 0) {
      game.readyDone();
      return;
    }
    const id = setTimeout(() => setCountdownValue((v) => (v === null ? null : v - 1)), 1000);
    return () => clearTimeout(id);
  }, [countdownValue, game]);

  // Answering-phase 5 second timer, derived from synchronized start/end timestamps.
  useEffect(() => {
    if (!round || round.status !== 'answering' || !round.answerEndsAt) {
      setAnswerSecondsLeft(null);
      return;
    }
    const tick = () => setAnswerSecondsLeft(Math.max(0, Math.ceil((round.answerEndsAt! - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [round?.status, round?.answerEndsAt]);

  useEffect(() => {
    if (answerSecondsLeft === 0) game.answerTimeout();
  }, [answerSecondsLeft, game]);

  useEffect(() => {
    setJudgeRevealed(false);
  }, [round?.judgeIndex, round?.status]);

  const startSession = () => game.startSession(voters, settings);
  const startCountdown = () => (settings.readyCountdown === 0 ? game.readyDone() : setCountdownValue(settings.readyCountdown));

  if (g.phase === 'setup') {
    return (
      <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
        <CloseButton onPress={onClose} top={insets.top + 10} />
        <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingHorizontal: 22, paddingTop: 70, paddingBottom: 40, gap: 16 }}>
          <Text style={{ fontSize: 34 }}>⏱️</Text>
          <Text style={{ fontSize: 21, fontWeight: '800', color: '#fff', textAlign: 'center' }}>{t('fscSetupTitle')}</Text>
          <Text style={{ fontSize: 12.5, color: '#8e879f', textAlign: 'center' }}>{t('fscSetupSubtitle')}</Text>

          <View style={{ width: '100%', gap: 8 }}>
            <Text style={{ fontSize: 11.5, color: '#8e879f', fontWeight: '700' }}>{t('fscDifficultyLabel')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {DIFFICULTY_OPTIONS.map((d) => (
                <Chip key={d} label={t(DIFFICULTY_KEY[d])} active={settings.difficulty === d} onPress={() => setSettings((s) => ({ ...s, difficulty: d }))} />
              ))}
            </View>
          </View>

          <View style={{ width: '100%', gap: 8 }}>
            <Text style={{ fontSize: 11.5, color: '#8e879f', fontWeight: '700' }}>{t('fscCategoryLabel')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORY_OPTIONS.map((c) => (
                <Chip key={c} label={t(CATEGORY_KEY[c])} active={settings.category === c} onPress={() => setSettings((s) => ({ ...s, category: c }))} />
              ))}
            </View>
          </View>

          <View style={{ width: '100%', gap: 8 }}>
            <Text style={{ fontSize: 11.5, color: '#8e879f', fontWeight: '700' }}>{t('fscRoundsLabel')}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {ROUND_OPTIONS.map((rc) => (
                <Chip key={String(rc)} label={rc === 'endless' ? t('fscRoundsEndless') : String(rc)} active={settings.roundCount === rc} onPress={() => setSettings((s) => ({ ...s, roundCount: rc }))} />
              ))}
            </View>
          </View>

          <View style={{ width: '100%', gap: 8 }}>
            <Text style={{ fontSize: 11.5, color: '#8e879f', fontWeight: '700' }}>{t('fscJudgeModeLabel')}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['group', 'host'] as FiveSecondJudgeMode[]).map((m) => (
                <Chip
                  key={m}
                  label={m === 'group' ? t('fscJudgeModeGroup') : t('fscJudgeModeHost')}
                  active={settings.judgeMode === m}
                  onPress={() => setSettings((s) => ({ ...s, judgeMode: m }))}
                />
              ))}
            </View>
          </View>

          <View style={{ width: '100%', gap: 8 }}>
            <Text style={{ fontSize: 11.5, color: '#8e879f', fontWeight: '700' }}>{t('fscReadyCountdownLabel')}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {READY_OPTIONS.map((r) => (
                <Chip key={r} label={r === 0 ? t('fscReadyCountdownOff') : `${r}s`} active={settings.readyCountdown === r} onPress={() => setSettings((s) => ({ ...s, readyCountdown: r }))} />
              ))}
            </View>
          </View>

          <View style={{ width: '100%' }}>
            <Toggle label={t('fscScoringLabel')} value={settings.scoring} onPress={() => setSettings((s) => ({ ...s, scoring: !s.scoring }))} />
          </View>

          {voters.length < 2 ? <Text style={{ fontSize: 11.5, color: '#f87171', textAlign: 'center' }}>{t('fscTwoPlayersNote')}</Text> : null}

          <GradientButton label={t('fscStartButton')} onPress={startSession} disabled={voters.length < 2} />
        </ScrollView>
      </View>
    );
  }

  if (g.phase === 'summary') {
    const stats = computeSessionStats(g);
    return (
      <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
        <CloseButton onPress={onClose} top={insets.top + 10} />
        <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 60, gap: 14 }}>
          <Text style={{ fontSize: 44 }}>🎉</Text>
          <Text style={{ fontSize: 19, fontWeight: '800', color: '#fff', textAlign: 'center' }}>{t('fscSummaryTitle')}</Text>
          <Text style={{ fontSize: 13, color: '#8e879f' }}>{t('fscSummarySubtitle', { count: g.roundsPlayed })}</Text>

          {g.settings.scoring ? (
            <View style={{ width: '100%', gap: 6 }}>
              {[...stats]
                .sort((a, b) => b.successes - a.successes)
                .map((s) => (
                  <View key={s.voter.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#141020', borderRadius: 13, padding: 10 }}>
                    <Avatar person={s.voter} size={34} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13.5 }}>{s.voter.name}</Text>
                      <Text style={{ color: '#8e879f', fontSize: 11 }}>
                        {t('fscAttemptsLabel', { attempts: s.attempts })} · {t('fscSuccessRateLabel', { rate: s.successRate })}
                      </Text>
                    </View>
                    <Text style={{ color: '#a78bfa', fontWeight: '800', fontSize: 18 }}>{s.successes}</Text>
                  </View>
                ))}
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
            <Pressable onPress={onClose} style={{ height: 50, paddingHorizontal: 18, borderRadius: 15, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>{t('fscCloseButton')}</Text>
            </Pressable>
            <GradientButton label={t('fscPlayAgainButton')} onPress={game.restart} />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!round) return null;

  if (round.status === 'ready') {
    return (
      <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
        <CloseButton onPress={onClose} top={insets.top + 10} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, gap: 14 }}>
          {countdownValue === null ? (
            <>
              <Text style={{ fontSize: 12.5, color: '#8e879f' }}>{t('fscYourTurnTitle')}</Text>
              {activePlayer ? <Avatar person={activePlayer} size={76} ring /> : null}
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' }}>{activePlayer ? t('fscYourTurnLabel', { name: activePlayer.name }) : ''}</Text>
              <Text style={{ fontSize: 12.5, color: '#8e879f', textAlign: 'center' }}>{challengeText(round.challenge, language)}</Text>
              <GradientButton label={t('fscReadyButton')} onPress={startCountdown} />
            </>
          ) : (
            <Text style={{ fontSize: 72, fontWeight: '800', color: '#fff' }}>{countdownValue}</Text>
          )}
        </View>
      </View>
    );
  }

  if (round.status === 'answering') {
    return (
      <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
        <CloseButton onPress={onClose} top={insets.top + 10} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, gap: 16 }}>
          {activePlayer ? <Avatar person={activePlayer} size={64} ring /> : null}
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center' }}>{challengeText(round.challenge, language)}</Text>
          <Text style={{ fontSize: 12, color: '#8e879f' }}>{t('fscAnswerPrompt')}</Text>
          <Text style={{ fontSize: 80, fontWeight: '800', color: (answerSecondsLeft ?? ANSWER_SECONDS) <= 1 ? '#f87171' : '#fff' }}>{answerSecondsLeft ?? ANSWER_SECONDS}</Text>
        </View>
      </View>
    );
  }

  if (round.status === 'judging') {
    if (settings.judgeMode === 'host') {
      return (
        <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
          <CloseButton onPress={onClose} top={insets.top + 10} />
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, gap: 16 }}>
            {activePlayer ? <Avatar person={activePlayer} size={64} ring /> : null}
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center' }}>{t('fscHostJudgeTitle')}</Text>
            <Text style={{ fontSize: 12.5, color: '#8e879f', textAlign: 'center' }}>{challengeText(round.challenge, language)}</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <Pressable onPress={() => game.hostJudge(false)} style={{ height: 52, paddingHorizontal: 20, borderRadius: 16, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#f87171', fontWeight: '800', fontSize: 14 }}>{t('fscNotQuiteButton')}</Text>
              </Pressable>
              <Pressable onPress={() => game.hostJudge(true)} style={{ height: 52, paddingHorizontal: 20, borderRadius: 16, backgroundColor: 'rgba(74,222,128,.15)', borderWidth: 1, borderColor: '#4ade80', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#4ade80', fontWeight: '800', fontSize: 14 }}>{t('fscMadeItButton')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      );
    }

    // Group vote — pass the phone to each judge in turn.
    if (!judgeRevealed) {
      return (
        <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
          <CloseButton onPress={onClose} top={insets.top + 10} />
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, gap: 14 }}>
            <Text style={{ fontSize: 12.5, color: '#8e879f' }}>{t('fscPassToJudgeTitle')}</Text>
            {currentJudge ? <Avatar person={currentJudge} size={72} ring /> : null}
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' }}>{currentJudge?.name}</Text>
            <Text style={{ fontSize: 11.5, color: '#635c73' }}>{t('fscJudgedProgress', { judged: round.judgeIndex, total: round.judgeOrder.length })}</Text>
            <GradientButton label={t('fscJudgeReadyButton')} onPress={() => setJudgeRevealed(true)} />
          </View>
        </View>
      );
    }

    return (
      <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
        <CloseButton onPress={onClose} top={insets.top + 10} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, gap: 16 }}>
          {activePlayer ? <Avatar person={activePlayer} size={64} ring /> : null}
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center' }}>{t('fscHostJudgeTitle')}</Text>
          <Text style={{ fontSize: 12.5, color: '#8e879f', textAlign: 'center' }}>{challengeText(round.challenge, language)}</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <Pressable
              onPress={() => currentJudgeId && game.submitJudgement(currentJudgeId, false)}
              style={{ height: 52, paddingHorizontal: 20, borderRadius: 16, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#f87171', fontWeight: '800', fontSize: 14 }}>{t('fscNotQuiteButton')}</Text>
            </Pressable>
            <Pressable
              onPress={() => currentJudgeId && game.submitJudgement(currentJudgeId, true)}
              style={{ height: 52, paddingHorizontal: 20, borderRadius: 16, backgroundColor: 'rgba(74,222,128,.15)', borderWidth: 1, borderColor: '#4ade80', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#4ade80', fontWeight: '800', fontSize: 14 }}>{t('fscMadeItButton')}</Text>
            </Pressable>
          </View>
          <Text style={{ fontSize: 11.5, color: '#635c73' }}>{t('fscJudgedProgress', { judged: round.judgeIndex, total: round.judgeOrder.length })}</Text>
        </View>
      </View>
    );
  }

  // status === 'revealing'
  const isLast = g.settings.roundCount !== 'endless' && g.roundsPlayed + 1 >= g.settings.roundCount;
  return (
    <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
      <CloseButton onPress={onClose} top={insets.top + 10} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, gap: 14 }}>
        {activePlayer ? <Avatar person={activePlayer} size={76} ring /> : null}
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center' }}>{activePlayer?.name}</Text>
        <Text style={{ fontSize: 22, fontWeight: '800', color: round.result ? '#4ade80' : '#f87171' }}>{round.result ? t('fscResultSuccessLabel') : t('fscResultFailLabel')}</Text>
        {round.result && g.settings.scoring ? <Text style={{ fontSize: 13, color: '#a78bfa', fontWeight: '700' }}>{t('fscResultScoreLabel')}</Text> : null}
        <View style={{ marginTop: 10 }}>
          <GradientButton label={isLast ? t('fscFinishButton') : t('fscNextButton')} onPress={game.nextRound} />
        </View>
      </View>
    </View>
  );
}
