import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../auth/api/authApi';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all personal data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            setIsDeletingAccount(true);
            try {
              await authApi.deleteAccount();
            } catch {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
              return;
            } finally {
              setIsDeletingAccount(false);
            }
            Toast.show({ type: 'success', text1: '✓ Account deleted', visibilityTime: 2000 });
            logout();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>
      <Text style={styles.subtitle}>Welcome, {user?.firstName || 'User'}!</Text>

      <View style={styles.content}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dangerZone}>
        <Text style={styles.dangerZoneLabel}>DANGER ZONE</Text>
        <TouchableOpacity
          style={[styles.deleteButton, isDeletingAccount && styles.deleteButtonDisabled]}
          onPress={handleDeleteAccount}
          disabled={isDeletingAccount}
        >
          <Text style={[styles.deleteButtonText, isDeletingAccount && styles.deleteButtonTextDisabled]}>
            {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C3A5B',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  logoutButton: {
    backgroundColor: '#C4443C',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerZone: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  dangerZoneLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 8,
  },
  deleteButton: {
    borderWidth: 1.5,
    borderColor: '#C4443C',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    borderColor: '#ccc',
  },
  deleteButtonText: {
    color: '#C4443C',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButtonTextDisabled: {
    color: '#ccc',
  },
});
