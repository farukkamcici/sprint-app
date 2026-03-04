/**
 * AlertDialog — Custom alert, no device native Alert.
 *
 * Usage:
 *   <AlertDialog
 *     visible={showAlert}
 *     title="Abandon Sprint"
 *     message="This cannot be undone."
 *     buttons={[
 *       { label: 'Cancel', onPress: () => setShowAlert(false) },
 *       { label: 'Abandon', style: 'destructive', onPress: handleAbandon },
 *     ]}
 *   />
 */

import React from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './text';

export interface AlertButton {
  label: string;
  style?: 'default' | 'destructive' | 'cancel';
  onPress: () => void;
}

interface AlertDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
}

export function AlertDialog({ visible, title, message, buttons }: AlertDialogProps) {
  const { theme } = useTheme();
  const colors = theme.colors;

  if (!visible) return null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.dialog,
            {
              backgroundColor: colors.bgElevated ?? colors.bgCard,
              borderColor: colors.border,
              borderRadius: theme.radius.xl ?? theme.radius.lg,
            },
          ]}
        >
          {/* Title */}
          <Text
            variant="h3"
            style={[styles.title, { color: colors.text }]}
          >
            {title}
          </Text>

          {/* Message */}
          {message ? (
            <Text
              variant="body"
              color={colors.textSecondary}
              style={styles.message}
            >
              {message}
            </Text>
          ) : null}

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Buttons */}
          <View style={[
            styles.buttons,
            buttons.length === 2 && styles.buttonsRow,
          ]}>
            {buttons.map((btn, i) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              const textColor = isDestructive
                ? colors.error
                : isCancel
                ? colors.textMuted
                : colors.primary;

              const isLast = i === buttons.length - 1;

              return (
                <Pressable
                  key={btn.label}
                  style={({ pressed }) => [
                    styles.button,
                    buttons.length === 2 && styles.buttonHalf,
                    !isLast && buttons.length > 2 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                    !isLast && buttons.length === 2 && {
                      borderRightWidth: StyleSheet.hairlineWidth,
                      borderRightColor: colors.border,
                    },
                    pressed && { opacity: 0.55 },
                  ]}
                  onPress={btn.onPress}
                >
                  <Text
                    variant={isDestructive || (!isCancel && i === buttons.length - 1) ? 'bodySemibold' : 'body'}
                    style={{ color: textColor }}
                  >
                    {btn.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  dialog: {
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  title: {
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 6,
  },
  message: {
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 18,
    lineHeight: 22,
    opacity: 0.8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  buttons: {
    overflow: 'hidden',
  },
  buttonsRow: {
    flexDirection: 'row',
  },
  button: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonHalf: {
    flex: 1,
  },
});
