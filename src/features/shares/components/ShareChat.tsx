import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatApi } from '../api/chatApi';
import { signalRService } from '../services/signalRService';
import { ChatMessage, ConnectionStatus, ChatState } from '../types/chat';
import { Share } from '../types';
import { useAuth } from '../../../contexts/AuthContext';

interface ShareChatProps {
  share: Share;
}

const MAX_MESSAGE_LENGTH = 2000;
const RATE_LIMIT_WARNING_THRESHOLD = 25; // Warn at 25 messages (5 before limit)

export default function ShareChat({ share }: ShareChatProps) {
  const { user } = useAuth();
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    connectionStatus: ConnectionStatus.Disconnected,
    isLoading: false,
    error: null,
    hasMoreMessages: false,
    currentPage: 1,
  });
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [recentMessageCount, setRecentMessageCount] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Initialize chat when component mounts
  useEffect(() => {
    initializeChat();
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [share.id]);

  // Track recent messages for rate limiting
  useEffect(() => {
    const timer = setInterval(() => {
      setRecentMessageCount(0); // Reset every 2 minutes
    }, 2 * 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  const loadMessages = async (page: number = 1) => {
    try {
      const response = await chatApi.getChatMessages(share.id, { page, pageSize: 50 });

      setChatState(prev => ({
        ...prev,
        messages: page === 1 ? response.messages : [...prev.messages, ...response.messages],
        hasMoreMessages: response.hasNextPage,
        currentPage: page,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to load messages:', error);
      setChatState(prev => ({
        ...prev,
        error: 'Failed to load messages',
        isLoading: false,
      }));
    }
  };

  const initializeChat = useCallback(async () => {
    try {
      setChatState(prev => ({ ...prev, isLoading: true, error: null }));

      // Initialize SignalR connection
      await signalRService.initialize();

      // Set up event listeners
      const unsubscribeStatus = signalRService.onConnectionStatusChange((status) => {
        setChatState(prev => ({ ...prev, connectionStatus: status }));
      });

      const unsubscribeMessages = signalRService.onMessageReceived((message) => {
        setChatState(prev => ({
          ...prev,
          messages: [message, ...prev.messages],
        }));
        // Scroll to bottom when new message arrives
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 100);
      });

      const unsubscribeError = signalRService.onError((error) => {
        setChatState(prev => ({ ...prev, error }));
        Alert.alert('Connection Error', error);
      });

      // Join the share chat room
      if (signalRService.isConnected) {
        await signalRService.joinShareChat(share.id);
      }

      // Load message history
      await loadMessages();

      // Store unsubscribe functions for cleanup
      (window as any).chatUnsubscribers = [unsubscribeStatus, unsubscribeMessages, unsubscribeError];

    } catch (error) {
      console.error('Failed to initialize chat:', error);
      setChatState(prev => ({
        ...prev,
        error: 'Failed to initialize chat',
        isLoading: false,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [share.id]);

  const cleanup = useCallback(async () => {
    try {
      await signalRService.leaveShareChat(share.id);
      await signalRService.disconnect();

      // Clean up event listeners
      const unsubscribers = (window as any).chatUnsubscribers || [];
      unsubscribers.forEach((unsub: () => void) => unsub());
      (window as any).chatUnsubscribers = null;
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }, [share.id]);

  const sendMessage = async () => {
    const content = messageInput.trim();
    if (!content || isSending) return;

    // Rate limiting check
    if (recentMessageCount >= 30) {
      Alert.alert('Slow Down', 'You\'re sending messages too quickly. Please wait a moment.');
      return;
    }

    // Character limit check
    if (content.length > MAX_MESSAGE_LENGTH) {
      Alert.alert('Message Too Long', `Messages must be ${MAX_MESSAGE_LENGTH} characters or less.`);
      return;
    }

    setIsSending(true);

    // Small delay to let iOS autocorrect finish before clearing
    setTimeout(() => {
      setMessageInput('');
    }, 100);

    try {
      // Try SignalR first, fallback to REST
      if (signalRService.isConnected) {
        await signalRService.sendMessage(share.id, content);
      } else {
        // Fallback to REST API
        const message = await chatApi.sendMessage(share.id, { content });
        setChatState(prev => ({
          ...prev,
          messages: [message, ...prev.messages],
        }));
      }

      // Track recent messages for rate limiting
      setRecentMessageCount(prev => prev + 1);

      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);

    } catch (error) {
      console.error('Failed to send message:', error);
      setMessageInput(content); // Restore message content
      Alert.alert('Failed to Send', 'Unable to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const loadMoreMessages = () => {
    if (chatState.hasMoreMessages && !chatState.isLoading) {
      loadMessages(chatState.currentPage + 1);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isCurrentUser = item.sender.id === user?.id;
    const messageDate = new Date(item.sentAt);

    // Format date with relative display for today/yesterday
    const formatDateTime = (date: Date): string => {
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      const diffInMs = today.getTime() - messageDay.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (diffInDays === 0) {
        return `Today ${timeString}`;
      } else if (diffInDays === 1) {
        return `Yesterday ${timeString}`;
      } else {
        return date.toLocaleDateString([], {
          month: 'short',
          day: 'numeric',
          year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined
        }) + ` ${timeString}`;
      }
    };

    const timeString = formatDateTime(messageDate);

    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
        ]}>
          <Text style={[
            styles.messageText,
            isCurrentUser ? styles.currentUserText : styles.otherUserText
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.messageTime,
            isCurrentUser ? styles.currentUserTime : styles.otherUserTime
          ]}>
            {timeString}
          </Text>
        </View>
      </View>
    );
  };


  const renderRateLimitWarning = () => {
    if (recentMessageCount < RATE_LIMIT_WARNING_THRESHOLD) {
      return null;
    }

    return (
      <View style={styles.warningContainer}>
        <Ionicons name="warning" size={16} color="#FF9500" />
        <Text style={styles.warningText}>
          Sending quickly ({recentMessageCount}/30)
        </Text>
      </View>
    );
  };

  if (chatState.isLoading && chatState.messages.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={chatState.messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        inverted
        onEndReached={loadMoreMessages}
        onEndReachedThreshold={0.1}
        ListFooterComponent={chatState.hasMoreMessages ? (
          <ActivityIndicator size="small" color="#007AFF" style={styles.loadMoreIndicator} />
        ) : null}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      />

      {renderRateLimitWarning()}

      <View style={styles.inputContainerWrapper}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            value={messageInput}
            onChangeText={setMessageInput}
            multiline
            maxLength={MAX_MESSAGE_LENGTH}
            editable={!isSending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageInput.trim() || isSending) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!messageInput.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B6B6B',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loadMoreIndicator: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 8,
  },
  currentUserMessage: {
    alignItems: 'flex-end',
  },
  otherUserMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 8,
    borderRadius: 16,
  },
  currentUserBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: '#e0e0e0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 2,
  },
  currentUserText: {
    color: '#fff',
  },
  otherUserText: {
    color: '#000',
  },
  messageTime: {
    fontSize: 11,
    opacity: 0.7,
  },
  currentUserTime: {
    color: '#fff',
    alignSelf: 'flex-end',
  },
  otherUserTime: {
    color: '#6B6B6B',
    alignSelf: 'flex-start',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFF3CD',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 6,
  },
  warningText: {
    fontSize: 12,
    color: '#FF9500',
    marginLeft: 4,
  },
  inputContainerWrapper: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
});