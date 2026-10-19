import React from 'react';
import {
  ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle,
} from 'react-native';
import { colors, radius, spacing } from '../theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  small?: boolean;
}

export function Button({
  title, onPress, variant = 'primary', loading, disabled, icon, style, small,
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base, styles[variant], small && styles.small, isDisabled && styles.disabled, style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? colors.olive : colors.white} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.text, textStyleFor(variant), small && styles.smallText, icon ? styles.textWithIcon : null]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function textStyleFor(variant: Variant): TextStyle {
  if (variant === 'outline' || variant === 'ghost') return { color: colors.olive };
  return { color: colors.white };
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  small: { height: 40, paddingHorizontal: spacing.md },
  primary: { backgroundColor: colors.olive },
  secondary: { backgroundColor: colors.oliveDark },
  outline: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.olive },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.danger },
  disabled: { opacity: 0.5 },
  content: { flexDirection: 'row', alignItems: 'center' },
  text: { fontSize: 16, fontWeight: '600' },
  smallText: { fontSize: 14 },
  textWithIcon: { marginLeft: spacing.sm },
});
