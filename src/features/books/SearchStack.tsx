import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { BookSearchPage } from './components/BookSearchPage';
import { ShareRequestScreen } from './screens/ShareRequestScreen';
import { SearchBookResult } from './types';

export type SearchStackParamList = {
  BookSearch: undefined;
  ShareRequest: { book: SearchBookResult };
};

const Stack = createStackNavigator<SearchStackParamList>();

export function SearchStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BookSearch" component={BookSearchPage} />
      <Stack.Screen
        name="ShareRequest"
        component={ShareRequestScreen}
        options={{
          headerShown: true,
          title: 'Borrow Book',
          headerBackTitle: '',
        }}
      />
    </Stack.Navigator>
  );
}
