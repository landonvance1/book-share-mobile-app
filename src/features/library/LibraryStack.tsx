import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LibraryScreen from './LibraryScreen';
import BarcodeScanner from './screens/BarcodeScanner';
import BookConfirmation from './screens/BookConfirmation';
import ExternalBookSearch from './screens/ExternalBookSearch';
import BookCoverScanner from './screens/BookCoverScanner';
import CoverMatchResults from './components/CoverMatchResults';
import { Book } from '../books/types';

export type LibraryStackParamList = {
  LibraryMain: { showSuccess?: boolean } | undefined;
  BarcodeScanner: undefined;
  BookCoverScanner: undefined;
  ExternalBookSearch: {
    prefillTitle?: string;
    prefillAuthor?: string;
  } | undefined;
  BookConfirmation:
    | {
        book: { id: number; title: string; author: string; thumbnailUrl: string };
        source: 'cover';
        capturedCoverUri: string;
      }
    | {
        book: { id: number; title: string; author: string; thumbnailUrl: string };
        source?: 'barcode' | 'search';
        capturedCoverUri?: undefined;
      };
  CoverMatchResults: {
    matches: Book[];
    capturedPhotoUri: string;
    extractedText: string;
  };
};

const Stack = createStackNavigator<LibraryStackParamList>();

export function LibraryStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="LibraryMain" 
        component={LibraryScreen}
      />
      <Stack.Screen
        name="BarcodeScanner"
        component={BarcodeScanner}
        options={{
          headerShown: true,
          title: 'Scan Book',
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="BookCoverScanner"
        component={BookCoverScanner}
        options={{
          headerShown: true,
          title: 'Scan Book Cover',
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="ExternalBookSearch"
        component={ExternalBookSearch}
        options={{
          headerShown: true,
          title: 'Add Book',
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="CoverMatchResults"
        component={CoverMatchResults}
        options={{
          headerShown: true,
          title: 'Select Book',
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="BookConfirmation"
        component={BookConfirmation}
        options={{
          headerShown: true,
          title: 'Add Book',
          headerBackTitle: '',
        }}
      />
    </Stack.Navigator>
  );
}