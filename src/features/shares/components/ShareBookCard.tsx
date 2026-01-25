import React, { useState, useRef } from 'react';
import { Text, View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Share } from '../types';
import { ShareStatus } from '../../../lib/constants';
import { bookCardStyles } from '../../../components/BookCardStyles';
import { getFullImageUrl } from '../../../utils/imageUtils';
import { SharesStackParamList } from '../SharesStack';
import { sharesApi } from '../api/sharesApi';
import { NotificationBadge } from '../../notifications/components/NotificationBadge';
import { useShareNotifications } from '../../notifications/hooks/useNotifications';

type ShareCardNavigationProp = StackNavigationProp<SharesStackParamList>;

interface ShareBookCardProps {
  share: Share;
  showOwner?: boolean;
  showReturnDate?: boolean;
  showUnarchive?: boolean;
  onArchiveSuccess?: () => void;
}

export const ShareBookCard: React.FC<ShareBookCardProps> = ({
  share,
  showOwner = true,
  showReturnDate = true,
  showUnarchive = false,
  onArchiveSuccess
}) => {
  const [imageError, setImageError] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const navigation = useNavigation<ShareCardNavigationProp>();
  const swipeableRef = useRef<Swipeable>(null);
  const { count: notificationCount } = useShareNotifications(share.id);

  const { userBook } = share;
  const { book, user } = userBook;
  const hasValidThumbnail = book.thumbnailUrl && book.thumbnailUrl.trim() !== '' && !imageError;

  const getStatusText = (status: number, isDisputed: boolean) => {
    if (isDisputed) {
      return 'Disputed';
    }
    switch (status) {
      case ShareStatus.Requested:
        return 'Requested';
      case ShareStatus.Ready:
        return 'Ready';
      case ShareStatus.PickedUp:
        return 'Picked Up';
      case ShareStatus.Returned:
        return 'Returned';
      case ShareStatus.HomeSafe:
        return 'Home Safe';
      case ShareStatus.Declined:
        return 'Declined';
      default:
        return 'Unknown';
    }
  };


  const formatReturnDate = (dateString: string | null) => {
    if (!dateString) return 'No return date set';

    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handlePress = () => {
    navigation.navigate('ShareDetails', { share, isArchived: showUnarchive });
  };

  const canArchive =
    share.status === ShareStatus.HomeSafe ||
    share.isDisputed ||
    share.status === ShareStatus.Declined ||
    share.userBook.isDeleted;

  const handleArchive = async () => {
    if (isArchiving) return;

    setIsArchiving(true);
    try {
      await sharesApi.archiveShare(share.id);
      swipeableRef.current?.close();
      Toast.show({
        type: 'success',
        text1: '✓ Share archived',
        visibilityTime: 2000,
      });
      if (onArchiveSuccess) {
        onArchiveSuccess();
      }
    } catch (error) {
      console.error('Failed to archive share:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to archive',
        visibilityTime: 2000,
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleUnarchive = async () => {
    if (isArchiving) return;

    setIsArchiving(true);
    try {
      await sharesApi.unarchiveShare(share.id);
      swipeableRef.current?.close();
      Toast.show({
        type: 'success',
        text1: '✓ Share unarchived',
        visibilityTime: 2000,
      });
      if (onArchiveSuccess) {
        onArchiveSuccess();
      }
    } catch (error) {
      console.error('Failed to unarchive share:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to unarchive',
        visibilityTime: 2000,
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const renderRightActions = () => {
    if (showUnarchive) {
      return (
        <TouchableOpacity style={styles.unarchiveAction} onPress={handleUnarchive}>
          <Ionicons name="arrow-undo-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>Unarchive</Text>
        </TouchableOpacity>
      );
    }

    if (canArchive) {
      return (
        <TouchableOpacity style={styles.archiveAction} onPress={handleArchive}>
          <Ionicons name="archive-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>Archive</Text>
        </TouchableOpacity>
      );
    }

    return null;
  };

  const cardContent = (
    <TouchableOpacity style={bookCardStyles.container} onPress={handlePress}>
      <View style={bookCardStyles.cardContent}>
        <View style={bookCardStyles.thumbnail}>
          {hasValidThumbnail ? (
            <Image
              source={{ uri: getFullImageUrl(book.thumbnailUrl) }}
              style={bookCardStyles.thumbnailImage}
              onError={() => {
                setImageError(true);
              }}
              resizeMode="cover"
            />
          ) : (
            <Text style={bookCardStyles.thumbnailText}>No Cover</Text>
          )}
        </View>

        <View style={bookCardStyles.contentArea}>
          <Text style={bookCardStyles.author}>{book.author}</Text>
          <Text style={bookCardStyles.title}>{book.title}</Text>

          <View style={styles.detailsGroup}>
            {showOwner && (
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Owner: </Text>
                {user.firstName} {user.lastName}
              </Text>
            )}

            {showReturnDate && (
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Return by: </Text>
                {formatReturnDate(share.returnDate)}
              </Text>
            )}

            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Status: </Text>
              {getStatusText(share.status, share.isDisputed)}
            </Text>
          </View>
        </View>

        {notificationCount > 0 && (
          <View style={styles.notificationBadgeContainer}>
            <NotificationBadge count={notificationCount} size="medium" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  // Only enable swipe if it's a terminal state or showing unarchive
  if (canArchive || showUnarchive) {
    return (
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        overshootRight={false}
      >
        {cardContent}
      </Swipeable>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  detailsGroup: {
    marginTop: 8,
    gap: 2,
  },
  detailText: {
    color: '#6B6B6B',
    fontSize: 14,
    fontWeight: '400',
  },
  detailLabel: {
    fontWeight: '600',
  },
  notificationBadgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  archiveAction: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    marginVertical: 8,
    marginRight: 8,
    borderRadius: 8,
  },
  unarchiveAction: {
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    marginVertical: 8,
    marginRight: 8,
    borderRadius: 8,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
});