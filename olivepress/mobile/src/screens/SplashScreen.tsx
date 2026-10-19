import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';
import { useI18n } from '../i18n';

export function SplashScreen() {
  const { t } = useI18n();
  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Ionicons name="leaf" size={44} color={colors.oliveDark} />
      </View>
      <Text style={styles.title}>OlivePress</Text>
      <Text style={styles.subtitle}>{t("Gestion d'huilerie d'huile d'olive")}</Text>
      <ActivityIndicator color={colors.white} style={{ marginTop: spacing.xxl }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.oliveDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: colors.cream,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg,
  },
  title: { fontSize: 30, fontWeight: '800', color: colors.white, letterSpacing: 0.5 },
  subtitle: { fontSize: 14, color: colors.softGray, marginTop: spacing.sm },
});
