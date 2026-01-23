import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Share } from '../types';
import { ShareStatus } from '../../../lib/constants';

export interface StatusStep {
  status: ShareStatus | 'disputed';
  label: string;
  description: string;
  actionLabel?: string;
  isTerminal?: boolean;
  terminalType?: 'success' | 'declined' | 'disputed';
}

const happyPathSteps: StatusStep[] = [
  {
    status: ShareStatus.Requested,
    label: 'Requested',
    description: 'Borrower has requested this book',
    actionLabel: 'Mark as Ready'
  },
  {
    status: ShareStatus.Ready,
    label: 'Ready',
    description: 'Book is ready for pickup',
    actionLabel: 'Mark as Picked Up'
  },
  {
    status: ShareStatus.PickedUp,
    label: 'Picked Up',
    description: 'Book has been picked up',
    actionLabel: 'Mark as Returned'
  },
  {
    status: ShareStatus.Returned,
    label: 'Returned',
    description: 'Book has been returned',
    actionLabel: 'Confirm Home Safe'
  },
  {
    status: ShareStatus.HomeSafe,
    label: 'Home Safe',
    description: 'Book is safely returned to owner',
    isTerminal: true,
    terminalType: 'success'
  }
];

const declinedStep: StatusStep = {
  status: ShareStatus.Declined,
  label: 'Declined',
  description: 'Lender declined this request',
  isTerminal: true,
  terminalType: 'declined'
};

const disputedStep: StatusStep = {
  status: 'disputed',
  label: 'Disputed',
  description: 'Share was disputed',
  isTerminal: true,
  terminalType: 'disputed'
};

export function getTimelineSteps(share: Share): StatusStep[] {
  // Declined: Show Requested → Declined
  if (share.status === ShareStatus.Declined) {
    return [happyPathSteps[0], declinedStep];
  }

  // Disputed: Show steps up to current status → Disputed
  if (share.isDisputed) {
    const stepsBeforeDispute = happyPathSteps.filter(step =>
      typeof step.status === 'number' && step.status <= share.status
    );
    return [...stepsBeforeDispute, disputedStep];
  }

  // HomeSafe or active shares: Show full happy path
  return happyPathSteps;
}

interface ShareStatusTimelineProps {
  share: Share;
  isOwner: boolean;
  isBorrower: boolean;
  onStatusUpdate?: (newStatus: ShareStatus) => void;
  hasStatusNotification?: boolean;
  isBookDeleted?: boolean;
}

