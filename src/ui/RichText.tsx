import { StyleProp, Text, TextStyle, View } from 'react-native';

import { C, F } from './theme';

// Nuria answers in a small markdown subset: **bold**, "- " bullets and "1. " steps
export function RichText({ text, style }: { text: string; style?: StyleProp<TextStyle> }) {
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <View style={{ gap: 8 }}>
      {blocks.map((b, i) => {
        const lines = b.split('\n');
        if (lines.every((l) => /^\s*([-•*]|\d+[.)])\s+/.test(l)))
          return (
            <View key={i} style={{ gap: 5 }}>
              {lines.map((l, j) => {
                const m = l.match(/^\s*([-•*]|\d+[.)])\s+(.*)$/)!;
                const marker = /\d/.test(m[1]) ? m[1].replace(')', '.') : '•';
                return (
                  <View key={j} style={{ flexDirection: 'row', gap: 7 }}>
                    <Text style={[base, style, { color: C.celDeep, fontFamily: F.black }]}>{marker}</Text>
                    <Text style={[base, style, { flex: 1 }]}>{inline(m[2])}</Text>
                  </View>
                );
              })}
            </View>
          );
        return (
          <Text key={i} style={[base, style]}>
            {inline(b)}
          </Text>
        );
      })}
    </View>
  );
}

function inline(t: string) {
  return t
    .replace(/^#+\s*/gm, '')
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <Text key={i} style={{ fontFamily: F.black }}>
          {part.slice(2, -2)}
        </Text>
      ) : (
        part
      ),
    );
}

const base: TextStyle = { fontFamily: F.body, fontSize: 15, lineHeight: 21, color: C.ink };
