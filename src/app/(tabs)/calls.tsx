import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { pad, person } from '@/lib/utils';

export default function CallsScreen() {
  const insets = useSafeAreaInsets();
  const { history } = useApp();
  const { t, language } = useLanguage();

  return (
    <View className="flex-1 bg-vbg" style={{ paddingTop: insets.top }}>
      <Text style={{ fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 18 }}>
        {t('callsTitle')}
      </Text>

      {history.length === 0 ? (
        <Text style={{ textAlign: 'center', color: '#635c73', fontSize: 13, paddingVertical: 40, paddingHorizontal: 30, lineHeight: 20 }}>
          {t('noCallHistory')}
        </Text>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {history.map((item, i) => {
            const p = (item.id && person(item.id)) || { name: item.title, c1: '#6366f1', c2: '#8b5cf6' };
            const when = new Date(item.at);
            const dstr = when.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { day: '2-digit', month: 'short' });
            return (
              <View key={i} className="flex-row items-center" style={{ gap: 13, paddingHorizontal: 20, paddingVertical: 11 }}>
                <Avatar person={p} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14.5, fontWeight: '600', color: '#fff' }}>{item.title}</Text>
                  <Text style={{ fontSize: 12, color: '#635c73', marginTop: 2 }}>{`${item.kind === 'room' ? t('room') : t('videoCall')} • ${item.dur}`}</Text>
                </View>
                <Text style={{ fontSize: 11, color: '#635c73' }}>{`${dstr} ${pad(when.getHours())}:${pad(when.getMinutes())}`}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