export default function ShareStatusTimeline({
  share,
  isOwner,
  isBorrower,
  onStatusUpdate,
  hasStatusNotification = false,
  isBookDeleted = false
}: ShareStatusTimelineProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const prevNotificationRef = useRef(false);

  useEffect(() => {
    // Only start animation when notification changes from false → true
    // Animation continues indefinitely once started
    const notificationJustAppeared = hasStatusNotification && !prevNotificationRef.current;
    prevNotificationRef.current = hasStatusNotification;

    if (notificationJustAppeared && !isAnimating) {
      setIsAnimating(true);

      // Create infinite pulsing animation
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );

      animationRef.current.start();
    }
  }, [hasStatusNotification]);

  // Cleanup: stop animation only when component unmounts
  useEffect(() => {
    return () => {
      animationRef.current?.stop();
    };
  }, []);
  const timelineSteps = getTimelineSteps(share);

  const getNextValidStatus = (currentStatus: ShareStatus): ShareStatus | null => {
    const currentIndex = happyPathSteps.findIndex(step => step.status === currentStatus);
    if (currentIndex === -1 || currentIndex === happyPathSteps.length - 1) {
      return null;
    }
    const nextStep = happyPathSteps[currentIndex + 1];
    return typeof nextStep.status === 'number' ? nextStep.status : null;
  };

  const canUserProgressStatus = (currentStatus: ShareStatus): boolean => {
    switch (currentStatus) {
      case ShareStatus.Requested:
        return isOwner; // Only owner can mark as ready
      case ShareStatus.Ready:
        return isBorrower; // Only borrower can mark as picked up
      case ShareStatus.PickedUp:
        return isBorrower; // Only borrower can mark as returned
      case ShareStatus.Returned:
        return isOwner; // Only owner can confirm home safe
      default:
        return false;
    }
  };

  const handleStatusProgress = () => {
    const nextStatus = getNextValidStatus(share.status);
    if (!nextStatus || !canUserProgressStatus(share.status)) {
      return;
    }

    const currentStep = happyPathSteps.find(step => step.status === share.status);
    Alert.alert(
      'Update Status',
      `${currentStep?.actionLabel}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            if (onStatusUpdate) {
              onStatusUpdate(nextStatus);
            }
          }
        }
      ]
    );
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Share Request',
      'Are you sure you want to decline this share request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            if (onStatusUpdate) {
              onStatusUpdate(ShareStatus.Declined);
            }
          }
        }
      ]
    );
  };

  // Helper to determine step state
  const getStepState = (step: StatusStep, index: number) => {
    const isTerminalStep = step.isTerminal && (step.terminalType === 'declined' || step.terminalType === 'disputed');
    const isLastStep = index === timelineSteps.length - 1;

    // For terminal declined/disputed states, the terminal step itself is "current"
    if (isTerminalStep && isLastStep) {
      return { isCompleted: false, isCurrent: true, isTerminal: true, terminalType: step.terminalType };
    }

    // For steps before the terminal, they are completed
    if (isTerminalStep) {
      return { isCompleted: true, isCurrent: false, isTerminal: false, terminalType: undefined };
    }

    // Normal flow for active shares and HomeSafe
    const stepStatus = typeof step.status === 'number' ? step.status : -1;
    const isCompleted = share.status > stepStatus;
    const isCurrent = share.status === stepStatus;

    return { isCompleted, isCurrent, isTerminal: step.isTerminal || false, terminalType: step.terminalType };
  };

  // Helper to get line color based on the next step
  const getLineStyle = (nextStep: StatusStep | undefined, currentStepCompleted: boolean) => {
    if (!nextStep) return styles.timelineLine;

    if (nextStep.terminalType === 'declined') {
      return [styles.timelineLine, styles.timelineLineDeclined];
    }
    if (nextStep.terminalType === 'disputed') {
      return [styles.timelineLine, styles.timelineLineDisputed];
    }
    if (currentStepCompleted) {
      return [styles.timelineLine, styles.timelineLineCompleted];
    }
    return styles.timelineLine;
  };

  // Render icon based on step state
  const renderIcon = (_step: StatusStep, index: number, stepState: ReturnType<typeof getStepState>) => {
    const { isCompleted, isCurrent, terminalType } = stepState;

    if (terminalType === 'declined') {
      return <Ionicons name="close" size={16} color="#fff" />;
    }
    if (terminalType === 'disputed') {
      return <Ionicons name="warning" size={16} color="#fff" />;
    }
    if (isCompleted) {
      return <Ionicons name="checkmark" size={16} color="#fff" />;
    }
    return (
      <Text style={[
        styles.timelineIconText,
        isCurrent && styles.timelineIconTextCurrent
      ]}>
        {index + 1}
      </Text>
    );
  };

  // Show withdrawn message instead of timeline if book was deleted
  if (isBookDeleted) {
    return (
      <View style={styles.bookWithdrawnContainer}>
        <Ionicons name="information-circle" size={24} color="#856404" />
        <Text style={styles.bookWithdrawnText}>
          This book has been removed from the lender's library. Please coordinate the return if possible.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.timelineContainer}>
      {timelineSteps.map((step, index) => {
        const stepState = getStepState(step, index);
        const { isCompleted, isCurrent, terminalType } = stepState;
        const canProgress = isCurrent && !terminalType && !share.isDisputed && canUserProgressStatus(share.status);
        const shouldPulse = isCurrent && isAnimating && !terminalType;
        const nextStep = timelineSteps[index + 1];

        return (
          <View key={String(step.status)} style={styles.timelineStep}>
            <View style={styles.timelineRow}>
              <Animated.View style={[
                styles.timelineIcon,
                isCompleted && styles.timelineIconCompleted,
                isCurrent && !terminalType && styles.timelineIconCurrent,
                terminalType === 'declined' && styles.timelineIconDeclined,
                terminalType === 'disputed' && styles.timelineIconDisputed,
                shouldPulse && styles.timelineIconNotification,
                shouldPulse && { transform: [{ scale: pulseAnim }] }
              ]}>
                {renderIcon(step, index, stepState)}
              </Animated.View>
              <View style={styles.timelineContent}>
                <Text style={[
                  styles.timelineLabel,
                  isCurrent && !terminalType && styles.timelineLabelCurrent,
                  terminalType === 'declined' && styles.timelineLabelDeclined,
                  terminalType === 'disputed' && styles.timelineLabelDisputed
                ]}>
                  {step.label}
                </Text>
                <Text style={styles.timelineDescription}>
                  {step.description}
                </Text>
                {canProgress && step.actionLabel && (
                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                      style={styles.progressButton}
                      onPress={handleStatusProgress}
                    >
                      <Text style={styles.progressButtonText}>
                        {step.actionLabel}
                      </Text>
                    </TouchableOpacity>
                    {share.status === ShareStatus.Requested && isOwner && (
                      <TouchableOpacity
                        style={styles.declineButton}
                        onPress={handleDecline}
                      >
                        <Text style={styles.declineButtonText}>
                          Decline Share
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>
            {index < timelineSteps.length - 1 && (
              <View style={getLineStyle(nextStep, isCompleted)} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  timelineContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  timelineStep: {
    marginBottom: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineIconCompleted: {
    backgroundColor: '#4CAF50',
  },
  timelineIconCurrent: {
    backgroundColor: '#007AFF',
  },
  timelineIconDeclined: {
    backgroundColor: '#FF3B30',
  },
  timelineIconDisputed: {
    backgroundColor: '#FF9500',
  },
  timelineIconNotification: {
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },
  timelineIconText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B6B6B',
  },
  timelineIconTextCurrent: {
    color: '#fff',
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 8,
  },
  timelineLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C3A5B',
    marginBottom: 2,
  },
  timelineLabelCurrent: {
    color: '#007AFF',
  },
  timelineLabelDeclined: {
    color: '#FF3B30',
  },
  timelineLabelDisputed: {
    color: '#FF9500',
  },
  timelineDescription: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 8,
  },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 32,
    width: 2,
    height: 24,
    backgroundColor: '#e0e0e0',
  },
  timelineLineCompleted: {
    backgroundColor: '#4CAF50',
  },
  timelineLineDeclined: {
    backgroundColor: '#FF3B30',
  },
  timelineLineDisputed: {
    backgroundColor: '#FF9500',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  progressButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  progressButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  declineButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bookWithdrawnContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3CD',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFEAA7',
    gap: 12,
  },
  bookWithdrawnText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
    lineHeight: 20,
  },
});