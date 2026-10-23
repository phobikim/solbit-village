// 장작 크기 고르기: 잔가지(한두 시간) / 장작(반나절) / 통나무(하루 꼬박). 장작 던지기(15b)와 기록 시트의 쉼 칸이 같이 쓴다.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { SIZE_HINT, SIZE_LABEL } from '../../../copy/rest.ko';
import { REST_SIZES, type RestSize } from '../../../domain/fire';
import { sizeSvg } from '../../characters/restIcons';
import { colors, fonts } from '../../theme';

export function SizePicker({ value, onChange }: { value: RestSize; onChange: (v: RestSize) => void }) {
  return (
    <View style={styles.sizes}>
      {REST_SIZES.map((s) => {
        const on = s === value;
        return (
          <Pressable
            key={s}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${SIZE_LABEL[s]} ${SIZE_HINT[s]}`}
            onPress={() => onChange(s)}
            style={[styles.size, on && styles.sizeOn]}
          >
            <SvgXml xml={sizeSvg(s, on)} width={44} height={30} />
            <Text style={[styles.sizeLabel, on && styles.sizeLabelOn]}>{SIZE_LABEL[s]}</Text>
            <Text style={[styles.sizeHint, on && styles.sizeHintOn]}>{SIZE_HINT[s]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sizes: { flexDirection: 'row', gap: 8 },
  size: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.night, borderWidth: 2, borderColor: '#333C7A' },
  sizeOn: { backgroundColor: '#3A2A55', borderColor: colors.leisure },
  sizeLabel: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.textSub },
  sizeLabelOn: { color: colors.text },
  sizeHint: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.textMuted },
  sizeHintOn: { color: colors.textSub },
});
