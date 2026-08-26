import { Send, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

const CHAT_EMOJI = ['😀', '😂', '😍', '😎', '🤩', '😭', '👍', '👏', '🔥', '❤️', '🎉', '🎮', '💜', '😱', '🙌', '🤔'];

export function ChatPanel() {
  const { call, chatOpen, typing, toggleChat, sendMessage, reactToMessage } = useApp();
  const { t } = useLanguage();
  const [draft, setDraft] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (chatOpen) requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, [call?.msgs.length, chatOpen, typing]);

  if (!chatOpen || !call) return null;

  const send = () => {
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft('');
  };

  return (
    <View style={{ marginHorizontal: 16, marginTop: 8, backgroundColor: 'rgba(20,16,32,.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,.07)', borderTopLeftRadius: 18, borderTopRightRadius: 18, maxHeight: 290, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,.07)' }}>
        <Text style={{ fontSize: 13.5, fontWeight: '700', color: '#fff' }}>{t('chat')}</Text>
        <View style={{ backgroundColor: '#8b5cf6', borderRadius: 9, paddingHorizontal: 7, paddingVertical: 1 }}>
          <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#fff' }}>{call.msgs.length}</Text>
        </View>
        <Pressable onPress={() => toggleChat(false)} style={{ marginLeft: 'auto' }}>
          <X size={14} color="#8e879f" />
        </Pressable>
      </View>

      <ScrollView ref={scrollRef} style={{ maxHeight: 190 }} contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 10, gap: 11 }}>
        {call.msgs.map((m, i) =>
          m.sys ? (
            <View key={i} style={{ alignSelf: 'center', maxWidth: '92%' }}>
              <Text style={{ backgroundColor: 'rgba(139,92,246,.14)', color: '#8e879f', fontSize: 11.5, textAlign: 'center', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, lineHeight: 16 }}>
                {m.txt}
              </Text>
            </View>
          ) : (
            <Pressable key={i} onPress={() => reactToMessage(i)} style={{ alignSelf: m.me ? 'flex-end' : 'flex-start', maxWidth: '86%' }}>
              {!m.me ? (
                <Text style={{ fontSize: 11, marginBottom: 3 }}>
                  <Text style={{ fontWeight: '700', color: '#8b5cf6' }}>{m.who}</Text> <Text style={{ color: '#635c73' }}>{m.t}</Text>
                </Text>
              ) : null}
              <View style={{ backgroundColor: m.me ? '#8b5cf6' : '#1b1629', borderRadius: 14, paddingHorizontal: 11, paddingVertical: 8 }}>
                <Text style={{ fontSize: 13, color: m.me ? '#fff' : '#e5e2ec', lineHeight: 17 }}>{m.txt}</Text>
              </View>
              {m.react ? <Text style={{ fontSize: 10.5, color: '#8e879f', marginTop: 4, textAlign: m.me ? 'right' : 'left' }}>{m.react}</Text> : null}
            </Pressable>
          )
        )}
        {typing ? (
          <Text style={{ fontSize: 11.5, color: '#635c73' }}>{t('typingIndicator', { name: typing })}</Text>
        ) : null}
      </ScrollView>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderColor: 'rgba(255,255,255,.07)' }}>
        <Pressable onPress={() => setEmojiOpen((v) => !v)} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 17 }}>😊</Text>
        </Pressable>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={send}
          placeholder={t('messagePlaceholder')}
          placeholderTextColor="#635c73"
          style={{ flex: 1, height: 40, borderRadius: 12, backgroundColor: '#171326', paddingHorizontal: 13, color: '#fff', fontSize: 13.5 }}
        />
        <Pressable onPress={send} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center' }}>
          <Send size={17} color="#fff" />
        </Pressable>
      </View>

      {emojiOpen ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12, paddingBottom: 10 }}>
          {CHAT_EMOJI.map((e) => (
            <Pressable
              key={e}
              onPress={() => setDraft((d) => d + e)}
              style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 18 }}>{e}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
