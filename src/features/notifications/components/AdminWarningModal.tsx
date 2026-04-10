import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Notification } from '../types';
import { useMarkNotificationRead } from '../hooks/useNotifications';

interface AdminWarningModalProps {
  warnings: Notification[];
}

export function AdminWarningModal({ warnings }: AdminWarningModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const markRead = useMarkNotificationRead();

  // Clamp index so external cache updates never leave us out of bounds
  const safeIndex = Math.min(currentIndex, warnings.length - 1);
  const currentWarning = warnings[safeIndex];

  if (!currentWarning) {
    return null;
  }

  const handleAcknowledge = () => {
    markRead.mutate(currentWarning.id, {
      onSuccess: () => {
        setCurrentIndex((prev) => prev + 1);
      },
    });
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={() => {}}
      >
        <View style={styles.card}>
          <Text style={styles.header}>Warning from Admin</Text>
          <Text style={styles.message}>{currentWarning.message.replace(/\\n/g, '\n')}</Text>
          {warnings.length > 1 && (
            <Text style={styles.counter}>
              {safeIndex + 1} of {warnings.length}
            </Text>
          )}
          {markRead.isError && (
            <Text style={styles.errorText}>Failed to dismiss — please try again.</Text>
          )}
          <TouchableOpacity
            style={[styles.button, markRead.isPending && styles.buttonPending]}
            onPress={handleAcknowledge}
            disabled={markRead.isPending}
          >
            {markRead.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>I Understand</Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  header: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D9000D',
  },
  message: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 24,
  },
  counter: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'right',
  },
  errorText: {
    fontSize: 13,
    color: '#D9000D',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonPending: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
