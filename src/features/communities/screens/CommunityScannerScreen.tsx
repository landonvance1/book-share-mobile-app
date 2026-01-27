import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, Camera, BarcodeScanningResult } from 'expo-camera';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CommunitiesStackParamList } from '../CommunitiesStack';
import { parseQRCode } from '../utils/qrCodeUtils';
import { communitiesApi } from '../api/communitiesApi';
import { Community } from '../types';
import { JoinConfirmationModal } from '../components/JoinConfirmationModal';
import {
  parseCommunityError,
  getErrorTitle,
  getErrorMessage,
  CommunityErrorCode,
} from '../utils/communitiesErrorUtils';

type CommunityScannerNavigationProp = StackNavigationProp<
  CommunitiesStackParamList,
  'CommunityScanner'
>;

export default function CommunityScannerScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [scannedCommunity, setScannedCommunity] = useState<Community | null>(null);
  const isProcessingRef = useRef(false);
  const navigation = useNavigation<CommunityScannerNavigationProp>();

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  // Reset scanner state when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      isProcessingRef.current = false;
      setScanned(false);
      setLoading(false);
      setShowConfirmation(false);
      setScannedCommunity(null);
    }, [])
  );

  const handleQRScanned = useCallback(
    async ({ data }: BarcodeScanningResult) => {
      // Double-check the flag and data at the start
      if (isProcessingRef.current || !data) {
        return;
      }

      isProcessingRef.current = true;
      setScanned(true);
      setLoading(true);

      try {
      // Parse and validate QR code
      const parsed = parseQRCode(data);

      if (!parsed) {
        throw new Error('INVALID_FORMAT');
      }

      // Fetch community details
      const community = await communitiesApi.getCommunityById(parsed.communityId);

      if (!community) {
        throw new Error('COMMUNITY_NOT_FOUND');
      }

      // Show confirmation modal (membership check happens during join attempt)
      setScannedCommunity(community);
      setShowConfirmation(true);
      setLoading(false);
    } catch (error: any) {
      console.error('Error processing QR code:', error);
      setLoading(false);

      // Handle INVALID_FORMAT error from parseQRCode
      if (error.message === 'INVALID_FORMAT') {
        Alert.alert(
          getErrorTitle(CommunityErrorCode.INVALID_QR),
          getErrorMessage(CommunityErrorCode.INVALID_QR),
          [
            {
              text: 'Try Again',
              onPress: resetScanner,
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => navigation.goBack(),
            },
          ]
        );
        return;
      }

      // Parse other errors from API
      const parsedError = parseCommunityError(error);
      const title = getErrorTitle(parsedError.code);
      const message = getErrorMessage(parsedError.code);

      Alert.alert(title, message, [
        {
          text: 'Try Again',
          onPress: resetScanner,
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => navigation.goBack(),
        },
      ]);
    }
    },
    [navigation]
  );

  const resetScanner = () => {
    isProcessingRef.current = false;
    setScanned(false);
    setLoading(false);
    setShowConfirmation(false);
    setScannedCommunity(null);
  };

  const handleJoinSuccess = () => {
    // Navigate back to communities list
    navigation.goBack();
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    resetScanner();
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
        <Text style={styles.permissionText}>
          Please enable camera access in your device settings to scan QR codes.
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned || loading ? undefined : handleQRScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        enableTorch={false}
        autofocus="on"
      />

      {/* Overlay content with absolute positioning */}
      <View style={styles.overlay}>
        <View
          style={styles.scanArea}
          accessible={true}
          accessibilityLabel="QR code scanner frame"
          accessibilityHint="Position a BookSharing community QR code within this highlighted area to scan"
        >
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
        </View>

        <Text style={styles.instructions}>
          Scan a community QR code to join
        </Text>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading community...</Text>
          </View>
        )}

        {scanned && !loading && !showConfirmation && (
          <TouchableOpacity
            style={styles.rescanButton}
            onPress={resetScanner}
            accessibilityRole="button"
            accessibilityLabel="Scan again"
            accessibilityHint="Resets the scanner to scan another QR code"
          >
            <Text style={styles.rescanText}>Tap to Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Cancel scanning"
          accessibilityHint="Returns to the communities screen"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <JoinConfirmationModal
        visible={showConfirmation}
        onClose={handleCloseConfirmation}
        community={scannedCommunity}
        onJoinSuccess={handleJoinSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
  },
  cornerTopLeft: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 20,
    height: 20,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#007AFF',
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#007AFF',
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 20,
    height: 20,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#007AFF',
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#007AFF',
    borderBottomRightRadius: 12,
  },
  instructions: {
    position: 'absolute',
    bottom: 150,
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 200,
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  rescanButton: {
    position: 'absolute',
    bottom: 200,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  rescanText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cancelButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
