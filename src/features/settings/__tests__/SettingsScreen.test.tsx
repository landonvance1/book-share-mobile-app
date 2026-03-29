import React from 'react';
import { render, fireEvent, waitFor, screen, act } from '../../../__tests__/utils/test-utils';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import SettingsScreen from '../SettingsScreen';
import { authApi } from '../../auth/api/authApi';

jest.mock('react-native-toast-message', () => ({ show: jest.fn() }));

jest.mock('../../auth/api/authApi', () => ({
  authApi: {
    deleteAccount: jest.fn(),
  },
}));

const mockLogout = jest.fn();

jest.mock('../../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../../contexts/AuthContext'),
  useAuth: () => ({
    user: { id: 'user-1', firstName: 'Test', lastName: 'User', fullName: 'Test User', email: 'test@example.com' },
    logout: mockLogout,
  }),
}));

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert');
    jest.spyOn(Toast, 'show');
  });

  it('renders Logout and Delete Account buttons', () => {
    render(<SettingsScreen />, { withAuth: false });

    expect(screen.getByText('Logout')).toBeTruthy();
    expect(screen.getByText('Delete Account')).toBeTruthy();
  });

  it('shows confirmation dialog when Delete Account is pressed', () => {
    render(<SettingsScreen />, { withAuth: false });

    fireEvent.press(screen.getByText('Delete Account'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Account',
      expect.stringContaining('permanently delete'),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Delete Account', style: 'destructive' }),
      ])
    );
  });

  it('calls deleteAccount, shows success toast, then calls logout when confirmed', async () => {
    (authApi.deleteAccount as jest.Mock).mockResolvedValue(undefined);
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      const confirm = buttons.find((b: any) => b.style === 'destructive');
      confirm?.onPress?.();
    });

    render(<SettingsScreen />, { withAuth: false });
    fireEvent.press(screen.getByText('Delete Account'));

    await waitFor(() => {
      expect(authApi.deleteAccount).toHaveBeenCalledTimes(1);
      expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  it('shows error alert, re-enables button, and does not logout when deleteAccount fails', async () => {
    (authApi.deleteAccount as jest.Mock).mockRejectedValue(new Error('Server error'));
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      const confirm = buttons?.find((b: any) => b.style === 'destructive');
      confirm?.onPress?.();
    });

    render(<SettingsScreen />, { withAuth: false });
    fireEvent.press(screen.getByText('Delete Account'));

    await waitFor(() => {
      expect(mockLogout).not.toHaveBeenCalled();
      expect(Toast.show).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith('Error', expect.any(String));
      expect(screen.getByText('Delete Account')).toBeTruthy();
    });
  });

  it('does not call deleteAccount when Cancel is pressed', () => {
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      const cancel = buttons.find((b: any) => b.style === 'cancel');
      cancel?.onPress?.();
    });

    render(<SettingsScreen />, { withAuth: false });
    fireEvent.press(screen.getByText('Delete Account'));

    expect(authApi.deleteAccount).not.toHaveBeenCalled();
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('disables the button while deletion is in progress', async () => {
    let resolveDelete: () => void;
    (authApi.deleteAccount as jest.Mock).mockReturnValue(
      new Promise<void>(resolve => { resolveDelete = resolve; })
    );
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      const confirm = buttons.find((b: any) => b.style === 'destructive');
      confirm?.onPress?.();
    });

    render(<SettingsScreen />, { withAuth: false });
    fireEvent.press(screen.getByText('Delete Account'));

    await waitFor(() => {
      expect(screen.getByText('Deleting...')).toBeTruthy();
    });

    await act(async () => { resolveDelete!(); });
  });
});
