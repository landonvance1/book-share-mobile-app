import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { SearchStack } from '../features/books/SearchStack';
import { LibraryStack } from '../features/library/LibraryStack';
import { SharesStack } from '../features/shares/SharesStack';
import { CommunitiesStack } from '../features/communities/CommunitiesStack';
import SettingsScreen from '../features/settings/SettingsScreen';
import { useShareUnreadCount } from '../features/notifications/hooks/useNotifications';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const unreadCount = useShareUnreadCount();

  return (
    <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: any;

            switch (route.name) {
              case 'Search':
                iconName = focused ? 'search' : 'search-outline';
                break;
              case 'Library':
                iconName = focused ? 'library' : 'library-outline';
                break;
              case 'Shares':
                iconName = focused ? 'gift' : 'gift-outline';
                break;
              case 'Communities':
                iconName = focused ? 'people' : 'people-outline';
                break;
              case 'Settings':
                iconName = focused ? 'settings' : 'settings-outline';
                break;
              default:
                iconName = 'circle';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        })}
      >
        <Tab.Screen name="Search" component={SearchStack} />
        <Tab.Screen name="Library" component={LibraryStack} />
        <Tab.Screen
          name="Shares"
          component={SharesStack}
          options={{
            tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          }}
        />
        <Tab.Screen name="Communities" component={CommunitiesStack} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
  );
}