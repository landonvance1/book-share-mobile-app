import React, { useRef, useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';
import { generateQRCodeData } from '../utils/qrCodeUtils';

interface QRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  communityId: number;
  communityName: string;
}

export function QRCodeModal({
  visible,
  onClose,
  communityId,
  communityName,
}: QRCodeModalProps) {
  const qrViewRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);

  const qrData = useMemo(
    () => (Number.isInteger(communityId) && communityId > 0 ? generateQRCodeData(communityId) : null),
    [communityId]
  );

  if (!qrData) {
    return null;
  }

  const handleShare = async () => {
    try {
      setIsSharing(true);

      // Check if sharing is available on this device
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      // Capture the QR code view as an image
      if (!qrViewRef.current) {
        throw new Error('QR view reference not available');
      }

      const uri = await captureRef(qrViewRef, {
        format: 'png',
        quality: 1,
      });

      // Share the captured image
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `Share ${communityName} QR Code`,
      });
    } catch (error) {
      console.error('Error sharing QR code:', error);
      Alert.alert(
        'Error',
        'Failed to share QR code. Please try again.'
      );
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessible={true}
      accessibilityLabel={`QR code for ${communityName}`}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{communityName}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              disabled={isSharing}
              accessibilityRole="button"
              accessibilityLabel="Close QR code modal"
              accessibilityHint="Closes the QR code display"
            >
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Scan this code to join the community
          </Text>

          <View
            style={styles.qrContainer}
            ref={qrViewRef}
            collapsable={false}
            accessible={true}
            accessibilityLabel={`QR code for ${communityName} community`}
            accessibilityHint="QR code that others can scan to join this community"
          >
            <View style={styles.qrCodeWrapper}>
              <QRCode value={qrData} size={250} />
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.shareButton, isSharing && styles.buttonDisabled]}
              onPress={handleShare}
              disabled={isSharing}
              accessibilityRole="button"
              accessibilityLabel="Share QR code"
              accessibilityHint="Opens share options to save or send the QR code image"
              accessibilityState={{ disabled: isSharing }}
            >
              {isSharing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="share-outline" size={20} color="#fff" />
                  <Text style={styles.shareButtonText}>Share QR Code</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isSharing}
              accessibilityRole="button"
              accessibilityLabel="Close"
              accessibilityHint="Closes the QR code modal"
            >
              <Text style={styles.cancelButtonText}>Close</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrCodeWrapper: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  actions: {
    gap: 12,
  },
  shareButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  shareButtonText: {
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
