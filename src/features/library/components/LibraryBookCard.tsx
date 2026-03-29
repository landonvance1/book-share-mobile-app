import React, { useState } from 'react';
import { Text, View, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserBook } from '../../books/types';
import { bookCardStyles } from '../../../components/BookCardStyles';
import { getFullImageUrl } from '../../../utils/imageUtils';

interface LibraryBookCardProps {
  userBook: UserBook;
  onRemovePress: (userBookId: number) => void;
}

export const LibraryBookCard: React.FC<LibraryBookCardProps> = ({ userBook, onRemovePress }) => {
  const [imageError, setImageError] = useState(false);

  const { book } = userBook;
  const hasValidThumbnail = book.thumbnailUrl && book.thumbnailUrl.trim() !== '' && !imageError;

  const handleRemovePress = () => {
    Alert.alert(
      'Remove Book',
      `Are you sure you want to remove "${book.title}" from your library?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemovePress(userBook.id),
        },
      ]
    );
  };

  return (
    <View style={bookCardStyles.container}>
      <TouchableOpacity 
        style={bookCardStyles.trashIcon}
        onPress={handleRemovePress}
      >
        <Ionicons name="close" size={20} color="#C4443C" />
      </TouchableOpacity>
      
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
          
        </View>
      </View>
    </View>
  );
};