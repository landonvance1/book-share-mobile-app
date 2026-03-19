import React, { useState } from 'react';
import { Text, View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { SearchBookResult } from '../types';
import { bookCardStyles } from '../../../components/BookCardStyles';
import { getImageUrlFromId } from '../../../utils/imageUtils';

interface SearchBookCardProps {
  book: SearchBookResult;
  onPress: () => void;
}

export const SearchBookCard: React.FC<SearchBookCardProps> = ({ book, onPress }) => {
  const [imageError, setImageError] = useState(false);
  const hasValidThumbnail = book.bookId > 0 && !imageError;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} disabled={book.owners.length === 0}>
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
            <Text style={[bookCardStyles.author, styles.author]}>{book.author}</Text>
            <Text style={[bookCardStyles.title, styles.title]}>{book.title}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  author: {
    fontSize: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
  },
});
