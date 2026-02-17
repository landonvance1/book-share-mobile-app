import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LibraryStackParamList } from '../LibraryStack';
import { api } from '../../../lib/api';
import { getFullImageUrl } from '../../../utils/imageUtils';

type BookConfirmationNavigationProp = StackNavigationProp<LibraryStackParamList, 'BookConfirmation'>;
type BookConfirmationRouteProp = RouteProp<LibraryStackParamList, 'BookConfirmation'>;

export default function BookConfirmation() {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<BookConfirmationNavigationProp>();
  const route = useRoute<BookConfirmationRouteProp>();
  const { book, capturedCoverUri, source } = route.params;

  const handleConfirmAddBook = async () => {
    setLoading(true);
    
    try {
      // Check if book ID is negative (book doesn't exist in database yet)
      if (book.id < 0) {
        // Create the book and add it to user's library
        await api.post('/books?addToUser=true', book);
      } else {
        // Book already exists, just add to user's library
        await api.post('/user-books/', book.id);
      }
      
      setLoading(false);
      
      // Navigate back immediately with success flag
      navigation.navigate('LibraryMain', { showSuccess: true });
    } catch (error: any) {
      console.error('Error adding book to library:', error);
      setLoading(false);
      
      // Check if it's a 409 conflict (book already exists)
      if (error.message?.includes('409')) {
        Alert.alert(
          'Book Already Added',
          'This book is already in your library! You can find it in your Library tab.',
          [
            {
              text: 'Go to Library',
              onPress: () => navigation.navigate('LibraryMain'),
            },
            {
              text: 'OK',
              style: 'cancel',
            },
          ]
        );
      } else {
        Alert.alert(
          'Error',
          'Sorry, we could not add this book to your library. Please try again later.',
          [
            {
              text: 'OK',
            },
          ]
        );
      }
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  // Get source-specific messaging
  const getSourceMessage = () => {
    switch (source) {
      case 'cover':
        return 'This book was identified from your cover photo';
      case 'barcode':
        return 'This book was found by ISBN';
      default:
        return 'Add this book to your library?';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {capturedCoverUri && (
          <View style={styles.capturedPhotoSection}>
            <Text style={styles.capturedPhotoLabel}>Your photo:</Text>
            <Image source={{ uri: capturedCoverUri }} style={styles.capturedPhoto} resizeMode="cover" />
          </View>
        )}

        <View style={styles.bookCard}>
          <Image
            source={{
              uri: getFullImageUrl(book.thumbnailUrl),
            }}
            style={styles.bookImage}
            resizeMode="contain"
          />

          <View style={styles.bookInfo}>
            <Text style={styles.bookTitle}>{book.title}</Text>
            <Text style={styles.bookAuthor}>by {book.author}</Text>
          </View>
        </View>

        <View style={styles.confirmationSection}>
          <Text style={styles.confirmationTitle}>{getSourceMessage()}</Text>
          <Text style={styles.confirmationText}>
            This book will be added to your personal library and marked as available for lending.
          </Text>
        </View>
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.confirmButton]}
          onPress={handleConfirmAddBook}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmButtonText}>Add Book</Text>
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
    flexGrow: 1,
    padding: 16,
  },
  capturedPhotoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  capturedPhotoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  capturedPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  bookCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
  },
  bookImage: {
    width: 120,
    height: 180,
    marginBottom: 16,
    borderRadius: 8,
  },
  bookInfo: {
    alignItems: 'center',
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  bookAuthor: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmationSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#333',
  },
  confirmationText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});