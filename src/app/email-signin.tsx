import { useRouter } from 'expo-router';
import { ChevronLeft, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Field } from '@/components/ui/Field';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { isMail } from '@/lib/utils';

/**
 * Sifresiz e-posta girisi: adres -> 6 haneli kod.
 * Mock asamasinda herhangi 6 rakam kabul edilir; Supabase baglaninca
 * kodu e-posta ile o gonderir ve dogrulamayi o yapar.
 */
export default function EmailSignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { emailCodeLogin, toast } = useApp();
  const { t } = useLanguage();

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const sendCode = () => {
    if (!isMail(email)) return setError(t('invalidEmail'));
    setError('');
    setStep('code');
    toast(t('authCodeSentToast'));
  };

  const verify = () => {
    if (!/^\d{6}$/.test(code)) return setError(t('authCodeInvalid'));
    emailCodeLogin(email);
    router.replace('/(tabs)/home');
  };

  const back = () => {
    if (step === 'code') {
      setStep('email');
      setCode('');
      setError('');
    } else {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-vbg" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable
        onPress={back}
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

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 80, paddingHorizontal: 28, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.3, marginBottom: 8 }}>
          {step === 'email' ? t('authEmailTitle') : t('authCodeTitle')}
        </Text>
        <Text style={{ fontSize: 13, lineHeight: 19, color: '#8e879f', marginBottom: 24 }}>
          {step === 'email' ? t('authEmailSubtitle') : t('authCodeSubtitle', { email })}
        </Text>

        {step === 'email' ? (
          <Field icon={Mail} placeholder={t('emailPlaceholder')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        ) : (
          <TextInput
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            autoFocus
            maxLength={6}
            placeholder="······"
            placeholderTextColor="#3a3448"
            style={{
              backgroundColor: '#171326',
              borderRadius: 16,
              height: 62,
              color: '#fff',
              fontSize: 26,
              fontWeight: '800',
              letterSpacing: 12,
              textAlign: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,.08)',
            }}
          />
        )}

        {error ? <Text style={{ fontSize: 12, color: '#f87171', marginTop: 10 }}>{error}</Text> : null}

        <PrimaryButton onPress={step === 'email' ? sendCode : verify} style={{ marginTop: 18 }}>
          {step === 'email' ? t('authSendCode') : t('authVerify')}
        </PrimaryButton>

        {step === 'code' ? (
          <>
            <Pressable onPress={() => toast(t('authCodeSentToast'))} style={{ alignSelf: 'center', marginTop: 18 }}>
              <Text style={{ fontSize: 12.5, fontWeight: '600', color: '#8b5cf6' }}>{t('authCodeResend')}</Text>
            </Pressable>
            <Text style={{ textAlign: 'center', fontSize: 11, color: '#4a4458', marginTop: 20 }}>{t('authMockCodeHint')}</Text>
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
