import { ArrowRight, X } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { GradientView } from '@/components/ui/GradientView';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

export function TruthOrDareOverlay() {
  const insets = useSafeAreaInsets();
  const { truthOrDare: td, closeTruthOrDare, chooseTruth, chooseDare, nextTdPlayer } = useApp();
  const { t } = useLanguage();

  if (!td) return null;

  const currentPlayer = td.order[td.index];

  return (
    <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
      <Pressable
        onPress={closeTruthOrDare}
        style={{ position: 'absolute', top: insets.top + 10, left: 14, zIndex: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}
      >
        <X size={17} color="#fff" />
      </Pressable>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 }}>
        <View style={{ width: '100%', alignItems: 'center', gap: 22 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#635c73', letterSpacing: 0.6 }}>{t('todNextPlayerHeader')}</Text>
          <Avatar person={currentPlayer} size={64} />
          <Text style={{ fontSize: 19, fontWeight: '800', color: '#fff' }}>{currentPlayer?.name}</Text>

          {td.mode === 'choose' ? (
            <View style={{ width: '100%', flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <Pressable onPress={chooseTruth} style={{ flex: 1 }}>
                <View style={{ borderRadius: 22, backgroundColor: '#141020', borderWidth: 1, borderColor: 'rgba(139,92,246,.4)', paddingVertical: 26, alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 30 }}>🤔</Text>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{t('todTruthOption')}</Text>
                </View>
              </Pressable>
              <Pressable onPress={chooseDare} style={{ flex: 1 }}>
                <View style={{ borderRadius: 22, backgroundColor: '#141020', borderWidth: 1, borderColor: 'rgba(236,72,153,.4)', paddingVertical: 26, alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 30 }}>😈</Text>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{t('todDareOption')}</Text>
                </View>
              </Pressable>
            </View>
          ) : (
            <>
              <GradientView
                angle={135}
                style={{ width: '100%', minHeight: 170, borderRadius: 24, alignItems: 'center', justifyContent: 'center', padding: 26 }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,.8)', letterSpacing: 0.6, marginBottom: 10 }}>
                  {td.mode === 'truth' ? t('todTruthBadge') : t('todDareBadge')}
                </Text>
                <Text style={{ fontSize: 17, fontWeight: '700', color: '#fff', textAlign: 'center', lineHeight: 24 }}>{td.prompt}</Text>
              </GradientView>

              <Pressable onPress={nextTdPlayer} style={{ marginTop: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 52, paddingHorizontal: 22, borderRadius: 16, backgroundColor: '#1b1629' }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14.5 }}>{t('todNextPlayerButton')}</Text>
                  <ArrowRight size={16} color="#fff" />
                </View>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}
