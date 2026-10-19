import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Square } from 'lucide-react';
import { employeesApi } from '../api/services';
import { Permission, Role } from '../types';
import { ALL_PERMISSIONS } from '../constants/permissions';
import { Button, SelectField, TextField } from '../components/Form';
import { Card, SectionHeader } from '../components/UI';
import { LoadingView } from '../components/Feedback';
import { errorMessage } from '../api/client';
import { useToast } from '../components/Toast';
import { useI18n } from '../i18n';

const ROLES: { value: Role; label: string }[] = [
  { value: 'EMPLOYEE', label: 'Employé' },
  { value: 'ADMIN', label: 'Administrateur' },
];

export default function EmployeeFormScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { t } = useI18n();
  const editing = !!id;

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('EMPLOYEE');
  const [active, setActive] = useState(true);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(editing);

  useEffect(() => {
    if (!editing) return;
    employeesApi
      .list()
      .then((list) => {
        const u = list.find((x) => x.id === Number(id));
        if (u) {
          setUsername(u.username);
          setFullName(u.fullName);
          setEmail(u.email);
          setPhone(u.phone ?? '');
          setRole(u.role);
          setActive(u.active);
          setPermissions(u.permissions ?? []);
        } else setError(t('Employé introuvable.'));
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [id, editing]);

  const togglePermission = (p: Permission) =>
    setPermissions((ps) => (ps.includes(p) ? ps.filter((x) => x !== p) : [...ps, p]));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setError(t('Le nom complet et l’e-mail sont requis.'));
      return;
    }
    if (!editing && (!username.trim() || password.length < 6)) {
      setError(t('Identifiant requis et mot de passe de 6 caractères minimum.'));
      return;
    }
    setError('');
    setSaving(true);
    try {
      const payload = {
        username: editing ? undefined : username.trim(),
        email: email.trim(),
        password: password || undefined,
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        role,
        permissions: role === 'ADMIN' ? [] : permissions,
        active,
      };
      if (editing) await employeesApi.update(Number(id), payload);
      else await employeesApi.create(payload);
      toast(editing ? t('Employé modifié.') : t('Employé créé.'), 'success');
      navigate('/employes');
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingView />;

  return (
    <div style={{ maxWidth: 640 }}>
      <Card>
        {error && <div className="alert-box">{error}</div>}
        <form onSubmit={submit}>
          {!editing && (
            <TextField
              label={t('Identifiant')}
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          )}
          <TextField
            label={t('Nom complet')}
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <div className="form-row">
            <TextField
              label={t('E-mail')}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label={t('Téléphone')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <TextField
            label={editing ? t('Nouveau mot de passe (facultatif)') : t('Mot de passe')}
            type="password"
            required={!editing}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint={t('6 caractères minimum. Jamais affiché en clair.')}
          />
          <SelectField
            label={t('Rôle')}
            value={role}
            onChange={setRole}
            options={ROLES.map((o) => ({ ...o, label: t(o.label) }))}
          />

          <div className="field">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              {t('Compte actif')}
            </label>
          </div>

          {role === 'EMPLOYEE' && (
            <>
              <SectionHeader title={t('Permissions')} />
              <p className="muted" style={{ marginTop: -6 }}>
                {t("L'administrateur dispose de tous les droits automatiquement.")}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {ALL_PERMISSIONS.map((p) => {
                  const checked = permissions.includes(p.value as Permission);
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => togglePermission(p.value as Permission)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '7px 10px',
                        background: 'var(--cream)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 12.5,
                        fontWeight: 600,
                        textAlign: 'left',
                        color: checked ? 'var(--olive)' : 'var(--text-secondary)',
                      }}
                    >
                      {checked ? <Check size={15} /> : <Square size={15} />}
                      {t(p.label)}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="form-actions">
            <Button type="submit" loading={saving}>
              {editing ? t('Enregistrer') : t('Créer l’employé')}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
              {t('Annuler')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
