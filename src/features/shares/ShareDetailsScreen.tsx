import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  PanResponder,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { Share } from './types';
import { ShareStatus } from '../../lib/constants';
import { getFullImageUrl } from '../../utils/imageUtils';
import { useAuth } from '../../contexts/AuthContext';
import { SharesStackParamList } from './SharesStack';
import ShareStatusTimeline from './components/ShareStatusTimeline';
import { sharesApi } from './api/sharesApi';
import {
  useShareNotifications,
  useMarkShareNotificationsRead,
} from '../notifications/hooks/useNotifications';

type ShareDetailsNavigationProp = StackNavigationProp<SharesStackParamList, 'ShareDetails'>;
type ShareDetailsRouteProp = RouteProp<SharesStackParamList, 'ShareDetails'>;


export default function ShareDetailsScreen() {
  const navigation = useNavigation<ShareDetailsNavigationProp>();
  const route = useRoute<ShareDetailsRouteProp>();
  const { user } = useAuth();
  const { share, isArchived = false } = route.params;
  const [imageError, setImageError] = useState(false);
  const [currentShare, setCurrentShare] = useState<Share>(share);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationRef = useRef<LottieView>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(
    currentShare.returnDate ? new Date(currentShare.returnDate) : new Date()
  );
  const datePickerHeight = useRef(new Animated.Value(0)).current;

  // Notification handling
  const { statusUpdated, unreadMessagesCount, dueDateUpdated, bookWithdrawn } = useShareNotifications(currentShare.id);
  const markNotificationsRead = useMarkShareNotificationsRead(currentShare.id);

  // Track whether to show return date highlight (persists until user navigates away)
  const [showReturnDateHighlight, setShowReturnDateHighlight] = useState(false);

  // Initialize highlight state based on notification
  useEffect(() => {
    if (dueDateUpdated) {
      setShowReturnDateHighlight(true);
    }
  }, [dueDateUpdated]);

  const { userBook, borrowerUser } = currentShare;
  const { book, userId: ownerId, user: owner } = userBook;
  const hasValidThumbnail = book.thumbnailUrl && book.thumbnailUrl.trim() !== '' && !imageError;

  // Determine if current user is the owner or borrower
  const isOwner = user?.id === ownerId;
  const isBorrower = user?.id === currentShare.borrower;

  // Mark share notifications as read after a delay (gives user time to see the animation)
  useEffect(() => {
    if (statusUpdated || dueDateUpdated || bookWithdrawn) {
      const timer = setTimeout(() => {
        markNotificationsRead.mutate(undefined, {
          onError: (error) => {
            console.error('Failed to mark notifications as read:', error);
          },
        });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, []);


  // Swipe back gesture
  const screenWidth = Dimensions.get('window').width;
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return gestureState.dx > 20 && Math.abs(gestureState.dy) < 50;
    },
    onPanResponderMove: () => {
      // Could add visual feedback here
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > screenWidth * 0.3) {
        navigation.goBack();
      }
    },
  });

  const handleStatusUpdate = async (newStatus: ShareStatus) => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      const updatedShare = await sharesApi.updateShareStatus(currentShare.id, newStatus);
      setCurrentShare(updatedShare);

      // Trigger celebration if status becomes HomeSafe
      if (newStatus === ShareStatus.HomeSafe) {
        setShowCelebration(true);
        celebrationRef.current?.play();

        // Hide celebration after 3 seconds
        setTimeout(() => {
          setShowCelebration(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to update share status:', error);
      Alert.alert(
        'Error',
        'Failed to update share status. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleArchive = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      if (isArchived) {
        await sharesApi.unarchiveShare(currentShare.id);
        Toast.show({
          type: 'success',
          text1: '✓ Share unarchived',
          visibilityTime: 2000,
        });
        // Navigate to main Shares screen after unarchiving
        navigation.navigate('SharesList');
      } else {
        await sharesApi.archiveShare(currentShare.id);
        Toast.show({
          type: 'success',
          text1: '✓ Share archived',
          visibilityTime: 2000,
        });
        // Navigate back after archiving
        navigation.goBack();
      }
    } catch (error) {
      console.error('Failed to archive/unarchive share:', error);
      Alert.alert(
        'Error',
        `Failed to ${isArchived ? 'unarchive' : 'archive'} share. Please try again.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDispute = () => {
    Alert.alert(
      'Report Issue',
      'Are you sure you want to report an issue with this share?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report Issue',
          style: 'destructive',
          onPress: async () => {
            if (isUpdating) return;

            setIsUpdating(true);
            try {
              const updatedShare = await sharesApi.disputeShare(currentShare.id);
              setCurrentShare(updatedShare);
            } catch (error) {
              console.error('Failed to report issue:', error);
              Alert.alert(
                'Error',
                'Failed to report issue. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsUpdating(false);
            }
          }
        }
      ]
    );
  };

  const formatReturnDate = (dateString: string | null) => {
    if (!dateString) return 'No return date set';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleDateChange = (_: any, date?: Date) => {
    if (Platform.OS === 'android') {
      closeDatePicker();
    }

    if (date) {
      setSelectedDate(date);
      if (Platform.OS === 'android') {
        // On Android, apply the date immediately when selected
        handleReturnDateUpdate(date);
      }
    }
  };

  const handleReturnDateUpdate = async (dateToUpdate: Date) => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      const updatedShare = await sharesApi.updateReturnDate(currentShare.id, dateToUpdate.toISOString());
      setCurrentShare(updatedShare);
      closeDatePicker();
      Toast.show({
        type: 'success',
        text1: '✓ Return date updated',
        visibilityTime: 2000,
      });
    } catch (error) {
      console.error('Failed to update return date:', error);
      Alert.alert(
        'Error',
        'Failed to update return date. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const openDatePicker = () => {
    setShowDatePicker(true);
    Animated.timing(datePickerHeight, {
      toValue: Platform.OS === 'ios' ? 280 : 0,
      duration: 400,
      useNativeDriver: false,
    }).start();
  };

  const closeDatePicker = () => {
    Animated.timing(datePickerHeight, {
      toValue: 0,
      duration: 400,
      useNativeDriver: false,
    }).start(() => {
      setShowDatePicker(false);
    });
  };

  const handleEditReturnDate = () => {
    if (showDatePicker) {
      closeDatePicker();
    } else {
      openDatePicker();
    }
  };


  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Details</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ShareChat', { share: currentShare })} style={styles.chatButton}>
          <Ionicons name="chatbubble-outline" size={24} color="#007AFF" />
          {unreadMessagesCount > 0 && (
            <View style={styles.chatBadge}>
              <Text style={styles.chatBadgeText}>
                {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Book Info */}
      <View style={styles.bookInfo}>
        <View style={styles.thumbnail}>
          {hasValidThumbnail ? (
            <Image
              source={{ uri: getFullImageUrl(book.thumbnailUrl) }}
              style={styles.thumbnailImage}
              onError={() => setImageError(true)}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.thumbnailText}>No Cover</Text>
          )}
        </View>

        <View style={styles.bookDetails}>
          <Text style={styles.author}>{book.author}</Text>
          <Text style={styles.title}>{book.title}</Text>

          <View style={styles.detailsGroup}>
            {isBorrower && (
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Owner: </Text>
                {owner.firstName} {owner.lastName}
              </Text>
            )}
            {isOwner && (
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Borrower: </Text>
                {borrowerUser.firstName} {borrowerUser.lastName}
              </Text>
            )}
            <View
              style={[
                styles.returnDateContainer,
                showReturnDateHighlight && styles.returnDateContainerHighlighted
              ]}
              accessibilityLabel={
                showReturnDateHighlight
                  ? `Return date updated: ${formatReturnDate(currentShare.returnDate)}`
                  : `Return by: ${formatReturnDate(currentShare.returnDate)}`
              }
              accessibilityHint={showReturnDateHighlight ? "The lender has updated the return date" : undefined}
            >
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Return by: </Text>
                {formatReturnDate(currentShare.returnDate)}
              </Text>
              {showReturnDateHighlight && (
                <View style={styles.returnDateUpdateBadge}>
                  <Text style={styles.returnDateUpdateBadgeText}>Updated</Text>
                </View>
              )}
              {isOwner && (
                <TouchableOpacity
                  onPress={handleEditReturnDate}
                  disabled={isUpdating}
                  style={styles.editDateButton}
                >
                  <Ionicons name="calendar-outline" size={18} color="#007AFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Date Picker */}
      {showDatePicker && Platform.OS === 'ios' && (
        <Animated.View style={[styles.datePickerContainer, { height: datePickerHeight }]}>
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="spinner"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
          <View style={styles.datePickerButtons}>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={closeDatePicker}
            >
              <Text style={styles.datePickerButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.datePickerButton, styles.datePickerConfirmButton]}
              onPress={() => handleReturnDateUpdate(selectedDate)}
              disabled={isUpdating}
            >
              <Text style={[styles.datePickerButtonText, styles.datePickerConfirmText]}>
                {isUpdating ? 'Updating...' : 'Confirm'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Celebration Animation */}
      {showCelebration && (
        <View style={styles.celebrationContainer}>
          <LottieView
            ref={celebrationRef}
            source={require('../../../assets/animations/confetti.json')}
            style={styles.celebrationAnimation}
            autoPlay
            loop={false}
          />
        </View>
      )}

      {/* Status Timeline */}
        <ShareStatusTimeline
          share={currentShare}
          isOwner={isOwner}
          isBorrower={isBorrower}
          onStatusUpdate={handleStatusUpdate}
          hasStatusNotification={statusUpdated}
          isBookDeleted={currentShare.userBook.isDeleted}
        />

      {/* Dispute Button */}
      {!currentShare.isDisputed && currentShare.status !== ShareStatus.HomeSafe && currentShare.status !== ShareStatus.Declined && (
        <TouchableOpacity
          style={[styles.disputeButton, isUpdating && styles.buttonDisabled]}
          onPress={handleDispute}
          disabled={isUpdating}
        >
          <Text style={styles.disputeButtonText}>
            {isUpdating ? 'Reporting...' : 'Report Issue'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Spacer to push bottom content down */}
      <View style={styles.spacer} />

      {/* Bottom Section - Disputed Warning and Archive Button */}
      <View style={styles.bottomSection}>
        {/* Disputed Status Warning */}
        {currentShare.isDisputed && (
          <View style={styles.disputedWarning}>
            <Ionicons name="warning" size={20} color="#C4443C" />
            <Text style={styles.disputedText}>
              This share has been marked as disputed
            </Text>
          </View>
        )}

        {/* Archive/Unarchive Button for Terminal States */}
        {(isArchived ||
          currentShare.status === ShareStatus.HomeSafe ||
          currentShare.isDisputed ||
          currentShare.status === ShareStatus.Declined) && (
          <TouchableOpacity
            style={[
              isArchived ? styles.unarchiveButton : styles.archiveButton,
              isUpdating && styles.buttonDisabled
            ]}
            onPress={handleArchive}
            disabled={isUpdating}
          >
            <Ionicons
              name={isArchived ? "arrow-undo-outline" : "archive-outline"}
              size={20}
              color={isArchived ? "#34C759" : "#007AFF"}
            />
            <Text style={isArchived ? styles.unarchiveButtonText : styles.archiveButtonText}>
              {isUpdating
                ? (isArchived ? 'Unarchiving...' : 'Archiving...')
                : (isArchived ? 'Unarchive Share' : 'Archive Share')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  chatButton: {
    padding: 8,
    position: 'relative',
  },
  chatBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  chatBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  bookInfo: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  thumbnail: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  thumbnailText: {
    fontSize: 12,
    color: '#6B6B6B',
    textAlign: 'center',
  },
  bookDetails: {
    flex: 1,
  },
  author: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C3A5B',
    marginBottom: 12,
  },
  detailsGroup: {
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#6B6B6B',
  },
  detailLabel: {
    fontWeight: '600',
  },
  returnDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderLeftWidth: 0,
  },
  returnDateContainerHighlighted: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  returnDateUpdateBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  returnDateUpdateBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  editDateButton: {
    padding: 4,
  },
  datePickerContainer: {
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  datePickerButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  datePickerConfirmButton: {
    backgroundColor: '#007AFF',
  },
  datePickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  datePickerConfirmText: {
    color: '#fff',
  },
  chatPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f8f8f8',
    margin: 16,
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  chatPlaceholderText: {
    fontSize: 16,
    color: '#6B6B6B',
    fontStyle: 'italic',
  },
  disputeButton: {
    backgroundColor: '#FF3B30',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disputeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disputedWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  disputedText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#C4443C',
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  archiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8FF',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 8,
  },
  archiveButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  unarchiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#34C759',
    gap: 8,
  },
  unarchiveButtonText: {
    color: '#34C759',
    fontSize: 16,
    fontWeight: '600',
  },
  celebrationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
  },
  celebrationAnimation: {
    width: '100%',
    height: '100%',
  },
  celebrationText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C3A5B',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
    textAlign: 'center',
    overflow: 'hidden',
  },
  spacer: {
    flex: 1,
  },
  bottomSection: {
    paddingBottom: 16,
  },
});