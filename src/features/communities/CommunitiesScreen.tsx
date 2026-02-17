import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { communitiesApi } from './api/communitiesApi';
import { CommunityWithMemberCount } from './types';
import { useAuth } from '../../contexts/AuthContext';
import AddCommunityForm from './components/AddCommunityForm';
import { QRCodeModal } from './components/QRCodeModal';
import { CommunitiesStackParamList } from './CommunitiesStack';
import { Ionicons } from '@expo/vector-icons';

type CommunitiesScreenNavigationProp = StackNavigationProp<
  CommunitiesStackParamList,
  'CommunitiesMain'
>;

export default function CommunitiesScreen() {
  const navigation = useNavigation<CommunitiesScreenNavigationProp>();
  const [communities, setCommunities] = useState<CommunityWithMemberCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCommunityForQR, setSelectedCommunityForQR] = useState<CommunityWithMemberCount | null>(null);
  const { user } = useAuth();

  const loadCommunities = useCallback(async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        setCommunities([]);
        return;
      }
      const data = await communitiesApi.getUserCommunities(user.id);
      setCommunities(data);
    } catch (error) {
      console.error('Error loading communities:', error);
      Alert.alert('Error', 'Failed to load communities');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadCommunities();
  }, [loadCommunities]);

  // Reload communities when screen comes into focus (e.g., after joining via QR)
  useFocusEffect(
    useCallback(() => {
      loadCommunities();
    }, [loadCommunities])
  );

  const handleLeaveCommunity = async (communityId: number) => {
    if (!user?.id) return;

    Alert.alert(
      'Leave Community',
      'Are you sure you want to leave this community?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await communitiesApi.leaveCommunity(communityId);
              await loadCommunities(); // Reload the list
            } catch (error) {
              console.error('Error leaving community:', error);
              Alert.alert('Error', 'Failed to leave community');
            }
          }
        }
      ]
    );
  };

  const handleAddSuccess = async () => {
    setShowAddForm(false);
    await loadCommunities();
  };

  const renderCommunity = ({ item }: { item: CommunityWithMemberCount }) => (
    <View style={[styles.communityItem, !item.active && styles.inactiveCommunity]}>
      <View style={styles.communityInfo}>
        <Text style={[styles.communityName, !item.active && styles.inactiveText]}>{item.name}</Text>
        <Text style={[styles.memberCount, !item.active && styles.inactiveText]}>
          {item.memberCount || 0} {(item.memberCount || 0) === 1 ? 'member' : 'members'}
        </Text>
      </View>
      <View style={styles.communityActions}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => setSelectedCommunityForQR(item)}
        >
          <Ionicons name="qr-code-outline" size={20} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.leaveButton, !item.active && styles.inactiveButton]}
          onPress={() => handleLeaveCommunity(item.id)}
        >
          <Text style={[styles.leaveButtonText, !item.active && styles.inactiveText]}>Leave</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading communities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate('CommunityScanner')}
        >
          <Ionicons name="qr-code-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>My Communities</Text>
        <View style={styles.headerButtonContainer}>
          {!showAddForm && (
            <TouchableOpacity style={styles.addButton} onPress={() => setShowAddForm(true)}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showAddForm && (
        <AddCommunityForm
          onSuccess={handleAddSuccess}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {communities.length === 0 ? (
        <Text style={styles.subtitle}>No communities found</Text>
      ) : (
        <FlatList
          data={communities}
          renderItem={renderCommunity}
          keyExtractor={(item) => item.id.toString()}
          style={styles.list}
        />
      )}

      <QRCodeModal
        visible={selectedCommunityForQR !== null}
        onClose={() => setSelectedCommunityForQR(null)}
        communityId={selectedCommunityForQR?.id || 0}
        communityName={selectedCommunityForQR?.name || ''}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F7F4',
    padding: 8,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F7F4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  scanButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonContainer: {
    width: 44,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C3A5B',
    flex: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B6B6B',
    textAlign: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B6B6B',
  },
  list: {
    flex: 1,
  },
  communityItem: {
    backgroundColor: '#FEFCF9',
    padding: 16,
    marginBottom: 8,
    marginHorizontal: 8,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#1C3A5B',
    shadowOffset: {
      width: 2,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  inactiveCommunity: {
    backgroundColor: '#E8E6E3',
    opacity: 0.7,
  },
  communityInfo: {
    flex: 1,
  },
  communityActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareButton: {
    backgroundColor: '#F0F0F0',
    padding: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C3A5B',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 14,
    color: '#6B6B6B',
  },
  inactiveText: {
    color: '#6B6B6B',
  },
  leaveButton: {
    backgroundColor: '#C4443C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  leaveButtonText: {
    color: '#FEFCF9',
    fontSize: 14,
    fontWeight: '500',
  },
  inactiveButton: {
    backgroundColor: '#4CAF50',
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
});