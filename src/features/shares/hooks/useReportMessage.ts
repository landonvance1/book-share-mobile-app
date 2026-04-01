import { useState, useCallback } from 'react';
import { ApiError } from '../../../lib/api';
import { chatApi } from '../api/chatApi';
import { ReportMessageRequest } from '../types/chat';

type ReportResult =
  | { success: true }
  | { success: false; alreadyReported: true }
  | { success: false; alreadyReported: false; error: string };

interface UseReportMessageReturn {
  reportMessage: (shareId: number, messageId: number, body: ReportMessageRequest) => Promise<ReportResult>;
  isSubmitting: boolean;
}

export const useReportMessage = (): UseReportMessageReturn => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportMessage = useCallback(async (
    shareId: number,
    messageId: number,
    body: ReportMessageRequest
  ): Promise<ReportResult> => {
    setIsSubmitting(true);

    try {
      await chatApi.reportMessage(shareId, messageId, body);
      return { success: true };
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          return { success: false, alreadyReported: true };
        }
        if (err.status === 400) {
          return { success: false, alreadyReported: false, error: 'You cannot report your own messages.' };
        }
        if (err.status === 403) {
          return { success: false, alreadyReported: false, error: "You don't have access to this chat." };
        }
      }
      return { success: false, alreadyReported: false, error: 'Something went wrong. Please try again.' };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { reportMessage, isSubmitting };
};
