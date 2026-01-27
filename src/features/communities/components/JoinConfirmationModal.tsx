import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { communitiesApi } from '../api/communitiesApi';
import { Community } from '../types';
import {
  parseCommunityError,
  getErrorTitle,
  getErrorMessage,
  CommunityErrorCode,
} from '../utils/communitiesErrorUtils';

interface JoinConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  community: Community | null;
  onJoinSuccess: () => void;
}

export function JoinConfirmationModal({
  visible,
  onClose,
  community,
  onJoinSuccess,
}: JoinConfirmationModalProps) {
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    if (!community) return;

    try {
      setIsJoining(true);
      await communitiesApi.joinCommunityById(community.id);

      Toast.show({
        type: 'success',
        text1: 'Joined Community',
        text2: `You are now a member of ${community.name}`,
      });

      onJoinSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error joining community:', error);

      // Parse the error using centralized utility
      const parsedError = parseCommunityError(error);

      if (parsedError.code === CommunityErrorCode.ALREADY_MEMBER) {
        // Show toast for "already a member" case
        Toast.show({
          type: 'info',
          text1: getErrorTitle(parsedError.code),
          text2: getErrorMessage(parsedError.code, community.name),
          visibilityTime: 3000,
        });
        // Close after brief delay so user sees the message
        setTimeout(() => {
          onClose();
        }, 1500);
      } else if (parsedError.code === CommunityErrorCode.NOT_FOUND) {
        // Show alert for "not found" case
        Alert.alert(
          getErrorTitle(parsedError.code),
          getErrorMessage(parsedError.code),
          [{ text: 'OK', onPress: onClose }]
        );
      } else {
        // Show alert with retry option for other errors
        Alert.alert(
          getErrorTitle(parsedError.code),
          getErrorMessage(parsedError.code),
          [
            { text: 'Cancel', style: 'cancel', onPress: onClose },
            { text: 'Retry', onPress: handleJoin },
          ]
        );
      }
    } finally {
      setIsJoining(false);
    }
  };

  if (!community) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons name="people" size={48} color="#007AFF" />
          </View>

          <Text style={styles.title}>Join Community?</Text>

          <View style={styles.communityInfo}>
            <Text style={styles.communityName}>{community.name}</Text>
          </View>

          <Text style={styles.message}>
            You&apos;ll be able to discover and borrow books from members of this
            community.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.joinButton, isJoining && styles.buttonDisabled]}
              onPress={handleJoin}
              disabled={isJoining}
            >
              {isJoining ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.joinButtonText}>Join Community</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isJoining}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  communityInfo: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  communityName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: {
    gap: 12,
  },
  joinButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
});
