import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useUserBooks } from './hooks/useUserBooks';
import { useDebounceValue } from '../../hooks/useDebounceValue';
import { LibraryBookCard } from './components/LibraryBookCard';
import { UserBook } from '../books/types';
import { SearchInput } from '../../components/SearchInput';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LibraryStackParamList } from './LibraryStack';

type LibraryScreenNavigationProp = StackNavigationProp<LibraryStackParamList, 'LibraryMain'>;
type LibraryScreenRouteProp = RouteProp<LibraryStackParamList, 'LibraryMain'>;

export default function LibraryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounceValue(searchQuery, 300);
  const { userBooks, loading, error, updateUserBookStatus, removeUserBook } = useUserBooks();
  const navigation = useNavigation<LibraryScreenNavigationProp>();
  const route = useRoute<LibraryScreenRouteProp>();

  const handleAddBookPress = () => {
    Alert.alert(
      'Add Book',
      'How would you like to add a book?',
      [
        {
          text: 'Scan Barcode',
          onPress: () => navigation.navigate('BarcodeScanner'),
        },
        {
          text: 'Scan Book Cover',
          onPress: () => navigation.navigate('BookCoverScanner'),
        },
        {
          text: 'Search Title/Author',
          onPress: () => navigation.navigate('ExternalBookSearch'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  // Handle success message from BookConfirmation
  useEffect(() => {
    if (route.params?.showSuccess) {
      Toast.show({
        type: 'success',
        text1: '✓ Book added to your library!',
        visibilityTime: 1500,
      });
      
      // Clear the parameter to prevent showing again on re-renders
      navigation.setParams({ showSuccess: undefined });
    }
  }, [route.params?.showSuccess, navigation]);

  const filteredBooks = userBooks.filter(userBook => {
    if (!debouncedQuery.trim()) return true;
    
    const query = debouncedQuery.toLowerCase();
    const book = userBook.book;
    
    return (
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query)
    );
  });

  const handleRemoveBook = async (userBookId: number, confirmed?: boolean) => {
    try {
      const result = await removeUserBook(userBookId, confirmed);

      if (result.type === 'requires_confirmation') {
        Alert.alert(
          'Confirm Delete?',
          result.message,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Remove Anyway',
              style: 'destructive',
              onPress: () => handleRemoveBook(userBookId, true),
            },
          ]
        );
        return;
      }

      Toast.show({
        type: 'success',
        text1: 'Book removed from library',
        visibilityTime: 1500,
      });
    } catch (error) {
      console.error('Failed to remove book:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to remove book',
        visibilityTime: 1500,
      });
    }
  };

  const handleStatusChange = async (userBookId: number, status: number) => {
    try {
      await updateUserBookStatus(userBookId, status);
    } catch (error) {
      console.error('Failed to update book status:', error);
    }
  };

  const renderBookCard = ({ item }: { item: UserBook }) => (
    <LibraryBookCard 
      userBook={item} 
      onRemovePress={handleRemoveBook}
      onStatusChange={handleStatusChange}
    />
  );

  if (loading && userBooks.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading your library...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <SearchInput
            placeholder="Search your books..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddBookPress}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {userBooks.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Your Library is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Books you add to your library will appear here
          </Text>
        </View>
      ) : filteredBooks.length === 0 && debouncedQuery.trim() ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No books found</Text>
          <Text style={styles.emptySubtitle}>
            Try a different search term
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredBooks}
          renderItem={renderBookCard}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#fee',
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#d00',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  listContainer: {
    paddingVertical: 8,
  },
});