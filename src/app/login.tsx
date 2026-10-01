import { useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/ui/Logo';
import { SheetParagraph, SheetTitle } from '@/components/ui/Sheet';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

/**
 * Tek ekranda giris ve kayit. "Continue with ..." kaliblarinin hepsi hem yeni
 * hesap acar hem mevcut hesaba girer; ayri bir giris formu yok.
 */
export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { socialLogin, openSheet } = useApp();
  const { t, language } = useLanguage();

  const social = (provider: 'Apple' | 'Google') => {
    socialLogin(provider);
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
    <View className="flex-1 bg-vbg">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 6, paddingBottom: insets.bottom + 24, paddingHorizontal: 28, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginBottom: 44 }}>
          <Logo size="lg" tagline />
        </View>

        <View style={{ gap: 11 }}>
          <Pressable
            onPress={() => social('Apple')}
            style={{ height: 54, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#000' }}>{t('authContinueWith', { provider: 'Apple' })}</Text>
          </Pressable>

          <Pressable
            onPress={() => social('Google')}
            className="bg-vinput"
            style={{ height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)' }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>{t('authContinueWith', { provider: 'Google' })}</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/email-signin')}
            style={{ height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,.1)' }}
          >
            <Mail size={17} color="#cfc9db" />
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#cfc9db' }}>{t('authContinueWithEmail')}</Text>
          </Pressable>
        </View>

        <View className="flex-row justify-center" style={{ marginTop: 30, gap: 4 }}>
          <Text style={{ fontSize: 13.5, color: '#8e879f' }}>{t('noAccount')}</Text>
          <Pressable onPress={() => router.push('/register')}>
            <Text style={{ fontSize: 13.5, color: '#8b5cf6', fontWeight: '700' }}>{t('signUp')}</Text>
          </Pressable>
        </View>

        <Text style={{ textAlign: 'center', fontSize: 11.5, lineHeight: 17, color: '#635c73', marginTop: 26 }}>
          {`${t('authLegalPrefix')} `}
          <Text onPress={() => showInfo('terms')} style={{ color: '#8b5cf6' }}>
            {t('termsOfUse')}
          </Text>{' '}
          {t('termsAnd')}{' '}
          <Text onPress={() => showInfo('privacy')} style={{ color: '#8b5cf6' }}>
            {t('privacyPolicy')}
          </Text>
          {language === 'tr' ? `'nı ${t('authLegalSuffix')}` : '.'}
        </Text>
      </ScrollView>
    </View>
  );
}
