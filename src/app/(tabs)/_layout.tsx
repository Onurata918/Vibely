import { Tabs, TabList, TabSlot, TabTrigger } from 'expo-router/ui';
import { Home, MessageCircle, User, Users } from 'lucide-react-native';
import React from 'react';

import { CustomTabBarShell, TabButton } from '@/components/TabBar';
import { useLanguage } from '@/context/LanguageContext';

export default function TabsLayout() {
  const { t } = useLanguage();
  return (
    <Tabs>
      <TabSlot style={{ flex: 1, backgroundColor: '#08050f' }} />
      <TabList asChild>
        <CustomTabBarShell>
          <TabTrigger name="home" href="/(tabs)/home" asChild>
            <TabButton icon={Home} label={t('tabHome')} />
          </TabTrigger>
          <TabTrigger name="friends" href="/(tabs)/friends" asChild>
            <TabButton icon={Users} label={t('tabFriends')} />
          </TabTrigger>
          <TabTrigger name="calls" href="/(tabs)/calls" asChild>
            <TabButton icon={MessageCircle} label={t('tabCalls')} />
          </TabTrigger>
          <TabTrigger name="profile" href="/(tabs)/profile" asChild>
            <TabButton icon={User} label={t('tabProfile')} />
          </TabTrigger>
        </CustomTabBarShell>
      </TabList>
    </Tabs>
  );
}
