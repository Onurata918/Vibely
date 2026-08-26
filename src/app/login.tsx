import { useRouter } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Field } from '@/components/ui/Field';
import { Logo } from '@/components/ui/Logo';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SheetParagraph, SheetTitle } from '@/components/ui/Sheet';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { isMail } from '@/lib/utils';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, socialLogin, openSheet, closeSheet, toast } = useApp();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.ok) return setError(res.error);
    router.replace('/(tabs)/home');
  };

  const forgot = () => {
    const canReset = email && isMail(email);
    openSheet(
      'forgot',
      <View>
        <SheetTitle>{t('forgotTitle')}</SheetTitle>
        <SheetParagraph>
          {canReset ? (
            <>
              <Text style={{ fontWeight: '700', color: '#fff' }}>{email}</Text> {t('forgotWithEmail')}
            </>
          ) : (
            t('forgotNoEmail')
          )}
        </SheetParagraph>
        {canReset ? (
          <PrimaryButton
            onPress={() => {
              closeSheet();
              toast(t('resetLinkSent'));
            }}
          >
            {t('sendLink')}
          </PrimaryButton>
        ) : null}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-vbg" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 6, paddingBottom: 20, paddingHorizontal: 28 }} keyboardShouldPersistTaps="handled">
        <View style={{ marginTop: 22, marginBottom: 8 }}>
          <Logo size="lg" tagline />
        </View>

        <View style={{ alignItems: 'center', marginVertical: 26 }}>
          <Text style={{ fontSize: 23, fontWeight: '800', color: '#fff', letterSpacing: -0.3, marginBottom: 7 }}>{t('loginWelcomeBack')}</Text>
          <Text style={{ fontSize: 13, color: '#8e879f' }}>{t('loginSubtitle')}</Text>
        </View>

        <View style={{ gap: 12 }}>
          <Field icon={Mail} placeholder={t('emailPlaceholder')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Field icon={Lock} placeholder={t('passwordPlaceholder')} value={password} onChangeText={setPassword} secure />
        </View>

        {error ? <Text style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>{error}</Text> : null}

        <Pressable onPress={forgot} style={{ alignSelf: 'flex-end', marginVertical: 10 }}>
          <Text style={{ fontSize: 12.5, fontWeight: '600', color: '#ec4899' }}>{t('forgotPassword')}</Text>
        </Pressable>

        <PrimaryButton onPress={submit} loading={loading}>
          {t('login')}
        </PrimaryButton>

        <View className="flex-row items-center" style={{ gap: 14, marginVertical: 22 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,.07)' }} />
          <Text style={{ fontSize: 12, color: '#635c73' }}>{t('or')}</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,.07)' }} />
        </View>

        <View className="flex-row" style={{ gap: 9 }}>
          {(['Google', 'Apple', 'Discord'] as const).map((p) => (
            <Pressable
              key={p}
              onPress={() => socialLogin(p)}
              className="flex-1 items-center justify-center bg-vinput rounded-2xl"
              style={{ height: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,.07)' }}
            >
              <Text style={{ fontSize: 11.5, fontWeight: '600', color: '#d6d1e0' }}>{t('withProvider', { provider: p })}</Text>
            </Pressable>
          ))}
        </View>

        <View className="flex-row justify-center" style={{ marginTop: 26, gap: 4 }}>
          <Text style={{ fontSize: 13.5, color: '#8e879f' }}>{t('noAccount')}</Text>
          <Pressable onPress={() => router.push('/register')}>
            <Text style={{ fontSize: 13.5, color: '#8b5cf6', fontWeight: '700' }}>{t('signUp')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
