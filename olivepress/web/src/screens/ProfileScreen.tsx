import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import { LOCALES, Locale } from '../i18n/translations';
import { ALL_PERMISSIONS } from '../constants/permissions';
import { authApi } from '../api/services';
import { Badge, Card, SectionHeader } from '../components/UI';
import { Button, TextField } from '../components/Form';
import { initials } from '../utils/format';

export default function ProfileScreen() {
  const { user, logout, can, isAdmin } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordOk, setPasswordOk] = useState(false);

  const submitPassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordOk(false);
    if (newPassword !== confirmPassword) {
      setPasswordError(t('Les mots de passe ne correspondent pas.'));
      return;
    }
    setSavingPassword(true);
    setPasswordError('');
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordOk(true);
    } catch (err: any) {
      setPasswordError(err?.response?.data?.message ?? t('Échec du changement de mot de passe.'));
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) return null;

  const doLogout = async () => {
    if (!window.confirm(t('Se déconnecter') + ' ?')) return;
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div
            className="avatar"
            style={{
              width: 56,
              height: 56,
              fontSize: 20,
              background: 'var(--olive)',
              color: '#fff',
            }}
          >
            {initials(user.fullName)}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{user.fullName}</div>
            <div className="muted">@{user.username}</div>
            <div style={{ marginTop: 6 }}>
              <Badge
                status={isAdmin ? 'RECU' : 'EN_ATTENTE'}
                labelOverride={isAdmin ? t('Administrateur') : t('Employé')}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <SectionHeader title={t('Informations')} />
        <div style={{ fontSize: 13.5, lineHeight: 2 }}>
          <div>
            <strong>{t('E-mail')} :</strong> {user.email}
          </div>
          <div>
            <strong>{t('Téléphone')} :</strong> {user.phone ?? '—'}
          </div>
          <div>
            <strong>{t('Statut')} :</strong> {user.active ? t('Actif') : t('Inactif')}
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <SectionHeader title={t('Langue')} />
        <div className="chips" style={{ marginBottom: 0 }}>
          {LOCALES.map((l) => (
            <button
              key={l.value}
              className={`chip ${locale === l.value ? 'active' : ''}`}
              onClick={() => setLocale(l.value as Locale)}
            >
              {l.flag} · {l.label}
            </button>
          ))}
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <SectionHeader title={t('Changer le mot de passe')} />
        <form onSubmit={submitPassword}>
          <TextField
            label={t('Mot de passe actuel')}
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <TextField
            label={t('Nouveau mot de passe')}
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            hint={t('Au moins 6 caractères.')}
            required
          />
          <TextField
            label={t('Confirmer le nouveau mot de passe')}
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {passwordError && (
            <div className="field-error" style={{ marginBottom: 12 }}>
              {passwordError}
            </div>
          )}
          {passwordOk && (
            <div className="field-hint" style={{ marginBottom: 12 }}>
              {t('Mot de passe modifié.')}
            </div>
          )}
          <Button type="submit" loading={savingPassword}>
            <ShieldCheck size={17} /> {t('Enregistrer')}
          </Button>
        </form>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <SectionHeader
          title={isAdmin ? t('Droits administrateur (accès complet)') : t('Vos permissions')}
        />
        <div className="chips" style={{ marginBottom: 0 }}>
          {isAdmin ? (
            <span className="chip active">{t('Tous les droits')}</span>
          ) : (
            ALL_PERMISSIONS.filter((p) => can(p.value as any)).map((p) => (
              <span key={p.value} className="chip active">
                {t(p.label)}
              </span>
            ))
          )}
          {!isAdmin && user.permissions.length === 0 && (
            <span className="muted">{t('Aucune permission accordée.')}</span>
          )}
        </div>
      </Card>

      <Button variant="danger" block onClick={doLogout}>
        <LogOut size={17} /> {t('Se déconnecter')}
      </Button>
    </div>
  );
}
