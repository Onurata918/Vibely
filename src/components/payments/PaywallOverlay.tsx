import { Check, Coins, PlayCircle, Sparkles, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePayments } from '@/context/PaymentsContext';
import { formatPrice, JETON_PACKAGES, packagePrice, PREMIUM_PLANS, planPrice, type PaymentsRegion, type PremiumPlanId } from '@/lib/payments/plans';
import { AD_EXTEND_SECONDS, AD_REWARD_JETONS, JETON_EXTEND_COST, JETON_EXTEND_SECONDS } from '@/lib/payments/types';

const PLAN_LABEL_KEY: Record<PremiumPlanId, string> = {
  monthly: 'payPlanMonthly',
  quarterly: 'payPlanQuarterly',
  semiannual: 'payPlanSemiannual',
};

export function PaywallOverlay({
  reason = 'manual',
  focus = 'premium',
  onClose,
}: {
  reason?: 'limit' | 'manual';
  focus?: 'premium' | 'jetons';
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { toast } = useApp();
  const payments = usePayments();
  const region: PaymentsRegion = language === 'tr' ? 'TR' : 'UK';

  const [watchingAd, setWatchingAd] = useState<'jetons' | 'time' | null>(null);
  const [buyingPlan, setBuyingPlan] = useState<PremiumPlanId | null>(null);

  const fmt = (n: number) => formatPrice(n, region);

  const runFakeAd = (kind: 'jetons' | 'time') => {
    setWatchingAd(kind);
    setTimeout(() => {
      setWatchingAd(null);
      if (kind === 'jetons') {
        payments.watchAdForJetons();
        toast(t('payAdRewardToast', { count: AD_REWARD_JETONS }));
      } else {
        payments.watchAdForTimeExtension();
        toast(t('payTimeExtendedToast', { minutes: AD_EXTEND_SECONDS / 60 }));
      }
    }, 1800);
  };

  const spendJetons = () => {
    payments.spendJetonsForTime();
    toast(t('payTimeExtendedToast', { minutes: JETON_EXTEND_SECONDS / 60 }));
  };

  const buyPremium = (planId: PremiumPlanId) => {
    setBuyingPlan(planId);
    setTimeout(() => {
      setBuyingPlan(null);
      payments.buyPremium(planId);
      toast(t('payPremiumSuccessToast'));
    }, 1200);
  };

  const buyJetons = (packageId: string) => {
    payments.buyJetonPackage(packageId);
    toast(t('payPurchaseSuccessToast'));
  };

  const premiumSection = (
    <View key="premium" style={{ gap: 14 }}>
      {reason === 'manual' && focus === 'premium' ? (
        <View style={{ alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(139,92,246,.15)', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={26} color="#a78bfa" />
          </View>
          <Text style={{ fontSize: 21, fontWeight: '800', color: '#fff' }}>{t('payGoPremium')}</Text>
        </View>
      ) : (
        <Text style={{ fontSize: 12, color: '#8e879f', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('payGoPremium')}</Text>
      )}

      {payments.payments.isPremium ? (
        <View style={{ backgroundColor: 'rgba(74,222,128,.12)', borderWidth: 1, borderColor: 'rgba(74,222,128,.4)', borderRadius: 14, padding: 14, alignItems: 'center' }}>
          <Text style={{ color: '#4ade80', fontWeight: '800', fontSize: 14 }}>✓ {t('payPremiumActiveLabel')}</Text>
          <Pressable onPress={() => { payments.cancelPremium(); toast(t('payPremiumCancelledToast')); }} style={{ marginTop: 10 }}>
            <Text style={{ color: '#f87171', fontWeight: '700', fontSize: 12.5, textDecorationLine: 'underline' }}>{t('payCancelPremium')}</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={{ backgroundColor: '#141020', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,.07)', padding: 14, gap: 10 }}>
            <Text style={{ fontSize: 11.5, color: '#8e879f', fontWeight: '700' }}>{t('payPremiumBenefitsTitle')}</Text>
            {(['payBenefitUnlimitedCalls', 'payBenefitUnlimitedRooms', 'payBenefitUnlimitedGames', 'payBenefitNoAds'] as const).map((key) => (
              <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                <Check size={15} color="#4ade80" />
                <Text style={{ color: '#fff', fontSize: 13, flex: 1 }}>{t(key)}</Text>
              </View>
            ))}
          </View>

          <View style={{ gap: 10 }}>
            {PREMIUM_PLANS.map((plan) => {
              const { price, original } = planPrice(plan, region);
              const isBest = plan.id === 'semiannual';
              return (
                <Pressable
                  key={plan.id}
                  onPress={() => buyPremium(plan.id)}
                  disabled={buyingPlan !== null}
                  style={{
                    borderRadius: 16,
                    padding: 14,
                    backgroundColor: isBest ? 'rgba(139,92,246,.12)' : '#141020',
                    borderWidth: 1.5,
                    borderColor: isBest ? '#8b5cf6' : 'rgba(255,255,255,.08)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14.5 }}>{t(PLAN_LABEL_KEY[plan.id])}</Text>
                      {isBest ? (
                        <View style={{ backgroundColor: '#8b5cf6', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                          <Text style={{ color: '#fff', fontSize: 9.5, fontWeight: '800' }}>{t('payMostPopular')}</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7, marginTop: 4 }}>
                      {original ? <Text style={{ color: '#635c73', fontSize: 12.5, textDecorationLine: 'line-through' }}>{fmt(original)}</Text> : null}
                      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 17 }}>{fmt(price)}</Text>
                      <Text style={{ color: '#8e879f', fontSize: 11 }}>{t('payPerMonthShort')}</Text>
                    </View>
                  </View>
                  {buyingPlan === plan.id ? (
                    <ActivityIndicator size="small" color="#a78bfa" />
                  ) : (
                    <View style={{ height: 34, paddingHorizontal: 14, borderRadius: 10, backgroundColor: isBest ? '#8b5cf6' : 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{t('paySubscribeButton', { plan: t(PLAN_LABEL_KEY[plan.id]) })}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </View>
  );

  const jetonSection = (
    <View key="jetons" style={{ gap: 10 }}>
      {focus === 'jetons' ? (
        <View style={{ alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(250,204,21,.15)', alignItems: 'center', justifyContent: 'center' }}>
            <Coins size={26} color="#facc15" />
          </View>
          <Text style={{ fontSize: 21, fontWeight: '800', color: '#fff' }}>{t('payJetonPackagesTitle')}</Text>
        </View>
      ) : (
        <Text style={{ fontSize: 12, color: '#8e879f', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('payJetonPackagesTitle')}</Text>
      )}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {JETON_PACKAGES.map((pkg) => (
          <Pressable key={pkg.id} onPress={() => buyJetons(pkg.id)} style={{ flex: 1, backgroundColor: '#141020', borderWidth: 1, borderColor: 'rgba(255,255,255,.08)', borderRadius: 16, padding: 12, alignItems: 'center', gap: 6 }}>
            <Coins size={18} color="#facc15" />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14.5 }}>{pkg.jetons}</Text>
            <Text style={{ color: '#a78bfa', fontWeight: '700', fontSize: 12.5 }}>{fmt(packagePrice(pkg, region))}</Text>
            <View style={{ marginTop: 2, height: 26, paddingHorizontal: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 10.5 }}>{t('payBuyButton')}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => runFakeAd('jetons')}
        disabled={watchingAd !== null}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 14, backgroundColor: '#1b1629', borderWidth: 1, borderColor: 'rgba(255,255,255,.08)', marginTop: 2 }}
      >
        {watchingAd === 'jetons' ? <ActivityIndicator size="small" color="#3b82f6" /> : <PlayCircle size={16} color="#3b82f6" />}
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{t('payWatchAdEarnJetons', { count: AD_REWARD_JETONS })}</Text>
      </Pressable>
    </View>
  );

  return (
    <View className="absolute inset-0 bg-vbg z-[400]" style={{ paddingTop: insets.top }}>
      <Pressable
        onPress={onClose}
        style={{ position: 'absolute', top: insets.top + 10, left: 14, zIndex: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}
      >
        <X size={17} color="#fff" />
      </Pressable>

      <View
        style={{ position: 'absolute', top: insets.top + 10, right: 14, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1b1629', borderWidth: 1, borderColor: 'rgba(255,255,255,.08)', borderRadius: 999, paddingHorizontal: 12, height: 38 }}
      >
        <Coins size={14} color="#facc15" />
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12.5 }}>{t('payJetonBalance', { count: payments.payments.jetonBalance })}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 70, paddingBottom: 50, gap: 22 }}>
        {reason === 'limit' ? (
          <View style={{ gap: 14 }}>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 34 }}>⏳</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' }}>{t('payLimitReachedTitle')}</Text>
              <Text style={{ fontSize: 12.5, color: '#8e879f', textAlign: 'center' }}>{t('payLimitReachedSubtitle')}</Text>
            </View>

            <Pressable
              onPress={spendJetons}
              disabled={payments.payments.jetonBalance < JETON_EXTEND_COST}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: '#141020',
                borderWidth: 1,
                borderColor: 'rgba(250,204,21,.35)',
                borderRadius: 16,
                padding: 14,
                opacity: payments.payments.jetonBalance < JETON_EXTEND_COST ? 0.5 : 1,
              }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(250,204,21,.15)', alignItems: 'center', justifyContent: 'center' }}>
                <Coins size={19} color="#facc15" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{t('payExtendWithJetons', { cost: JETON_EXTEND_COST, minutes: JETON_EXTEND_SECONDS / 60 })}</Text>
                {payments.payments.jetonBalance < JETON_EXTEND_COST ? <Text style={{ color: '#f87171', fontSize: 11, marginTop: 2 }}>{t('payInsufficientJetons')}</Text> : null}
              </View>
            </Pressable>

            <Pressable
              onPress={() => runFakeAd('time')}
              disabled={watchingAd !== null}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#141020', borderWidth: 1, borderColor: 'rgba(255,255,255,.08)', borderRadius: 16, padding: 14 }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(59,130,246,.15)', alignItems: 'center', justifyContent: 'center' }}>
                {watchingAd === 'time' ? <ActivityIndicator size="small" color="#3b82f6" /> : <PlayCircle size={19} color="#3b82f6" />}
              </View>
              <Text style={{ flex: 1, color: '#fff', fontWeight: '700', fontSize: 14 }}>{t('payExtendWithAd', { minutes: AD_EXTEND_SECONDS / 60 })}</Text>
            </Pressable>
          </View>
        ) : null}

        {focus === 'jetons' ? jetonSection : premiumSection}
        {focus === 'jetons' ? premiumSection : jetonSection}

        <Text style={{ textAlign: 'center', fontSize: 10.5, color: '#4a4458' }}>{t('payMockNote')}</Text>
      </ScrollView>
    </View>
  );
}
