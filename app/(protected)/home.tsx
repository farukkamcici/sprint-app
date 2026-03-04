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
import { ArrowRight, ChevronLeft, ChevronRight, Pencil, Plus, Settings as SettingsIcon, X } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Keyboard,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View
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
        <Pressable
          onPress={() => router.push('/(protected)/profile')}
          hitSlop={12}
          style={({ pressed }) => pressed && { opacity: 0.7 }}
        >
          <Avatar name={displayName} size="sm" />
        </Pressable>
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
            <Plus size={11} color={colors.textMuted} />
            <Text variant="small" color={colors.textMuted}>Sprint</Text>
          </Pressable>
        ) : null}
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
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<SprintRow>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const goTo = useCallback(
    (i: number) => {
      flatListRef.current?.scrollToIndex({ index: i, animated: true });
      setActiveIndex(i);
    },
    [],
  );

  const handleMomentumScrollEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const x = e.nativeEvent.contentOffset.x;
      const index = Math.round(x / SCREEN_WIDTH);
      setActiveIndex(Math.max(0, Math.min(index, sprints.length - 1)));
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
      <SprintDots
        count={sprints.length}
        activeIndex={activeIndex}
        onDotPress={goTo}
        hasPrev={activeIndex > 0}
        hasNext={activeIndex < sprints.length - 1}
        onPrev={() => goTo(activeIndex - 1)}
        onNext={() => goTo(activeIndex + 1)}
      />
      <Animated.FlatList
        ref={flatListRef as React.RefObject<FlatList<SprintRow>>}
        data={sprints}
        horizontal
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="start"
        decelerationRate={0.88}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, i) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * i,
          index: i,
        })}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        renderItem={({ item, index }) => {
          const inputRange = [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
          ];
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.55, 1, 0.55],
            extrapolate: 'clamp',
          });
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.96, 1, 0.96],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              style={{
                width: SCREEN_WIDTH,
                flex: 1,
                opacity,
                transform: [{ scale }],
              }}
            >
              <SprintTile sprint={item} />
            </Animated.View>
          );
        }}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
      />
    </View>
  );
}

// ─── Sprint Dots ──────────────────────────────────

