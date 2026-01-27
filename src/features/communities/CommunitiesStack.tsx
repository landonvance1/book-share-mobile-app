import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CommunitiesScreen from './CommunitiesScreen';
import CommunityScannerScreen from './screens/CommunityScannerScreen';

export type CommunitiesStackParamList = {
  CommunitiesMain: undefined;
  CommunityScanner: undefined;
};

const Stack = createStackNavigator<CommunitiesStackParamList>();

export function CommunitiesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CommunitiesMain"
        component={CommunitiesScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CommunityScanner"
        component={CommunityScannerScreen}
        options={{
          headerShown: true,
          title: 'Scan to Join',
          headerBackTitle: '',
        }}
      />
    </Stack.Navigator>
  );
}
