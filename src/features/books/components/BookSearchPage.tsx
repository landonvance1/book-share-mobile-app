import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useBookSearch } from '../hooks/useBookSearch';
import { useDebounceValue } from '../../../hooks/useDebounceValue';
import { SearchBookCard } from './SearchBookCard';
import { SearchBookResult } from '../types';
import { SearchInput } from '../../../components/SearchInput';

export const BookSearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounceValue(searchQuery, 500);
  const { searchResults, loading, error, searchBooks } = useBookSearch();

  useEffect(() => {
    searchBooks(debouncedQuery);
  }, [debouncedQuery, searchBooks]);

  const handleBorrowPress = (_book: SearchBookResult) => {
    // TODO: Implement borrow flow
  };

  const renderBookCard = ({ item }: { item: SearchBookResult }) => (
    <SearchBookCard book={item} onBorrowPress={handleBorrowPress} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <SearchInput
          placeholder="Search by title or author..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitSearch={searchBooks}
        />
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={searchResults}
        renderItem={renderBookCard}
        keyExtractor={(item) => `${item.userBookId}-${item.communityId}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
};

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  listContainer: {
    paddingVertical: 8,
  },
});