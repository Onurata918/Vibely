import React from 'react';
import { Text, type TextProps } from 'react-native';

// react-native-masked-view'in web'de gradyanı maskelemeden (siyah metin
// olarak) render ettiği tespit edildi (bkz. web screenshot testi) —
// platformlar arası güvenilir olması icin duz --purple rengiyle
// yaklastiriyoruz; ic ice degrade yerine tek renk kucuk bir sadelesme.
const SOLID_COLOR = '#a78bfa';

export function GradientText({ children, style, ...rest }: TextProps) {
  return (
    <Text {...rest} style={[style, { color: SOLID_COLOR }]}>
      {children}
    </Text>
  );
}
