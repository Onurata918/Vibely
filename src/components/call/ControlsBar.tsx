import { Camera, CameraOff, LockKeyhole, Mic, MicOff, MessageSquare, PhoneOff, ScreenShare, Sparkles, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useLanguage } from '@/context/LanguageContext';

function CtrlButton({
  icon: Icon,
  label,
  onPress,
  active,
  danger,
  leave,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  active?: boolean;
  danger?: boolean;
  leave?: boolean;
}) {
  const bg = leave ? '#ef4444' : danger ? 'rgba(239,68,68,.9)' : active ? 'rgba(255,255,255,.15)' : '#1b1629';
  const iconColor = leave || danger ? '#fff' : active ? '#fff' : '#8e879f';
  const labelColor = leave || danger ? '#fca5a5' : active ? '#fff' : '#8e879f';
  return (
    <Pressable onPress={onPress} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
      <View style={{ width: '100%', aspectRatio: 1, borderRadius: 16, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color={iconColor} />
      </View>
      <Text style={{ fontSize: 8.5, fontWeight: '600', color: labelColor, textAlign: 'center' }} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ControlsBar({
  mic,
  cam,
  share,
  chatOpen,
  locked,
  unread,
  onEffects,
  onMic,
  onCam,
  onShare,
  onChat,
  onLock,
  onLeave,
}: {
  mic: boolean;
  cam: boolean;
  share: boolean;
  chatOpen: boolean;
  locked: boolean;
  unread: number;
  onEffects: () => void;
  onMic: () => void;
  onCam: () => void;
  onShare: () => void;
  onChat: () => void;
  onLock: () => void;
  onLeave: () => void;
}) {
  const { t } = useLanguage();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 4,
        marginHorizontal: 12,
        marginTop: 10,
        paddingHorizontal: 6,
        paddingTop: 12,
        paddingBottom: 6,
        backgroundColor: 'rgba(20,16,32,.9)',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,.07)',
      }}
    >
      <CtrlButton icon={Sparkles} label={t('effects')} onPress={onEffects} />
      <CtrlButton icon={mic ? Mic : MicOff} label={t('mic')} active={mic} danger={!mic} onPress={onMic} />
      <CtrlButton icon={cam ? Camera : CameraOff} label={t('camera')} active={cam} danger={!cam} onPress={onCam} />
      <CtrlButton icon={ScreenShare} label={t('screenShare')} active={share} onPress={onShare} />
      <View style={{ flex: 1 }}>
        <CtrlButton icon={MessageSquare} label={t('chat')} active={chatOpen} onPress={onChat} />
        {!chatOpen && unread > 0 ? (
          <View style={{ position: 'absolute', top: 0, right: '28%', width: 8, height: 8, borderRadius: 4, backgroundColor: '#ec4899', borderWidth: 2, borderColor: '#1b1629' }} />
        ) : null}
      </View>
      <CtrlButton icon={LockKeyhole} label={t('lockRoom')} active={locked} onPress={onLock} />
      <CtrlButton icon={PhoneOff} label={t('leaveAction')} onPress={onLeave} leave />
    </View>
  );
}
