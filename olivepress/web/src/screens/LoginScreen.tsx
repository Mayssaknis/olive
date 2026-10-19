import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../api/client';
import { Button, TextField } from '../components/Form';
import { useI18n } from '../i18n';

export default function LoginScreen() {
  const { login, signingIn } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError(t('Veuillez saisir votre identifiant et votre mot de passe.'));
      return;
    }
    setError('');
    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? t('Identifiants incorrects.'));
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#F7F4EC"
            strokeWidth="1.6"
          >
            <path d="M12 2C7 7 5 11 5 14a7 7 0 0 0 14 0c0-3-2-7-7-12z" />
            <path d="M12 22V12" />
          </svg>
          <h1>OlivePress</h1>
          <p>{t("Gestion d'huilerie d'huile d'olive")}</p>
        </div>
        <div className="card card-pad">
          {error && <div className="alert-box">{error}</div>}
          <form onSubmit={submit}>
            <TextField
              label={t('Identifiant ou e-mail')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
            />
            <TextField
              label={t('Mot de passe')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <Button type="submit" block loading={signingIn}>
              {t('Se connecter')}
            </Button>
          </form>
        </div>
        <div className="login-footer">{t('Serveur : {value}', { value: API_BASE_URL })}</div>
      </div>
    </div>
  );
}
