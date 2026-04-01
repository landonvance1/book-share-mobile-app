import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SharesScreen from './SharesScreen';
import ShareDetailsScreen from './ShareDetailsScreen';
import ShareChatScreen from './ShareChatScreen';
import ArchivedSharesScreen from './ArchivedSharesScreen';
import ReportMessageScreen from './screens/ReportMessageScreen';
import { Share } from './types';

export type SharesStackParamList = {
  SharesList: undefined;
  ShareDetails: { share: Share; isArchived?: boolean };
  ShareChat: { share: Share };
  ArchivedShares: undefined;
  ReportMessage: { shareId: number; messageId: number };
};

const Stack = createStackNavigator<SharesStackParamList>();

export const SharesStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SharesList" component={SharesScreen} />
      <Stack.Screen name="ShareDetails" component={ShareDetailsScreen} />
      <Stack.Screen name="ShareChat" component={ShareChatScreen} />
      <Stack.Screen name="ArchivedShares" component={ArchivedSharesScreen} />
      <Stack.Screen name="ReportMessage" component={ReportMessageScreen} />
    </Stack.Navigator>
  );
};