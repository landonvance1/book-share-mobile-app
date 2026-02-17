import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LibraryStackParamList } from '../LibraryStack';
import { api } from '../../../lib/api';
import { Book, ExternalBookSearchResponse } from '../../books/types';
import { ExternalBookCard } from '../components/ExternalBookCard';

type ExternalBookSearchNavigationProp = StackNavigationProp<LibraryStackParamList, 'ExternalBookSearch'>;
type ExternalBookSearchRouteProp = RouteProp<LibraryStackParamList, 'ExternalBookSearch'>;

export default function ExternalBookSearch() {
  const route = useRoute<ExternalBookSearchRouteProp>();
  const { prefillTitle, prefillAuthor } = route.params || {};

  const [title, setTitle] = useState(prefillTitle || '');
  const [author, setAuthor] = useState(prefillAuthor || '');
  const [books, setBooks] = useState<Book[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const navigation = useNavigation<ExternalBookSearchNavigationProp>();

  // Auto-search if prefilled values exist
  useEffect(() => {
    if (prefillTitle || prefillAuthor) {
      handleSearch();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = async () => {
    if (!title.trim() && !author.trim()) {
      Alert.alert('Search Required', 'Please enter a title or author to search for books.');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      if (title.trim()) params.append('title', title.trim());
      if (author.trim()) params.append('author', author.trim());
      params.append('includeExternal', "true");
      
      const response: ExternalBookSearchResponse = await api.get(`/books/search?${params.toString()}`);
      
      setBooks(response.books);
      setHasMore(response.hasMore);
      setHasSearched(true);
    } catch (error: any) {
      console.error('Error searching books:', error);
      Alert.alert(
        'Search Error',
        'Sorry, we could not search for books at this time. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async (book: Book) => {
    try {
      if (book.id < 0) {
        await api.post('/books?addToUser=true', book);
      } else {
        await api.post('/user-books/', book.id);
      }
      
      navigation.navigate('LibraryMain', { showSuccess: true });
    } catch (error: any) {
      console.error('Error adding book to library:', error);
      
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
          [{ text: 'OK' }]
        );
      }
    }
  };

  const renderBookCard = ({ item }: { item: Book }) => (
    <ExternalBookCard book={item} onAddPress={handleAddBook} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchSection}>
        {hasMore && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              Results are incomplete. Try being more specific with your search for better results.
            </Text>
          </View>
        )}
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Book title..."
            value={title}
            onChangeText={setTitle}
            autoCapitalize="words"
            autoCorrect={false}
            spellCheck={false}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Author name..."
            value={author}
            onChangeText={setAuthor}
            autoCapitalize="words"
            autoCorrect={false}
            spellCheck={false}
          />
          
          <TouchableOpacity
            style={[styles.searchButton, loading && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.searchButtonText}>Search</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.resultsSection}>
        {loading && !hasSearched && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Searching for books...</Text>
          </View>
        )}

        {!loading && hasSearched && books.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Books Found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search terms or try different keywords.
            </Text>
          </View>
        )}

        {!loading && !hasSearched && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Search for Books</Text>
            <Text style={styles.emptySubtitle}>
              Enter a book title and/or author above to search for books to add to your library.
            </Text>
          </View>
        )}

        {books.length > 0 && (
          <FlatList
            data={books}
            renderItem={renderBookCard}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchSection: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  warningBanner: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ffeaa7',
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  inputContainer: {
    padding: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  searchButton: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  searchButtonDisabled: {
    backgroundColor: '#ccc',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsSection: {
    flex: 1,
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
    lineHeight: 24,
  },
  listContainer: {
    paddingVertical: 8,
  },
});