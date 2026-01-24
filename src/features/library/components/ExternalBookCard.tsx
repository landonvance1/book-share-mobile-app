import React, { useState } from 'react';
import { Text, View, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Book } from '../../books/types';
import { bookCardStyles } from '../../../components/BookCardStyles';
import { getFullImageUrl } from '../../../utils/imageUtils';

interface ExternalBookCardProps {
  book: Book;
  onAddPress: (book: Book) => void;
}

export const ExternalBookCard: React.FC<ExternalBookCardProps> = ({ book, onAddPress }) => {
  const [imageError, setImageError] = useState(false);
  const [addingToLibrary, setAddingToLibrary] = useState(false);
  
  const hasValidThumbnail = book.thumbnailUrl && !imageError;

  const handleAddPress = async () => {
    setAddingToLibrary(true);
    try {
      await onAddPress(book);
    } finally {
      setAddingToLibrary(false);
    }
  };
  
  return (
    <View style={bookCardStyles.container}>
      <View style={bookCardStyles.cardContent}>
        <View style={bookCardStyles.thumbnail}>
          {hasValidThumbnail ? (
            <Image
              source={{ uri: getFullImageUrl(book.thumbnailUrl) }}
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
          
          <View style={bookCardStyles.actionButtons}>
            <TouchableOpacity 
              style={bookCardStyles.primaryButton}
              onPress={handleAddPress}
              disabled={addingToLibrary}
            >
              {addingToLibrary ? (
                <ActivityIndicator color="#FEFCF9" size="small" />
              ) : (
                <Text style={bookCardStyles.primaryButtonText}>Add to Library</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};