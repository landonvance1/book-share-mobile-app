import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LibraryStackParamList } from '../LibraryStack';
import { useCoverAnalysis } from '../hooks/useCoverAnalysis';
import { cropImageToScanArea } from '../../../utils/imageUtils';
import { libraryErrorMessages } from '../utils/libraryErrorUtils';
import { CameraErrorBoundary } from '../components/CameraErrorBoundary';
import { CoverAnalysisResponse } from '../types/coverAnalysis';
import {
  SCAN_AREA_WIDTH,
  SCAN_AREA_HEIGHT,
  SLOW_ANALYSIS_WARNING_SECONDS,
} from '../utils/imageProcessingConfig';
import { Ionicons } from '@expo/vector-icons';

type BookCoverScannerNavigationProp = StackNavigationProp<LibraryStackParamList, 'BookCoverScanner'>;

export default function BookCoverScanner() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [showSlowWarning, setShowSlowWarning] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const abortControllerRef = useRef<AbortController>(new AbortController());
  const navigation = useNavigation<BookCoverScannerNavigationProp>();
  // Measure the actual camera container (excludes header + tab bar)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerWidth = containerSize.width;
  const containerHeight = containerSize.height;

  // Use React Query mutation for cover analysis
  const { mutate: analyzeImage, isPending: analyzing } = useCoverAnalysis();

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();

    // Cleanup when component unmounts
    return () => {
      // Abort any ongoing requests
      abortControllerRef.current.abort();
      // Camera ref cleanup (helps with garbage collection)
      cameraRef.current = null;
    };
  }, []);

  // Show a "still processing" warning after a delay while analyzing
  useEffect(() => {
    if (analyzing) {
      setShowSlowWarning(false);
      const warningTimer = setTimeout(() => {
        setShowSlowWarning(true);
      }, SLOW_ANALYSIS_WARNING_SECONDS * 1000);

      return () => clearTimeout(warningTimer);
    }
    setShowSlowWarning(false);
  }, [analyzing]);

  // Reset state when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setPhotoUri(null);
      setFlashEnabled(false);
      // Create new abort controller for this focus session
      abortControllerRef.current = new AbortController();

      return () => {
        // Abort on blur
        abortControllerRef.current.abort();
      };
    }, [])
  );

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
        skipProcessing: false,
      });

      if (photo?.uri) {
        // Validate the URI is a valid file path (basic check)
        if (typeof photo.uri === 'string' && photo.uri.length > 0) {
          // Crop captured image to match the visible scan area bounding box.
          // The camera captures at a higher resolution than the screen preview,
          // so we scale the scan area dimensions to photo pixel coordinates.
          const scaleX = containerWidth > 0 ? (photo.width ?? containerWidth) / containerWidth : 1;
          const scaleY = containerHeight > 0 ? (photo.height ?? containerHeight) / containerHeight : 1;
          const croppedUri = await cropImageToScanArea(photo.uri, {
            originX: Math.round(((containerWidth - SCAN_AREA_WIDTH) / 2) * scaleX),
            originY: Math.round(((containerHeight - SCAN_AREA_HEIGHT) / 2) * scaleY),
            width: Math.round(SCAN_AREA_WIDTH * scaleX),
            height: Math.round(SCAN_AREA_HEIGHT * scaleY),
          });
          setPhotoUri(croppedUri);
        } else {
          throw new Error('Invalid photo URI received from camera');
        }
      } else {
        throw new Error('Camera did not return a valid photo');
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert(
        'Camera Error',
        error instanceof Error ? error.message : 'Failed to capture photo. Please try again.'
      );
    }
  };

  const retakePhoto = () => {
    setPhotoUri(null);
  };

  // Helper function to navigate to manual search with extracted text
  const navigateToSearchWithExtractedInfo = (extractedText: string) => {
    navigation.navigate('ExternalBookSearch', {
      prefillTitle: extractedText || undefined,
    });
  };

  // Handle analysis result after successful API call
  const handleAnalysisResult = (response: CoverAnalysisResponse) => {
    if (!photoUri) return;

    // Check if analysis was successful
    if (!response.analysis.isSuccess) {
      const errorMsg = response.analysis.errorMessage || libraryErrorMessages.ANALYSIS_FAILED;
      Alert.alert(
        'Analysis Failed',
        errorMsg + '\n\n' + libraryErrorMessages.RETRY_SUGGESTIONS,
        [
          { text: 'Retake', onPress: retakePhoto },
          {
            text: 'Manual Search',
            onPress: () => navigateToSearchWithExtractedInfo(
              response.analysis.extractedText
            ),
          },
        ]
      );
      return;
    }

    // Check if we have matches
    if (response.matchedBooks.length === 0) {
      const detected = response.analysis.extractedText || 'No text detected';
      Alert.alert(
        'No Matches Found',
        `Detected text: "${detected}"\n\n${libraryErrorMessages.ANALYSIS_NO_MATCHES}`,
        [
          { text: 'Retake', onPress: retakePhoto },
          {
            text: 'Manual Search',
            onPress: () => navigateToSearchWithExtractedInfo(
              response.analysis.extractedText
            ),
          },
        ]
      );
      return;
    }

    // Exact match or single match - go directly to confirmation
    const bookToConfirm = response.exactMatch ?? (response.matchedBooks.length === 1 ? response.matchedBooks[0] : null);
    if (bookToConfirm) {
      navigation.navigate('BookConfirmation', {
        book: bookToConfirm,
        capturedCoverUri: photoUri,
        source: 'cover',
      });
      return;
    }

    // Multiple matches - show selection screen
    navigation.navigate('CoverMatchResults', {
      matches: response.matchedBooks,
      capturedPhotoUri: photoUri,
      extractedText: response.analysis.extractedText,
    });
  };

  // Handle analysis errors
  const handleAnalysisError = (error: any) => {
    console.error('Error analyzing cover:', error);

    const isNetworkError = error instanceof Error &&
      (error.message.includes('Failed to analyze') ||
       error.message.includes('connection'));

    const isAuthError = error instanceof Error &&
      error.message.includes('Authentication');

    let errorMessage = libraryErrorMessages.ANALYSIS_FAILED;
    if (isNetworkError) {
      errorMessage = libraryErrorMessages.NETWORK_ERROR;
    } else if (isAuthError) {
      errorMessage = libraryErrorMessages.AUTHENTICATION_FAILED;
    }

    Alert.alert(
      'Analysis Error',
      errorMessage,
      [
        { text: 'Retry', onPress: analyzePhoto },
        { text: 'Cancel', onPress: retakePhoto },
      ]
    );
  };

  const analyzePhoto = async () => {
    if (!photoUri || analyzing) return;

    // The photo was already cropped, resized, and compressed during capture,
    // so we can send it directly without further processing.
    analyzeImage(photoUri, {
      onSuccess: handleAnalysisResult,
      onError: handleAnalysisError,
    });
  };

  const toggleFlash = () => {
    setFlashEnabled((prev) => !prev);
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
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
        <Ionicons name="camera-outline" size={64} color="#999" />
        <Text style={styles.text}>Camera access is needed to scan book covers</Text>
        <Text style={styles.subtext}>Please enable camera permissions in your device settings</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Photo review state
  if (photoUri && !analyzing) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="contain" />

        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={retakePhoto}
            accessible={true}
            accessibilityLabel="Retake photo"
            accessibilityRole="button"
            accessibilityHint="Discards current photo and returns to camera"
          >
            <Ionicons name="close" size={24} color="#fff" />
            <Text style={styles.controlButtonText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.primaryControlButton]}
            onPress={analyzePhoto}
            accessible={true}
            accessibilityLabel="Use this photo"
            accessibilityRole="button"
            accessibilityHint="Sends this photo for book cover analysis"
          >
            <Ionicons name="checkmark" size={24} color="#fff" />
            <Text style={styles.controlButtonText}>Use This Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Analyzing state
  if (analyzing) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photoUri || '' }} style={styles.photoPreview} resizeMode="contain" />
        <View style={styles.analyzingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.analyzingText}>Analyzing cover...</Text>
          <Text style={styles.analyzingSubtext}>(this may take up to 10 seconds)</Text>
          {showSlowWarning && (
            <Text style={styles.slowWarningText}>
              Still processing... If this takes much longer, please try again.
            </Text>
          )}
        </View>
      </View>
    );
  }

  // Camera preview state
  return (
    <CameraErrorBoundary onRetry={() => navigation.goBack()}>
      <View
        style={styles.container}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setContainerSize({ width, height });
        }}
      >
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          enableTorch={flashEnabled}
          autofocus="on"
        />

        {/* Dark overlay strips — surround but do not cover the scan area */}
        {/* Top strip */}
        <View style={[styles.overlayStrip, { top: 0, left: 0, right: 0, height: (containerHeight - SCAN_AREA_HEIGHT) / 2 }]} />
        {/* Bottom strip */}
        <View style={[styles.overlayStrip, { bottom: 0, left: 0, right: 0, height: (containerHeight - SCAN_AREA_HEIGHT) / 2 }]} />
        {/* Left strip (fills the gap between top/bottom strips) */}
        <View style={[styles.overlayStrip, {
          top: (containerHeight - SCAN_AREA_HEIGHT) / 2,
          left: 0,
          width: (containerWidth - SCAN_AREA_WIDTH) / 2,
          height: SCAN_AREA_HEIGHT,
        }]} />
        {/* Right strip */}
        <View style={[styles.overlayStrip, {
          top: (containerHeight - SCAN_AREA_HEIGHT) / 2,
          right: 0,
          width: (containerWidth - SCAN_AREA_WIDTH) / 2,
          height: SCAN_AREA_HEIGHT,
        }]} />

        {/* Scan area corner markers */}
        <View style={[styles.scanArea, {
          top: (containerHeight - SCAN_AREA_HEIGHT) / 2,
          left: (containerWidth - SCAN_AREA_WIDTH) / 2,
        }]}>
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
        </View>

        <Text style={styles.instructions}>Position the book cover in frame</Text>

        {/* Top controls */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={toggleFlash}
            accessible={true}
            accessibilityLabel={flashEnabled ? 'Turn off flash' : 'Turn on flash'}
            accessibilityRole="button"
            accessibilityHint="Toggles the camera flash on or off"
          >
            <Ionicons name={flashEnabled ? 'flash' : 'flash-off'} size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={toggleFacing}
            accessible={true}
            accessibilityLabel="Flip camera"
            accessibilityRole="button"
            accessibilityHint="Switches between front and back camera"
          >
            <Ionicons name="camera-reverse" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            accessible={true}
            accessibilityLabel="Cancel"
            accessibilityRole="button"
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.captureButton}
            onPress={takePicture}
            accessible={true}
            accessibilityLabel="Capture book cover photo"
            accessibilityRole="button"
            accessibilityHint="Takes a photo of the book cover for analysis"
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          {/* Spacer for symmetry */}
          <View style={styles.cancelButton} />
        </View>
      </View>
    </CameraErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlayStrip: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  scanArea: {
    position: 'absolute',
    width: SCAN_AREA_WIDTH,
    height: SCAN_AREA_HEIGHT,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
  },
  cornerTopLeft: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#007AFF',
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#007AFF',
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#007AFF',
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#007AFF',
    borderBottomRightRadius: 12,
  },
  instructions: {
    position: 'absolute',
    bottom: 140,
    alignSelf: 'center',
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 8,
    borderRadius: 8,
  },
  topControls: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 80,
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  photoPreview: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryControlButton: {
    backgroundColor: '#007AFF',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
  },
  analyzingSubtext: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 8,
  },
  slowWarningText: {
    color: '#ffcc00',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  text: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  subtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
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
