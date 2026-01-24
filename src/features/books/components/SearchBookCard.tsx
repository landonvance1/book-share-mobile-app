import React, { useState } from 'react';
import { Text, View, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { SearchBookResult } from '../types';
import { bookCardStyles } from '../../../components/BookCardStyles';
import { getImageUrlFromId } from '../../../utils/imageUtils';
import { booksApi } from '../api/booksApi';

interface SearchBookCardProps {
  book: SearchBookResult;
  onBorrowPress?: (book: SearchBookResult) => void;
}

export const SearchBookCard: React.FC<SearchBookCardProps> = ({ book, onBorrowPress }) => {
  const [imageError, setImageError] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  
  const hasValidThumbnail = book.bookId && book.bookId > 0 && !imageError;
  
  const handleRequestBook = async () => {
    setIsRequesting(true);
    try {
      await booksApi.createShareRequest(book.userBookId);
      Toast.show({
        type: 'success',
        text1: '✓ Request sent!',
        text2: 'The owner will be notified of your request',
        visibilityTime: 3000,
      });
      onBorrowPress?.(book);
    } catch (error: any) {
      let errorMessage = 'Failed to request book. Please try again.';
      
      if (error.message.includes('400')) {
        errorMessage = 'Unable to request this book. Please check if the book is available.';
      } else if (error.message.includes('409')) {
        errorMessage = 'You already have an active request for this book.';
      }
      
      Toast.show({
        type: 'error',
        text1: 'Request failed',
        text2: errorMessage,
        visibilityTime: 4000,
      });
    } finally {
      setIsRequesting(false);
    }
  };
  
  return (
    <View style={bookCardStyles.container}>
      <View style={bookCardStyles.cardContent}>
        <View style={bookCardStyles.thumbnail}>
          {hasValidThumbnail ? (
            <Image
              source={{ uri: getImageUrlFromId(book.bookId) }}
              style={bookCardStyles.thumbnailImage}
              onError={() => setImageError(true)}
              resizeMode="cover"
            />
          ) : (
            <Text style={bookCardStyles.thumbnailText}>No Cover</Text>
          )}
        </View>
        
        <View style={bookCardStyles.contentArea}>
          <Text style={bookCardStyles.author}>{book.author}</Text>
          <Text style={bookCardStyles.title}>{book.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons name="people" size={16} color="#6B6B6B" style={{ marginRight: 6 }} />
            <Text style={bookCardStyles.community}>{book.communityName}</Text>
          </View>
          
          <View style={bookCardStyles.actionButtons}>
            <TouchableOpacity 
              style={[bookCardStyles.primaryButton, isRequesting && { opacity: 0.6 }]}
              onPress={handleRequestBook}
              disabled={isRequesting}
            >
              <Text style={bookCardStyles.primaryButtonText}>
                {isRequesting ? 'Requesting...' : 'Request Book'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

