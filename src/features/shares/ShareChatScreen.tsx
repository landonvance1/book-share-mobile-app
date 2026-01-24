import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SharesStackParamList } from './SharesStack';
import ShareChat from './components/ShareChat';
import { useMarkChatNotificationsRead } from '../notifications/hooks/useNotifications';

type ShareChatNavigationProp = StackNavigationProp<SharesStackParamList, 'ShareChat'>;
type ShareChatRouteProp = RouteProp<SharesStackParamList, 'ShareChat'>;

export default function ShareChatScreen() {
  const navigation = useNavigation<ShareChatNavigationProp>();
  const route = useRoute<ShareChatRouteProp>();
  const { share } = route.params;
  const markChatNotificationsRead = useMarkChatNotificationsRead(share.id);

  const { userBook } = share;
  const { book } = userBook;

  // Mark chat notifications as read when screen mounts
  useEffect(() => {
    markChatNotificationsRead.mutate(undefined, {
      onError: (error) => {
        console.error('Failed to mark chat notifications as read:', error);
        // Silently fail - don't show error to user for this background operation
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{book.title}</Text>
          <Text style={styles.headerSubtitle}>by {book.author}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Chat Content */}
      <ShareChat share={share} />
    </KeyboardAvoidingView>
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
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C3A5B',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B6B6B',
    textAlign: 'center',
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
});