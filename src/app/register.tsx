import { useRouter } from 'expo-router';
import { AtSign, Check, ChevronLeft, Lock, Mail, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Field } from '@/components/ui/Field';
import { Logo } from '@/components/ui/Logo';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SheetParagraph, SheetTitle } from '@/components/ui/Sheet';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { register, openSheet } = useApp();
  const { t, language } = useLanguage();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    setLoading(true);
    const res = await register({ username, displayName, email, password, confirm, agreed });
    setLoading(false);
    if (!res.ok) return setError(res.error);
    router.replace('/(tabs)/home');
  };

  const showInfo = (kind: 'terms' | 'privacy') => {
    openSheet(
      kind,
      <View>
        <SheetTitle>{kind === 'terms' ? t('termsTitle') : t('privacyTitle')}</SheetTitle>
        <SheetParagraph>{kind === 'terms' ? t('termsBody') : t('privacyBody')}</SheetParagraph>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-vbg" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable
        onPress={() => router.back()}
        style={{
          position: 'absolute',
          top: insets.top + 12,
          left: 22,
          zIndex: 20,
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: '#1b1629',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,.07)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ChevronLeft size={19} color="#fff" />
      </Pressable>

      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 6, paddingBottom: 24, paddingHorizontal: 28 }} keyboardShouldPersistTaps="handled">
        <View style={{ marginTop: 22, marginBottom: 8 }}>
          <Logo size="lg" tagline />
        </View>

        <View style={{ alignItems: 'center', marginVertical: 26 }}>
          <Text style={{ fontSize: 23, fontWeight: '800', color: '#fff', letterSpacing: -0.3, marginBottom: 7 }}>{t('registerTitle')}</Text>
          <Text style={{ fontSize: 13, color: '#8e879f' }}>{t('registerSubtitle')}</Text>
        </View>

        <View style={{ gap: 12 }}>
          <View className="flex-row" style={{ gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Field icon={User} placeholder={t('usernamePlaceholder')} value={username} onChangeText={setUsername} autoCapitalize="none" />
            </View>
            <View style={{ flex: 1 }}>
              <Field icon={AtSign} placeholder={t('displayNamePlaceholder')} value={displayName} onChangeText={setDisplayName} />
            </View>
          </View>
          <Field icon={Mail} placeholder={t('emailPlaceholder')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Field icon={Lock} placeholder={t('passwordCreatePlaceholder')} value={password} onChangeText={setPassword} secure />
          <Field icon={Lock} placeholder={t('passwordConfirmPlaceholder')} value={confirm} onChangeText={setConfirm} secure />
        </View>

        {error ? <Text style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>{error}</Text> : null}

        <Pressable onPress={() => setAgreed((v) => !v)} className="flex-row items-start" style={{ gap: 10, marginTop: 18, marginBottom: 4 }}>
          <View
            style={{
              width: 19,
              height: 19,
              borderRadius: 6,
              marginTop: 1,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: agreed ? '#8b5cf6' : 'transparent',
              borderWidth: agreed ? 0 : 1.5,
              borderColor: 'rgba(255,255,255,.12)',
            }}
          >
            {agreed ? <Check size={12} color="#fff" strokeWidth={3.2} /> : null}
          </View>
          <Text style={{ flex: 1, fontSize: 12, lineHeight: 17, color: '#8e879f' }}>
            {language === 'en' ? `${t('termsAgree')} ` : null}
            <Text onPress={() => showInfo('terms')} style={{ color: '#8b5cf6' }}>
              {t('termsOfUse')}
            </Text>{' '}
            {t('termsAnd')}{' '}
            <Text onPress={() => showInfo('privacy')} style={{ color: '#8b5cf6' }}>
              {t('privacyPolicy')}
            </Text>
            {language === 'tr' ? ` ${t('termsAgree')}` : '.'}
          </Text>
        </Pressable>

        <PrimaryButton onPress={submit} loading={loading} style={{ marginTop: 14 }}>
          {t('createAccount')}
        </PrimaryButton>

        <View className="flex-row justify-center" style={{ marginTop: 26, gap: 4 }}>
          <Text style={{ fontSize: 13.5, color: '#8e879f' }}>{t('haveAccount')}</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={{ fontSize: 13.5, color: '#8b5cf6', fontWeight: '700' }}>{t('login')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
