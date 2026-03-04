/**
 * Home Screen — Sprint Command Center
 *
 * Up to 3 simultaneous active sprints.
 * Multiple sprints: horizontal looping carousel with pagination dots.
 *
 * Per-sprint tile:
 *   Header   — label | dates | [✎ note] [⚙ settings]   (buttons belong to THIS sprint)
 *   Day      — big day number + 3px amber progress bar
 *   Rules    — inline checkboxes
 *   NoteRow  — bottom of rules; time-sensitive (evening = amber tint)
 *   Modals   — settings, daily note, alert dialog (all self-contained per tile)
 *
 * TopBar (global):
 *   amber dot | [+ Sprint if <3 active] | avatar
 */

import { AlertDialog, Avatar, Button, Checkbox, Text } from '@/components/ui';
import { useDailyEntry, useSaveCheck, useSaveEntry, useTodayChecks } from '@/hooks/use-daily-queries';
import { useSprintRules } from '@/hooks/use-rule-queries';
import {
    useAbandonSprint,
    useActiveSprints,
    useCompleteSprint,
    useFinishCalibration,
} from '@/hooks/use-sprint-queries';
import { getTodayDate } from '@/lib/daily-check-service';
import { canModifyRules, getSprintDayNumber } from '@/lib/sprint-service';
import { syncAll } from '@/lib/sync-service';
import { useAuthStore } from '@/stores/auth-store';
import { useTheme } from '@/theme';
import type { Database } from '@/types/database';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SprintRow = Database['public']['Tables']['sprints']['Row'];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Home Screen ─────────────────────────────────

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const { data: activeSprints = [], isLoading } = useActiveSprints();
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      {/* Global top bar */}
      <View style={styles.topBar}>
        <View style={[styles.accentDot, { backgroundColor: colors.primary }]} />
        <View style={styles.topBarRight}>
          {!isLoading && activeSprints.length > 0 && activeSprints.length < 3 ? (
            <Pressable
              onPress={() => router.push('/(protected)/create-sprint')}
              hitSlop={12}
              style={({ pressed }) => [
                styles.addBtn,
                { borderColor: colors.border },
                pressed && { opacity: 0.5 },
              ]}
            >
              <Text variant="small" color={colors.textMuted}>
                + Sprint
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => router.push('/(protected)/profile')}
            hitSlop={12}
            style={({ pressed }) => pressed && { opacity: 0.7 }}
          >
            <Avatar name={displayName} size="sm" />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centered}>
          <Text variant="bodyMedium" color={colors.textMuted}>
            Loading…
          </Text>
        </View>
      ) : activeSprints.length > 0 ? (
        <SprintCarousel sprints={activeSprints} />
      ) : (
        <EmptyState />
      )}
    </View>
  );
}

// ─── Sprint Carousel ──────────────────────────────

