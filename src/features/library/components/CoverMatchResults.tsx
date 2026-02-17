import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LibraryStackParamList } from '../LibraryStack';
import { Book } from '../../books/types';
import { ExternalBookCard } from './ExternalBookCard';

type CoverMatchResultsNavigationProp = StackNavigationProp<LibraryStackParamList, 'CoverMatchResults'>;
type CoverMatchResultsRouteProp = RouteProp<LibraryStackParamList, 'CoverMatchResults'>;

export default function CoverMatchResults() {
  const navigation = useNavigation<CoverMatchResultsNavigationProp>();
  const route = useRoute<CoverMatchResultsRouteProp>();
  const { matches, capturedPhotoUri, extractedText } = route.params || {};

  // Fallback if somehow params are missing
  if (!matches?.length || !capturedPhotoUri) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Invalid data. Please try again.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleSelectBook = (book: Book) => {
    navigation.navigate('BookConfirmation', {
      book,
      capturedCoverUri: capturedPhotoUri,
      source: 'cover',
    });
  };

  const handleManualSearch = () => {
    navigation.navigate('ExternalBookSearch', {
      prefillTitle: extractedText || undefined,
    });
  };

  const handleRetake = () => {
    navigation.goBack();
  };

  const renderBookCard = ({ item }: { item: Book }) => (
    <ExternalBookCard book={item} onAddPress={handleSelectBook} />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with captured photo and extracted info */}
      <View style={styles.header}>
        <Image source={{ uri: capturedPhotoUri }} style={styles.capturedPhoto} resizeMode="cover" />

        <View style={styles.extractedInfo}>
          <Text style={styles.extractedTitle}>Detected from cover:</Text>
          {extractedText ? (
            <Text style={styles.extractedText} numberOfLines={3}>
              {extractedText}
            </Text>
          ) : (
            <Text style={styles.extractedText}>No text detected</Text>
          )}
        </View>
      </View>

      {/* Results */}
      <View style={styles.resultsSection}>
        <Text style={styles.resultsTitle}>Select a Book ({matches.length} matches found)</Text>

        <FlatList
          data={matches}
          renderItem={renderBookCard}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleRetake}>
          <Text style={styles.actionButtonText}>Retake Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.secondaryActionButton]} onPress={handleManualSearch}>
          <Text style={[styles.actionButtonText, styles.secondaryActionButtonText]}>Manual Search</Text>
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
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  capturedPhoto: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  extractedInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  extractedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  extractedText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  resultsSection: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
    paddingBottom: 8,
    color: '#333',
  },
  listContainer: {
    paddingVertical: 8,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  actionButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryActionButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  secondaryActionButtonText: {
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
