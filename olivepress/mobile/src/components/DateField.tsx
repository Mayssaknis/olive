import React, { useMemo, useState } from 'react';
import {
  Modal, Pressable, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { useI18n } from '../i18n';

interface Props {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  clearable?: boolean;
}

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const MONTHS_AR = [
  'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
  'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];
const WEEKDAYS_FR = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const WEEKDAYS_AR = ['ن', 'ث', 'ر', 'خ', 'ج', 'س', 'ح'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function parseIso(value?: string): { year: number; month: number; day: number } | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) - 1, day: Number(m[3]) };
}

function formatFr(value?: string): string {
  const p = parseIso(value);
  if (!p) return '';
  return `${pad(p.day)}/${pad(p.month + 1)}/${p.year}`;
}

export function DateField({
  label, value, onChange, placeholder, error, hint, clearable,
}: Props) {
  const { t, locale } = useI18n();
  const MONTHS = locale === 'ar' ? MONTHS_AR : MONTHS_FR;
  const WEEKDAYS = locale === 'ar' ? WEEKDAYS_AR : WEEKDAYS_FR;
  const [open, setOpen] = useState(false);
  const selected = parseIso(value);
  const today = new Date();

  const [view, setView] = useState(() => {
    const base = selected ?? { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };
    return { year: base.year, month: base.month };
  });

  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const result: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [view]);

  const openPicker = () => {
    const base = selected ?? { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };
    setView({ year: base.year, month: base.month });
    setOpen(true);
  };

  const move = (delta: number) => {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const pick = (day: number) => {
    onChange(toIso(view.year, view.month, day));
    setOpen(false);
  };

  const isSelected = (day: number) =>
    !!selected && selected.year === view.year && selected.month === view.month && selected.day === day;

  const isToday = (day: number) =>
    today.getFullYear() === view.year && today.getMonth() === view.month && today.getDate() === day;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity style={[styles.field, !!error && styles.errorBorder]} onPress={openPicker}>
        <Text style={[styles.value, !selected && styles.placeholder]}>
          {selected ? formatFr(value) : placeholder ?? t('Sélectionner une date')}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
      </TouchableOpacity>
      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => move(-1)} hitSlop={8} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={22} color={colors.olive} />
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>{MONTHS[view.month]} {view.year}</Text>
              <TouchableOpacity onPress={() => move(1)} hitSlop={8} style={styles.navBtn}>
                <Ionicons name="chevron-forward" size={22} color={colors.olive} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS.map((d, i) => (
                <Text key={i} style={styles.weekDay}>{d}</Text>
              ))}
            </View>

            <View style={styles.grid}>
              {cells.map((day, i) => (
                <View key={i} style={styles.cellWrap}>
                  {day ? (
                    <TouchableOpacity
                      style={[styles.cell, isSelected(day) && styles.cellSelected, isToday(day) && !isSelected(day) && styles.cellToday]}
                      onPress={() => pick(day)}
                    >
                      <Text style={[styles.cellText, isSelected(day) && styles.cellTextSelected, isToday(day) && !isSelected(day) && styles.cellTextToday]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </View>

            <View style={styles.actions}>
              {clearable && selected ? (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => {
                    onChange('');
                    setOpen(false);
                  }}
                >
                  <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
                  <Text style={[styles.actionText, { color: colors.danger }]}>{t('Effacer')}</Text>
                </TouchableOpacity>
              ) : <View />}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  const now = new Date();
                  onChange(toIso(now.getFullYear(), now.getMonth(), now.getDate()));
                  setOpen(false);
                }}
              >
                <Ionicons name="today-outline" size={18} color={colors.olive} />
                <Text style={styles.actionText}>{t('Aujourd’hui')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.lg },
  label: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.softGray,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  errorBorder: { borderColor: colors.danger },
  value: { fontSize: 16, color: colors.textPrimary },
  placeholder: { color: colors.textMuted },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  errorText: { fontSize: 12, color: colors.danger, marginTop: 4 },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navBtn: { padding: spacing.xs },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  weekRow: { flexDirection: 'row' },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    paddingVertical: spacing.xs,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cellWrap: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  cellSelected: { backgroundColor: colors.olive },
  cellToday: { borderWidth: 1.5, borderColor: colors.olive },
  cellText: { fontSize: 15, color: colors.textPrimary },
  cellTextSelected: { color: colors.white, fontWeight: '700' },
  cellTextToday: { color: colors.olive, fontWeight: '700' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.softGray,
    paddingTop: spacing.md,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.xs },
  actionText: { fontSize: 14, fontWeight: '600', color: colors.olive },
});