function SprintCarousel({ sprints }: { sprints: SprintRow[] }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const [realIndex, setRealIndex] = useState(0);
  const flatListRef = useRef<FlatList<SprintRow>>(null);

  // Wrap with sentinel items for infinite loop: [last, ...all, first]
  const loopData = useMemo(() => {
    if (sprints.length <= 1) return sprints;
    return [sprints[sprints.length - 1], ...sprints, sprints[0]];
  }, [sprints]);

  const handleMomentumScrollEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      if (sprints.length <= 1) return;
      const x = e.nativeEvent.contentOffset.x;
      const pageIndex = Math.round(x / SCREEN_WIDTH);
      const n = sprints.length;

      if (pageIndex === 0) {
        // At before-first sentinel → jump to real last
        flatListRef.current?.scrollToIndex({ index: n, animated: false });
        setRealIndex(n - 1);
      } else if (pageIndex === n + 1) {
        // At after-last sentinel → jump to real first
        flatListRef.current?.scrollToIndex({ index: 1, animated: false });
        setRealIndex(0);
      } else {
        setRealIndex(pageIndex - 1);
      }
    },
    [sprints.length],
  );

  if (sprints.length === 1) {
    return (
      <View style={{ flex: 1 }}>
        <SprintTile sprint={sprints[0]} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        data={loopData}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={1}
        getItemLayout={(_, i) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * i,
          index: i,
        })}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
            <SprintTile sprint={item} />
          </View>
        )}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        decelerationRate="fast"
        style={{ flex: 1 }}
      />
      {/* Pagination dots */}
      <View style={styles.dotsRow}>
        {sprints.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === realIndex ? colors.primary : colors.border,
                width: i === realIndex ? 18 : 6,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Sprint Tile ──────────────────────────────────

function SprintTile({ sprint }: { sprint: SprintRow }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: rules } = useSprintRules(sprint.id);
  const { data: existingChecks } = useTodayChecks(sprint.id);
  const saveCheckMutation = useSaveCheck(sprint.id);
  const { theme } = useTheme();
  const colors = theme.colors;

  const dayNumber = getSprintDayNumber(sprint);
  const isCalibration = canModifyRules(sprint);
  const isLastDay = dayNumber >= sprint.duration_days;
  const today = getTodayDate();
  const isEvening = new Date().getHours() >= 18;

  const abandonMutation = useAbandonSprint();
  const completeMutation = useCompleteSprint();
  const calibrationMutation = useFinishCalibration();

  const [showSettings, setShowSettings] = useState(false);
  const [showNote, setShowNote] = useState(false);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmLabel: string;
    confirmDestructive?: boolean;
  }>({ visible: false, title: '', message: '', onConfirm: () => {}, confirmLabel: '' });

  const showAlert = (
    title: string,
    message: string,
    confirmLabel: string,
    onConfirm: () => void,
    confirmDestructive = false,
  ) =>
    setAlertConfig({
      visible: true,
      title,
      message,
      onConfirm,
      confirmLabel,
      confirmDestructive,
    });

  const dismissAlert = () => setAlertConfig((prev) => ({ ...prev, visible: false }));

  const [checkStates, setCheckStates] = useState<
    Record<string, { completed: boolean; value: number | null }>
  >({});

  const getCheckState = useCallback(
    (ruleId: string) => {
      if (checkStates[ruleId]) return checkStates[ruleId];
      const existing = existingChecks?.find((c) => c.rule_id === ruleId);
      if (existing) return { completed: existing.completed, value: existing.value };
      return { completed: false, value: null };
    },
    [checkStates, existingChecks],
  );

  const toggleRule = (ruleId: string) => {
    const current = getCheckState(ruleId);
    const newState = { completed: !current.completed, value: current.value };
    setCheckStates((prev) => ({ ...prev, [ruleId]: newState }));
    if (user) {
      saveCheckMutation.mutate({
        rule_id: ruleId,
        user_id: user.id,
        day_number: dayNumber,
        date: today,
        completed: newState.completed,
        value: newState.value,
      });
    }
  };

  const handleLockRules = () => {
    setShowSettings(false);
    showAlert(
      'Lock Rules',
      "Rules will be locked for the rest of this sprint. You won't be able to add or remove rules after this.",
      'Lock',
      () => calibrationMutation.mutate(sprint.id),
    );
  };

  const handleAbandon = () => {
    setShowSettings(false);
    showAlert(
      'Abandon Sprint',
      'This sprint will be marked as abandoned. This cannot be undone.',
      'Abandon',
      () => abandonMutation.mutate(sprint.id),
      true,
    );
  };

  const handleComplete = () => {
    setShowSettings(false);
    showAlert(
      'Complete Sprint',
      'Mark this sprint as completed? Well done.',
      'Complete',
      () => completeMutation.mutate(sprint.id),
    );
  };

  const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const progressFraction = Math.min(dayNumber / sprint.duration_days, 1);

  return (
    <ScrollView
      style={styles.tileScroll}
      contentContainerStyle={[
        styles.tileContent,
        { paddingBottom: 48 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Sprint tile header: title + action buttons on same row */}
      <View style={styles.tileHeader}>
        <View style={styles.tileHeaderLeft}>
          {sprint.title ? (
            <Text variant="label" color={colors.primary} style={styles.sprintLabel}>
              {sprint.title.toUpperCase()}
            </Text>
          ) : (
            <Text variant="label" color={colors.textMuted} style={styles.sprintLabel}>
              ACTIVE SPRINT
            </Text>
          )}
          <Text variant="caption" color={colors.textMuted} style={{ opacity: 0.6 }}>
            {formatDateShort(sprint.start_date)} — {formatDateShort(sprint.end_date)}
          </Text>
        </View>
        {/* These buttons sit next to the sprint label — clearly belonging to this tile */}
        <View style={styles.tileHeaderActions}>
          <Pressable
            onPress={() => setShowNote(true)}
            hitSlop={12}
            style={({ pressed }) => [styles.tileIconBtn, pressed && { opacity: 0.5 }]}
          >
            <Text variant="body" color={colors.textMuted}>✎</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowSettings(true)}
            hitSlop={12}
            style={({ pressed }) => [styles.tileIconBtn, pressed && { opacity: 0.5 }]}
          >
            <Text variant="body" color={colors.textMuted}>⚙</Text>
          </Pressable>
        </View>
      </View>

      {/* Day number + progress bar */}
      <View style={styles.daySection}>
        <View style={styles.dayRow}>
          <Text variant="display" style={[styles.dayNumber, { color: colors.text }]}>
            {Math.min(dayNumber, sprint.duration_days)}
          </Text>
          <Text variant="h3" color={colors.textMuted} style={styles.dayTotal}>
            /{sprint.duration_days}
          </Text>
          <Text variant="small" color={colors.textMuted} style={styles.dayLabel}>
            days
          </Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${progressFraction * 100}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Calibration banner */}
      {isCalibration ? (
        <View
          style={[
            styles.calibrationBanner,
            { backgroundColor: colors.warningBg, borderRadius: theme.radius.md },
          ]}
        >
          <Text variant="small" color={colors.warning} style={{ flex: 1 }}>
            Day 1 — add, drop or adjust rules. Tap ⚙ to manage.
          </Text>
          <Pressable onPress={handleLockRules} hitSlop={8}>
            <Text variant="smallMedium" color={colors.warning} style={styles.lockLink}>
              Lock →
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* Rules checklist */}
      <View style={styles.section}>
        <Text variant="label" color={colors.textMuted} style={styles.sectionLabel}>
          TODAY
        </Text>
        {rules && rules.length > 0 ? (
          rules.map((rule) => {
            const state = getCheckState(rule.id);
            return (
              <Pressable
                key={rule.id}
                style={[styles.ruleRow, { borderBottomColor: colors.border }]}
                onPress={() => toggleRule(rule.id)}
              >
                <Checkbox checked={state.completed} onToggle={() => toggleRule(rule.id)} />
                <View style={styles.ruleContent}>
                  <Text
                    variant="bodyMedium"
                    style={
                      state.completed
                        ? { opacity: 0.4, textDecorationLine: 'line-through' }
                        : undefined
                    }
                  >
                    {rule.title}
                  </Text>
                  {rule.type === 'numeric' && rule.target_value ? (
                    <Text variant="caption" color={colors.textMuted}>
                      Target: {rule.target_value}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })
        ) : (
          <Text variant="body" color={colors.textMuted} style={{ opacity: 0.5 }}>
            No rules yet. Tap ⚙ to add rules.
          </Text>
        )}

        {/* Note row — below rules, time-sensitive in the evening */}
        <NoteRow
          sprintId={sprint.id}
          dayNumber={dayNumber}
          isEvening={isEvening}
          onOpen={() => setShowNote(true)}
        />
      </View>

      {/* Settings modal (per-tile) */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        isCalibration={isCalibration}
        isLastDay={isLastDay}
        ruleCount={rules?.length ?? 0}
        onAddRule={() => {
          setShowSettings(false);
          router.push({
            pathname: '/(protected)/add-rule',
            params: { sprintId: sprint.id },
          });
        }}
        onLockRules={handleLockRules}
        onComplete={handleComplete}
        onAbandon={handleAbandon}
      />

      {/* Daily note modal (per-tile) */}
      <DailyNoteModal
        visible={showNote}
        onClose={() => setShowNote(false)}
        sprintId={sprint.id}
        dayNumber={dayNumber}
      />

      {/* Custom alert (per-tile) */}
      <AlertDialog
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={[
          { label: 'Cancel', style: 'cancel', onPress: dismissAlert },
          {
            label: alertConfig.confirmLabel,
            style: alertConfig.confirmDestructive ? 'destructive' : 'default',
            onPress: () => {
              dismissAlert();
              alertConfig.onConfirm();
            },
          },
        ]}
      />
    </ScrollView>
  );
}

// ─── Note Row ─────────────────────────────────────

function NoteRow({
  sprintId,
  dayNumber,
  isEvening,
  onOpen,
}: {
  sprintId: string;
  dayNumber: number;
  isEvening: boolean;
  onOpen: () => void;
}) {
  const { data: existingEntry } = useDailyEntry(sprintId, dayNumber);
  const { theme } = useTheme();
  const colors = theme.colors;

  const hasNote = !!existingEntry?.content;
  const preview = hasNote
    ? existingEntry!.content.length > 65
      ? existingEntry!.content.slice(0, 65) + '…'
      : existingEntry!.content
    : null;

  const showEveningGlow = isEvening && !hasNote;

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [
        styles.noteRow,
        {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          backgroundColor: showEveningGlow ? colors.warningBg : 'transparent',
          borderRadius: showEveningGlow ? theme.radius.sm : 0,
          marginTop: showEveningGlow ? 4 : 0,
        },
        pressed && { opacity: 0.6 },
      ]}
    >
      <View style={styles.noteRowContent}>
        {hasNote ? (
          <Text variant="caption" color={colors.textSecondary} style={styles.notePreview}>
            {preview}
          </Text>
        ) : (
          <Text variant="caption" color={showEveningGlow ? colors.warning : colors.textMuted}>
            {showEveningGlow ? 'How was today? Write one line.' : 'Add a note for today…'}
          </Text>
        )}
      </View>
      <Text
        variant="caption"
        color={showEveningGlow ? colors.warning : colors.textMuted}
      >
        ✎
      </Text>
    </Pressable>
  );
}

// ─── Settings Modal ───────────────────────────────

function SettingsModal({
  visible,
  onClose,
  isCalibration,
  isLastDay,
  ruleCount,
  onAddRule,
  onLockRules,
  onComplete,
  onAbandon,
}: {
  visible: boolean;
  onClose: () => void;
  isCalibration: boolean;
  isLastDay: boolean;
  ruleCount: number;
  onAddRule: () => void;
  onLockRules: () => void;
  onComplete: () => void;
  onAbandon: () => void;
}) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();

  const rows = [
    {
      label: 'Add Rule',
      sublabel: `${ruleCount}/3 rules added`,
      onPress: onAddRule,
      destructive: false,
      show: isCalibration && ruleCount < 3,
    },
    {
      label: 'Lock Rules Now',
      sublabel: 'Prevent further rule changes',
      onPress: onLockRules,
      destructive: false,
      show: isCalibration,
    },
    {
      label: 'Complete Sprint',
      sublabel: 'Mark as finished — well done',
      onPress: onComplete,
      destructive: false,
      show: isLastDay,
    },
    {
      label: 'Abandon Sprint',
      sublabel: 'End early — cannot be undone',
      onPress: onAbandon,
      destructive: true,
      show: true,
    },
  ].filter((r) => r.show);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.sheetOverlay} onPress={onClose}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.bgCard,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <Text variant="label" color={colors.textMuted} style={styles.sheetTitle}>
            SPRINT SETTINGS
          </Text>
          {rows.map((row, i) => (
            <Pressable
              key={row.label}
              style={({ pressed }) => [
                styles.sheetRow,
                i > 0 && {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: colors.border,
                },
                pressed && { opacity: 0.55 },
              ]}
              onPress={row.onPress}
            >
              <Text
                variant="bodyMedium"
                style={{ color: row.destructive ? colors.error : colors.text }}
              >
                {row.label}
              </Text>
              {row.sublabel ? (
                <Text variant="caption" color={colors.textMuted}>
                  {row.sublabel}
                </Text>
              ) : null}
            </Pressable>
          ))}
          <Pressable
            style={({ pressed }) => [
              styles.sheetCancel,
              { borderColor: colors.border, borderRadius: theme.radius.md },
              pressed && { opacity: 0.6 },
            ]}
            onPress={onClose}
          >
            <Text variant="bodySemibold" color={colors.textSecondary}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Daily Note Modal ─────────────────────────────

function DailyNoteModal({
  visible,
  onClose,
  sprintId,
  dayNumber,
}: {
  visible: boolean;
  onClose: () => void;
  sprintId: string;
  dayNumber: number;
}) {
  const user = useAuthStore((s) => s.user);
  const { data: existingEntry } = useDailyEntry(sprintId, dayNumber);
  const saveEntryMutation = useSaveEntry(sprintId);
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const today = getTodayDate();

  const [content, setContent] = useState('');

  React.useEffect(() => {
    if (existingEntry?.content) {
      setContent(existingEntry.content);
    }
  }, [existingEntry]);

  React.useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [visible]);

  const isSynced = existingEntry?.synced === true;

  const handleSave = () => {
    if (!user || !content.trim()) {
      onClose();
      return;
    }
    saveEntryMutation.mutate({
      user_id: user.id,
      day_number: dayNumber,
      date: today,
      content: content.trim(),
    });
    syncAll().catch(() => {});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.sheetOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={[
            styles.noteSheet,
            {
              backgroundColor: colors.bgCard,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <View style={styles.noteHeader}>
            <View>
              <Text variant="label" color={colors.textMuted}>
                TODAY'S NOTE
              </Text>
              <Text
                variant="caption"
                color={colors.textMuted}
                style={{ opacity: 0.5, marginTop: 2 }}
              >
                Day {dayNumber}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => pressed && { opacity: 0.5 }}
            >
              <Text variant="body" color={colors.textMuted}>✕</Text>
            </Pressable>
          </View>
          <View
            style={[
              styles.noteInputWrapper,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
                borderRadius: theme.radius.md,
              },
              isSynced && { opacity: 0.6 },
            ]}
          >
            <TextInput
              ref={inputRef}
              style={[
                styles.noteInput,
                {
                  color: colors.text,
                  fontFamily: theme.typography.body.fontFamily,
                  fontSize: theme.typography.body.fontSize,
                },
              ]}
              placeholder="One honest line about today…"
              placeholderTextColor={colors.textMuted}
              value={content}
              onChangeText={setContent}
              editable={!isSynced}
              maxLength={280}
              multiline
            />
          </View>
          <View style={styles.noteFooter}>
            <Text variant="caption" color={colors.textMuted}>
              {content.length}/280
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.saveBtn,
                { backgroundColor: colors.primary, borderRadius: theme.radius.md },
                (pressed || isSynced) && { opacity: 0.7 },
              ]}
              onPress={handleSave}
              disabled={isSynced}
            >
              <Text variant="smallMedium" style={{ color: '#fff' }}>
                {isSynced ? 'Saved' : 'Save'}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Empty State ──────────────────────────────────

function EmptyState() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.emptyState, { paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.emptyContent}>
        <View style={[styles.emptySlash, { backgroundColor: colors.primary }]} />
        <Text
          variant="display"
          style={[styles.emptyHeadline, { color: colors.text, fontSize: 36, lineHeight: 40 }]}
        >
          Ready?
        </Text>
        <Text variant="body" color={colors.textSecondary} style={styles.emptyBody}>
          Start a sprint. Set up to 3 rules.{'\n'}Execute daily.
        </Text>
      </View>
      <View style={styles.emptyActions}>
        <Button
          label="Start a Sprint"
          variant="primary"
          size="lg"
          onPress={() => router.push('/(protected)/create-sprint')}
        />
        <Pressable
          onPress={() => router.push('/(protected)/history')}
          hitSlop={8}
          style={({ pressed }) => pressed && { opacity: 0.6 }}
        >
          <Text variant="small" color={colors.textMuted} center>
            View past sprints
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────

const styles = StyleSheet.create({
  // Root
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 20,
  },
  accentDot: { width: 8, height: 8, borderRadius: 4 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  addBtn: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  // Carousel
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 16,
    paddingTop: 8,
  },
  dot: { height: 6, borderRadius: 3 },
  // Tile
  tileScroll: { flex: 1 },
  tileContent: { paddingHorizontal: 20 },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  tileHeaderLeft: { flex: 1, gap: 4 },
  tileHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingLeft: 12,
    paddingTop: 2,
  },
  tileIconBtn: { width: 28, alignItems: 'center' },
  sprintLabel: { letterSpacing: 1.5 },
  // Day section
  daySection: { marginBottom: 28 },
  dayRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 14 },
  dayNumber: { fontSize: 56, lineHeight: 60, letterSpacing: -2 },
  dayTotal: { marginBottom: 8, opacity: 0.5 },
  dayLabel: { marginBottom: 9, opacity: 0.4, marginLeft: 2 },
  progressTrack: { height: 3, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 3, borderRadius: 2 },
  // Banner
  calibrationBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    gap: 12,
  },
  lockLink: { textDecorationLine: 'underline' },
  // Section
  section: { marginBottom: 28 },
  sectionLabel: { letterSpacing: 2, marginBottom: 12 },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  ruleContent: { flex: 1, gap: 2 },
  // Note row (inline at bottom of rules)
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 10,
  },
  noteRowContent: { flex: 1 },
  notePreview: { lineHeight: 18 },
  // Sheet
  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, paddingHorizontal: 20 },
  sheetHandle: { width: 36, height: 3, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  sheetTitle: { letterSpacing: 1.5, marginBottom: 8, paddingHorizontal: 4 },
  sheetRow: { paddingVertical: 16, paddingHorizontal: 4, gap: 2 },
  sheetCancel: {
    height: 50,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  // Note modal
  noteSheet: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, paddingHorizontal: 20 },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  noteInputWrapper: { borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, minHeight: 110 },
  noteInput: { textAlignVertical: 'top', padding: 0, lineHeight: 24 },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 10 },
  // Empty state
  emptyState: { flex: 1, justifyContent: 'center', gap: 48, paddingHorizontal: 20, paddingTop: 40 },
  emptyContent: { gap: 12 },
  emptySlash: { width: 3, height: 32, borderRadius: 2, marginBottom: 8 },
  emptyHeadline: { marginBottom: 4 },
  emptyBody: { lineHeight: 26, opacity: 0.8 },
  emptyActions: { gap: 16 },
});
