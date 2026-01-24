import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel
} from '@microsoft/signalr';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../../../lib/constants';
import { ChatMessage, ConnectionStatus } from '../types/chat';

class SignalRService {
  private connection: HubConnection | null = null;
  private connectionStatus: ConnectionStatus = ConnectionStatus.Disconnected;
  private statusListeners: ((status: ConnectionStatus) => void)[] = [];
  private messageListeners: ((message: ChatMessage) => void)[] = [];
  private errorListeners: ((error: string) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelayMs = 1000;

  async initialize(): Promise<void> {
    if (this.connection) {
      await this.disconnect();
    }

    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const hubUrl = `${API_BASE_URL}/chathub?access_token=${encodeURIComponent(token)}`;

      this.connection = new HubConnectionBuilder()
        .withUrl(hubUrl)
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.previousRetryCount >= this.maxReconnectAttempts) {
              return null; // Stop retrying
            }
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          }
        })
        .configureLogging(LogLevel.Information)
        .build();

      this.setupEventHandlers();
      await this.connect();
    } catch (error) {
      console.error('Failed to initialize SignalR connection:', error);
      this.updateConnectionStatus(ConnectionStatus.Failed);
      this.notifyError(`Connection initialization failed: ${error}`);
    }
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Connection state changes
    this.connection.onclose(() => {
      this.updateConnectionStatus(ConnectionStatus.Disconnected);
    });

    this.connection.onreconnecting(() => {
      this.updateConnectionStatus(ConnectionStatus.Reconnecting);
    });

    this.connection.onreconnected(() => {
      this.reconnectAttempts = 0;
      this.updateConnectionStatus(ConnectionStatus.Connected);
    });

    // Hub events
    this.connection.on('ReceiveMessage', (message: ChatMessage) => {
      this.notifyMessageReceived(message);
    });

    this.connection.on('JoinedChat', (_shareId: number) => {
      // Chat joined successfully
    });

    this.connection.on('LeftChat', (_shareId: number) => {
      // Chat left successfully
    });

    this.connection.on('Error', (error: string) => {
      console.error('SignalR hub error:', error);
      this.notifyError(error);
    });
  }

  private async connect(): Promise<void> {
    if (!this.connection) {
      throw new Error('Connection not initialized');
    }

    try {
      this.updateConnectionStatus(ConnectionStatus.Connecting);
      await this.connection.start();
      this.updateConnectionStatus(ConnectionStatus.Connected);
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('Failed to connect to SignalR:', error);
      this.updateConnectionStatus(ConnectionStatus.Failed);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection && this.connection.state !== HubConnectionState.Disconnected) {
      try {
        await this.connection.stop();
      } catch {
        // Ignore disconnect errors
      }
    }
    this.connection = null;
    this.updateConnectionStatus(ConnectionStatus.Disconnected);
  }

  async joinShareChat(shareId: number): Promise<void> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      throw new Error('Connection not established');
    }

    try {
      await this.connection.invoke('JoinShareChat', shareId);
    } catch (error) {
      throw error;
    }
  }

  async leaveShareChat(shareId: number): Promise<void> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      return;
    }

    try {
      await this.connection.invoke('LeaveShareChat', shareId);
    } catch {
      // Ignore leave errors
    }
  }

  async sendMessage(shareId: number, content: string): Promise<void> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      throw new Error('Connection not established');
    }

    try {
      await this.connection.invoke('SendMessage', shareId, content);
    } catch (error) {
      throw error;
    }
  }

  // Event listeners
  onConnectionStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.push(callback);
    // Return unsubscribe function
    return () => {
      const index = this.statusListeners.indexOf(callback);
      if (index > -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  onMessageReceived(callback: (message: ChatMessage) => void): () => void {
    this.messageListeners.push(callback);
    return () => {
      const index = this.messageListeners.indexOf(callback);
      if (index > -1) {
        this.messageListeners.splice(index, 1);
      }
    };
  }

  onError(callback: (error: string) => void): () => void {
    this.errorListeners.push(callback);
    return () => {
      const index = this.errorListeners.indexOf(callback);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  // Private helper methods
  private updateConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.statusListeners.forEach(listener => listener(status));
  }

  private notifyMessageReceived(message: ChatMessage): void {
    this.messageListeners.forEach(listener => listener(message));
  }

  private notifyError(error: string): void {
    this.errorListeners.forEach(listener => listener(error));
  }

  // Getters
  get currentConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  get isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }
}

// Export singleton instance
export const signalRService = new SignalRService();