function SprintDots({
  count,
  activeIndex,
  onDotPress,
  hasPrev = false,
  hasNext = false,
  onPrev,
  onNext,
}: {
  count: number;
  activeIndex: number;
  onDotPress: (i: number) => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <View style={styles.dotsRow}>
      {/* Left arrow */}
      <Pressable
        onPress={onPrev}
        hitSlop={12}
        disabled={!hasPrev}
        style={({ pressed }) => [
          styles.dotsArrow,
          !hasPrev && { opacity: 0 },
          pressed && hasPrev && { opacity: 0.4 },
        ]}
      >
        <ChevronLeft size={14} color={colors.textMuted} />
      </Pressable>

      {/* Dots */}
      <View style={styles.dotsInner}>
        {Array.from({ length: count }).map((_, i) => {
          const isActive = i === activeIndex;
          return (
            <Pressable
              key={i}
              onPress={() => onDotPress(i)}
              hitSlop={10}
              style={({ pressed }) => [
                styles.dot,
                isActive
                  ? { width: 20, backgroundColor: colors.primary }
                  : { width: 6, backgroundColor: colors.border },
                pressed && { opacity: 0.6 },
              ]}
            />
          );
        })}
      </View>

      {/* Right arrow */}
      <Pressable
        onPress={onNext}
        hitSlop={12}
        disabled={!hasNext}
        style={({ pressed }) => [
          styles.dotsArrow,
          !hasNext && { opacity: 0 },
          pressed && hasNext && { opacity: 0.4 },
        ]}
      >
        <ChevronRight size={14} color={colors.textMuted} />
      </Pressable>
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
        { paddingBottom: 140 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Sprint tile header: title + action buttons on same row */}
      <View style={styles.tileHeader}>
        <View style={styles.tileHeaderLeft}>
          {sprint.title ? (
            <Text variant="label" color={colors.primary} style={styles.sprintLabel}>
              {sprint.title}
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
        {/* Only settings button in header — note is opened via NoteRow below */}
        <View style={styles.tileHeaderActions}>
          <Pressable
            onPress={() => setShowSettings(true)}
            hitSlop={12}
            style={({ pressed }) => [styles.tileIconBtn, pressed && { opacity: 0.5 }]}
          >
            <SettingsIcon size={16} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      {/* Day number + progress */}
      <View style={styles.daySection}>
        {/* Typography: big day hero + stacked meta */}
        <View style={styles.dayRow}>
          <Text style={[styles.dayNumber, { color: colors.text }]}>
            {Math.min(dayNumber, sprint.duration_days)}
          </Text>
          <View style={styles.dayMeta}>
            <Text style={[styles.dayOf, { color: colors.textMuted }]}>
              /{sprint.duration_days}
            </Text>
            <Text style={[styles.dayMetaLabel, { color: colors.textMuted }]}>
              {sprint.duration_days - dayNumber > 0
                ? `${sprint.duration_days - dayNumber} days left`
                : 'last day'}
            </Text>
          </View>
        </View>

        {/* Progress: segmented pills for ≤14 days, thick bar for longer */}
        {sprint.duration_days <= 14 ? (
          <View style={styles.segmentRow}>
            {Array.from({ length: sprint.duration_days }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.segment,
                  {
                    backgroundColor: i < dayNumber ? colors.primary : colors.border,
                    opacity: i < dayNumber ? 1 : 0.3,
                  },
                ]}
              />
            ))}
          </View>
        ) : (
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: colors.primary, width: `${progressFraction * 100}%` },
              ]}
            />
          </View>
        )}
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
            Day 1 — add, drop or adjust rules before locking.
          </Text>
          <Pressable
            onPress={handleLockRules}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Text variant="smallMedium" color={colors.warning}>Lock</Text>
            <ArrowRight size={12} color={colors.warning} />
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
            No rules yet. Open settings to add rules.
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
      <Pencil size={14} color={showEveningGlow ? colors.warning : colors.textMuted} />
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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

  React.useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e: { endCoordinates: { height: number } }) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

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
      {/* Backdrop */}
      <Pressable style={styles.sheetOverlay} onPress={onClose} />
      {/* Sheet — manually offset by keyboard height, no KAV needed */}
      <View
        style={[
          styles.noteModalKav,
          { bottom: keyboardHeight },
        ]}
      >
        <View
          style={[
            styles.noteSheet,
            {
              backgroundColor: colors.bgCard,
              borderTopColor: colors.border,
              paddingBottom: keyboardHeight > 0 ? 16 : insets.bottom + 16,
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
              <X size={18} color={colors.textMuted} />
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
      </View>
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
    <View style={[styles.emptyState, { paddingBottom: insets.bottom + 130 }]}>
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
  addBtn: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  // Pagination dots
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 0,
  },
  dotsInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
    justifyContent: 'center',
  },
  dotsArrow: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  // Tile
  tileScroll: { flex: 1 },
  tileContent: { paddingHorizontal: 24, paddingTop: 20 },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  tileHeaderLeft: { flex: 1, gap: 6 },
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
  daySection: { marginBottom: 36 },
  dayRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 20 },
  dayNumber: { fontSize: 72, lineHeight: 76, letterSpacing: -3, fontWeight: '800', fontFamily: 'FunnelDisplay_800ExtraBold' },
  dayMeta: { paddingBottom: 10, gap: 5 },
  dayOf: { fontSize: 24, lineHeight: 26, fontWeight: '300', opacity: 0.45, fontFamily: 'FunnelDisplay_300Light' },
  dayMetaLabel: { fontSize: 11, letterSpacing: 0.8, opacity: 0.4, textTransform: 'uppercase' as const, fontFamily: 'FunnelDisplay_500Medium' },
  segmentRow: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 8, borderRadius: 4 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
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
  sectionLabel: { letterSpacing: 2, marginBottom: 16 },
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
  noteModalKav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
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
