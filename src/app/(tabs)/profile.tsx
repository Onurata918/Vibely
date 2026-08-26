import { useRouter } from 'expo-router';
import { ChevronRight, LogOut, Mail, Shield, User as UserIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { DangerButton, SheetParagraph, SheetTitle } from '@/components/ui/Sheet';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { PEOPLE, ROOMS } from '@/lib/vibely-data';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, history, notif, toggleNotif, openSheet, closeSheet, updateProfile, logout, toast } = useApp();
  const { t } = useLanguage();

  const me = {
    name: user?.name || t('you'),
    username: user?.username || 'sen',
    email: user?.email || '',
    c1: '#6366f1',
    c2: '#ec4899',
  };

  const editProfile = () => {
    openSheet('edit-profile', <EditProfileForm initialName={me.name} initialUsername={me.username} onSave={updateProfile} />);
  };

  const privacyInfo = () => {
    openSheet(
      'privacy',
      <View>
        <SheetTitle>{t('privacyAndSecurityTitle')}</SheetTitle>
        <SheetParagraph>{t('privacyAndSecurityBody')}</SheetParagraph>
      </View>
    );
  };

  const confirmLogout = () => {
    openSheet(
      'logout',
      <View>
        <SheetTitle>{t('logOutTitle')}</SheetTitle>
        <SheetParagraph>{t('logOutConfirm')}</SheetParagraph>
        <DangerButton
          onPress={() => {
            closeSheet();
            logout();
            router.replace('/login');
          }}
        >
          {t('logOut')}
        </DangerButton>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-vbg" style={{ paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="items-center" style={{ gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 26 }}>
          <Avatar person={me} size={92} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 21, fontWeight: '800', color: '#fff', letterSpacing: -0.3 }}>{me.name}</Text>
            <Text style={{ fontSize: 13, color: '#8e879f' }}>{`@${me.username}`}</Text>
          </View>
        </View>

        <View className="flex-row" style={{ gap: 10, paddingHorizontal: 20, paddingBottom: 22 }}>
          <Stat value={PEOPLE.length} label={t('friend')} />
          <Stat value={history.length} label={t('call')} />
          <Stat value={ROOMS.length} label={t('room')} />
        </View>

        <GroupLabel>{t('account')}</GroupLabel>
        <SettingsRow icon={UserIcon} label={t('editProfile')} onPress={editProfile} chevron />
        <SettingsRow icon={Mail} label={me.email || t('noEmail')} onPress={() => toast(me.email || t('noRegisteredEmail'))} chevron />

        <GroupLabel>{t('preferences')}</GroupLabel>
        <SettingsRow icon={Mail} label={t('notificationsLabel')} trailing={<Switch value={notif} onValueChange={toggleNotif} trackColor={{ true: '#8b5cf6' }} />} />
        <SettingsRow icon={Shield} label={t('privacyAndSecurity')} onPress={privacyInfo} chevron />

        <GroupLabel>{t('session')}</GroupLabel>
        <SettingsRow icon={LogOut} label={t('logOut')} onPress={confirmLogout} danger />
      </ScrollView>
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View className="flex-1 bg-vsurface border border-vline rounded-2xl items-center" style={{ paddingVertical: 13 }}>
      <Text style={{ fontSize: 19, fontWeight: '800', color: '#fff' }}>{value}</Text>
      <Text style={{ fontSize: 10.5, color: '#635c73', marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function GroupLabel({ children }: { children: string }) {
  const { language } = useLanguage();
  return (
    <Text style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, fontSize: 11.5, fontWeight: '700', color: '#635c73', letterSpacing: 0.6 }}>
      {children.toLocaleUpperCase(language === 'tr' ? 'tr-TR' : 'en-US')}
    </Text>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  onPress,
  chevron,
  danger,
  trailing,
}: {
  icon: typeof UserIcon;
  label: string;
  onPress?: () => void;
  chevron?: boolean;
  danger?: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center" style={{ gap: 13, paddingHorizontal: 20, paddingVertical: 14 }}>
      <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={17} color={danger ? '#f87171' : '#8b5cf6'} />
      </View>
      <Text style={{ flex: 1, fontSize: 14.5, color: danger ? '#f87171' : '#fff' }} numberOfLines={1}>
        {label}
      </Text>
      {trailing}
      {chevron ? <ChevronRight size={17} color="#635c73" /> : null}
    </Pressable>
  );
}

function EditProfileForm({ initialName, initialUsername, onSave }: { initialName: string; initialUsername: string; onSave: (name: string, username: string) => void }) {
  const { closeSheet, toast } = useApp();
  const { t } = useLanguage();
  const [name, setName] = useState(initialName);
  const [username, setUsername] = useState(initialUsername);
  return (
    <View>
      <SheetTitle>{t('editProfileTitle')}</SheetTitle>
      <View style={{ gap: 10, marginTop: 6, marginBottom: 14 }}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('displayNamePlaceholder')}
          placeholderTextColor="#635c73"
          style={{ backgroundColor: '#171326', borderRadius: 14, paddingHorizontal: 14, height: 52, color: '#fff', borderWidth: 1, borderColor: 'rgba(255,255,255,.07)' }}
        />
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder={t('usernamePlaceholder')}
          placeholderTextColor="#635c73"
          autoCapitalize="none"
          style={{ backgroundColor: '#171326', borderRadius: 14, paddingHorizontal: 14, height: 52, color: '#fff', borderWidth: 1, borderColor: 'rgba(255,255,255,.07)' }}
        />
      </View>
      <Pressable
        onPress={() => {
          if (!name.trim() || !username.trim()) return toast(t('emptyFieldsToast'));
          closeSheet();
          onSave(name.trim(), username.trim());
        }}
        style={{ height: 54, borderRadius: 16, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>{t('save')}</Text>
      </Pressable>
    </View>
  );
}
