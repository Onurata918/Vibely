import { Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

type Props = {
  icon: LucideIcon;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

export function Field({ icon: Icon, placeholder, value, onChangeText, error, secure, keyboardType, autoCapitalize }: Props) {
  const [show, setShow] = useState(false);
  return (
    <View>
      <View
        className="flex-row items-center bg-vinput rounded-2xl px-3.5"
        style={{
          height: 52,
          gap: 10,
          borderWidth: 1,
          borderColor: error ? 'rgba(239,68,68,.7)' : 'rgba(255,255,255,.07)',
        }}
      >
        <Icon size={18} color="#635c73" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#635c73"
          secureTextEntry={secure && !show}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? (secure ? 'none' : 'sentences')}
          autoCorrect={false}
          style={{ flex: 1, color: '#fff', fontSize: 14.5 }}
        />
        {secure ? (
          <Pressable onPress={() => setShow((s) => !s)} hitSlop={8}>
            {show ? <EyeOff size={16} color="#635c73" /> : <Eye size={16} color="#635c73" />}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={{ fontSize: 12, color: '#f87171', marginTop: 6, marginLeft: 4 }}>{error}</Text> : null}
    </View>
  );
}
