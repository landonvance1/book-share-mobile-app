import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import { SearchStackParamList } from '../SearchStack';
import { booksApi } from '../api/booksApi';
import { getImageUrlFromId } from '../../../utils/imageUtils';
import { ApiError } from '../../../lib/api';

type ShareRequestRouteProp = RouteProp<SearchStackParamList, 'ShareRequest'>;
type ShareRequestNavProp = StackNavigationProp<SearchStackParamList, 'ShareRequest'>;

export function ShareRequestScreen() {
  const navigation = useNavigation<ShareRequestNavProp>();
  const route = useRoute<ShareRequestRouteProp>();
  const { book } = route.params;

  const [selectedUserBookId, setSelectedUserBookId] = useState<number | undefined>(
    book.owners.length > 0 ? book.owners[0].userBookId : undefined
  );
  const [requesting, setRequesting] = useState(false);
  const [imageError, setImageError] = useState(false);

  const hasValidThumbnail = book.bookId > 0 && !imageError;

  const handleRequest = async () => {
    if (!selectedUserBookId) return;
    setRequesting(true);
    try {
      await booksApi.createShareRequest(selectedUserBookId);
      Toast.show({
        type: 'success',
        text1: '✓ Request sent!',
        text2: 'The owner will be notified of your request',
        visibilityTime: 3000,
      });
      setTimeout(() => navigation.goBack(), 500);
    } catch (error) {
      let errorMessage = 'Failed to request book. Please try again.';
      if (error instanceof ApiError) {
        if (error.status === 400) {
          errorMessage = 'Unable to request this book. Please check if the book is available.';
        } else if (error.status === 409) {
          errorMessage = 'You already have an active request for this book.';
        }
      }
      Toast.show({
        type: 'error',
        text1: 'Request failed',
        text2: errorMessage,
        visibilityTime: 4000,
      });
    } finally {
      setRequesting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.bookCard}>
          <View style={styles.thumbnail}>
            {hasValidThumbnail ? (
              <Image
                source={{ uri: getImageUrlFromId(book.bookId) }}
                style={styles.thumbnailImage}
                onError={() => setImageError(true)}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.thumbnailText}>No Cover</Text>
            )}
          </View>
          <View style={styles.bookInfo}>
            <Text style={styles.author}>{book.author}</Text>
            <Text style={styles.title}>{book.title}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Available from</Text>

        {book.owners.length === 0 && (
          <Text style={styles.noOwnersText}>No owners currently available</Text>
        )}

        {book.owners.map((owner) => {
          const isSelected = owner.userBookId === selectedUserBookId;
          return (
            <TouchableOpacity
              key={owner.userBookId}
              style={[styles.ownerCard, isSelected ? styles.ownerCardSelected : styles.ownerCardUnselected]}
              onPress={() => setSelectedUserBookId(owner.userBookId)}
              activeOpacity={0.7}
            >
              <View style={styles.ownerInfo}>
                <Text style={styles.ownerName}>{owner.ownerFirstName}</Text>
                <Text style={styles.communityName}>{owner.communityName}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.requestButton, (requesting || !selectedUserBookId) && styles.requestButtonDisabled]}
          onPress={handleRequest}
          disabled={requesting || !selectedUserBookId}
        >
          {requesting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.requestButtonText}>Request</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  bookCard: {
    backgroundColor: '#FEFCF9',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#1C3A5B',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    gap: 16,
  },
  thumbnail: {
    width: 80,
    height: 120,
    backgroundColor: '#E8E6E3',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  thumbnailText: {
    color: '#6B6B6B',
    fontSize: 10,
    textAlign: 'center',
  },
  bookInfo: {
    flex: 1,
  },
  title: {
    color: '#1C3A5B',
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 26,
    marginBottom: 6,
  },
  author: {
    color: '#6B6B6B',
    fontSize: 16,
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B6B6B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  noOwnersText: {
    color: '#6B6B6B',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 8,
  },
  ownerCard: {
    backgroundColor: '#FEFCF9',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1C3A5B',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  ownerCardSelected: {
    borderColor: '#4CAF50',
  },
  ownerCardUnselected: {
    opacity: 0.5,
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    color: '#1C3A5B',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  communityName: {
    color: '#6B6B6B',
    fontSize: 13,
  },
  footer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  requestButton: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestButtonDisabled: {
    opacity: 0.6,
  },
  requestButtonText: {
    color: '#FEFCF9',
    fontSize: 16,
    fontWeight: '600',
  },
});
