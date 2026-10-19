import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import { useAuth } from '../auth/AuthContext';
import { errorMessage, API_BASE_URL } from '../api/client';
import { colors, radius, spacing } from '../theme';
import { useI18n } from '../i18n';

export function LoginScreen() {
  const { t } = useI18n();
  const { login, signingIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!username.trim() || !password) {
      setError(t('Veuillez saisir votre identifiant et votre mot de passe.'));
      return;
    }
    try {
      await login(username, password);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <View style={styles.logo}>
              <Ionicons name="leaf" size={40} color={colors.oliveDark} />
            </View>
            <Text style={styles.title}>OlivePress</Text>
            <Text style={styles.subtitle}>{t("Gestion d'huilerie d'huile d'olive")}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.welcome}>{t('Connexion')}</Text>
            <Text style={styles.hint}>{t('Accédez à votre espace de travail')}</Text>

            <View style={{ height: spacing.lg }} />

            <TextField
              label={t('Identifiant ou e-mail')}
              placeholder={t('ex : admin')}
              icon="person-outline"
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={setUsername}
            />
            <TextField
              label={t('Mot de passe')}
              placeholder="••••••••"
              icon="lock-closed-outline"
              secure
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={onSubmit}
              returnKeyType="go"
            />

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button title={t('Se connecter')} onPress={onSubmit} loading={signingIn} />
          </View>

          <Text style={styles.apiHint}>{t('Serveur : {value}', { value: API_BASE_URL })}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.oliveDark },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  logoWrap: { alignItems: 'center', marginBottom: spacing.xl },
  logo: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: colors.cream,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.white },
  subtitle: { fontSize: 14, color: colors.softGray, marginTop: 4 },
  card: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  welcome: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  hint: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F6DEDD',
    borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.lg,
  },
  errorText: { color: colors.danger, marginLeft: spacing.sm, flex: 1, fontSize: 13 },
  apiHint: { color: colors.softGray, fontSize: 11, textAlign: 'center', marginTop: spacing.xl },
});
