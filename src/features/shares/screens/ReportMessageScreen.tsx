import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useKeyboardHeight } from '../../../hooks/useKeyboardHeight';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { SharesStackParamList } from '../SharesStack';
import { useReportMessage } from '../hooks/useReportMessage';
import { ReportCategory } from '../types/chat';

type ReportMessageNavigationProp = StackNavigationProp<SharesStackParamList, 'ReportMessage'>;
type ReportMessageRouteProp = RouteProp<SharesStackParamList, 'ReportMessage'>;

const CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: ReportCategory.Spam, label: 'Spam' },
  { value: ReportCategory.Harassment, label: 'Harassment' },
  { value: ReportCategory.InappropriateContent, label: 'Inappropriate Content' },
  { value: ReportCategory.Other, label: 'Other' },
];

export default function ReportMessageScreen() {
  const navigation = useNavigation<ReportMessageNavigationProp>();
  const route = useRoute<ReportMessageRouteProp>();
  const { shareId, messageId } = route.params;

  const scrollViewRef = useRef<ScrollView>(null);
  const keyboardHeight = useKeyboardHeight();
  const [footerHeight, setFooterHeight] = useState(0);

  useEffect(() => {
    if (keyboardHeight > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [keyboardHeight]);

  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { reportMessage, isSubmitting } = useReportMessage();

  const handleSubmit = async () => {
    if (!selectedCategory) return;
    setError(null);

    const result = await reportMessage(shareId, messageId, {
      category: selectedCategory,
      notes: notes.trim() || undefined,
    });

    if (result.success) {
      Toast.show({ type: 'success', text1: 'Report submitted' });
      navigation.goBack();
    } else if (result.alreadyReported) {
      Toast.show({ type: 'info', text1: 'Already reported', text2: 'You have already reported this message.' });
      navigation.goBack();
    } else {
      setError(result.error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Message</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.content,
          keyboardHeight > 0 && {
            paddingBottom: Platform.OS === 'android' ? 0 : Math.max(0, keyboardHeight - footerHeight),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={styles.subtitle}>
          Let us know why you&apos;re reporting this message. Your report is anonymous.
        </Text>

        <View style={styles.categoriesSection}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            return (
              <TouchableOpacity
                key={cat.value}
                style={[styles.categoryRow, isSelected && styles.categoryRowSelected]}
                onPress={() => setSelectedCategory(cat.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelSelected]}>
                  {cat.label}
                </Text>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.notesLabel}>Additional notes (optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Provide any additional context..."
          value={notes}
          onChangeText={setNotes}
          multiline
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{notes.length}/500</Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.footer} onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedCategory || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedCategory || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Report</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
    width: 60,
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    padding: 16,
    flexGrow: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 24,
    lineHeight: 20,
  },
  categoriesSection: {
    marginBottom: 24,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  categoryRowSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  categoryLabel: {
    fontSize: 16,
    color: '#000',
  },
  categoryLabelSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    color: '#000',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 12,
  },
  footer: {
    marginTop: 24,
    paddingBottom: 8,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
