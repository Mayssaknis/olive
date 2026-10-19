import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clientsApi } from '../api/services';
import { Client } from '../types';
import { Button, TextField } from '../components/Form';
import { Card } from '../components/UI';
import { ErrorState, LoadingView } from '../components/Feedback';
import { errorMessage } from '../api/client';
import { useToast } from '../components/Toast';
import { useI18n } from '../i18n';

const PHONE_RE = /^[0-9+\s]{6,}$/;

export default function ClientFormScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const editing = !!id;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(editing);

  useEffect(() => {
    if (!editing) return;
    clientsApi
      .get(Number(id))
      .then((c: Client) => {
        setFirstName(c.firstName);
        setLastName(c.lastName);
        setPhone(c.phone);
        setAddress(c.address ?? '');
      })
      .catch((e) => setLoadError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [id, editing]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = t('Le prénom est requis');
    if (!lastName.trim()) errs.lastName = t('Le nom est requis');
    if (!phone.trim()) errs.phone = t('Le téléphone est requis');
    else if (!PHONE_RE.test(phone.trim())) errs.phone = t('Numéro de téléphone invalide');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        address: address.trim() || undefined,
      };
      if (editing) await clientsApi.update(Number(id), payload);
      else await clientsApi.create(payload);
      toast(editing ? t('Client modifié.') : t('Client créé.'), 'success');
      navigate('/clients');
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingView />;
  if (loadError) return <ErrorState message={loadError} />;

  return (
    <div style={{ maxWidth: 560 }}>
      <Card>
        <form onSubmit={submit}>
          <div className="form-row">
            <TextField
              label={t('Prénom')}
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              error={errors.firstName}
              placeholder={t('ex : Ahmed')}
              autoFocus
            />
            <TextField
              label={t('Nom')}
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              error={errors.lastName}
              placeholder={t('ex : El Fassi')}
            />
          </div>
          <TextField
            label={t('Téléphone')}
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
            placeholder={t('ex : +216 12 345 678')}
            inputMode="tel"
          />
          <TextField
            label={t('Adresse (facultatif)')}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <div className="form-actions">
            <Button type="submit" loading={saving}>
              {editing ? t('Enregistrer') : t('Créer le client')}
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
