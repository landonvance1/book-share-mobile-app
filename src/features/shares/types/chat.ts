import { User } from "../../../types/auth";

export enum ReportCategory {
  Spam = 1,
  Harassment = 2,
  InappropriateContent = 3,
  Other = 4,
}

export interface ReportMessageRequest {
  category: ReportCategory;
  notes?: string;
}

export interface ChatMessage {
  id: number;
  content: string;
  sender: User;
  senderName: string;
  shareId: number;
  sentAt: string;
  isSystemMessage: boolean;
}

export interface SendMessageRequest {
  content: string;
}

export interface ChatMessagesResponse {
  messages: ChatMessage[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

export interface ChatPaginationParams {
  page?: number;
  pageSize?: number;
}

export enum ConnectionStatus {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
  Reconnecting = 'reconnecting',
  Failed = 'failed'
}

export interface ChatState {
  messages: ChatMessage[];
  connectionStatus: ConnectionStatus;
  isLoading: boolean;
  error: string | null;
  hasMoreMessages: boolean;
  currentPage: number;
}