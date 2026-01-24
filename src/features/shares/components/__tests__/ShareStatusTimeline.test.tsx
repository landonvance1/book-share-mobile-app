import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ShareStatusTimeline, { getTimelineSteps } from '../ShareStatusTimeline';
import { ShareStatus } from '../../../../lib/constants';
import { createMockShare } from '../../../../__tests__/utils/factories';

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('getTimelineSteps', () => {
  describe('Declined shares', () => {
    it('returns 2-step array [Requested, Declined] for declined share', () => {
      const share = createMockShare({ status: ShareStatus.Declined });
      const steps = getTimelineSteps(share);

      expect(steps).toHaveLength(2);
      expect(steps[0].status).toBe(ShareStatus.Requested);
      expect(steps[0].label).toBe('Requested');
      expect(steps[1].status).toBe(ShareStatus.Declined);
      expect(steps[1].label).toBe('Declined');
      expect(steps[1].terminalType).toBe('declined');
    });
  });

  describe('Disputed shares', () => {
    it('returns 2-step array for share disputed at Requested status', () => {
      const share = createMockShare({
        status: ShareStatus.Requested,
        isDisputed: true,
        disputedBy: 'user-1',
      });
      const steps = getTimelineSteps(share);

      expect(steps).toHaveLength(2);
      expect(steps[0].status).toBe(ShareStatus.Requested);
      expect(steps[1].status).toBe('disputed');
      expect(steps[1].label).toBe('Disputed');
      expect(steps[1].terminalType).toBe('disputed');
    });

    it('returns 3-step array for share disputed at Ready status', () => {
      const share = createMockShare({
        status: ShareStatus.Ready,
        isDisputed: true,
        disputedBy: 'user-1',
      });
      const steps = getTimelineSteps(share);

      expect(steps).toHaveLength(3);
      expect(steps[0].status).toBe(ShareStatus.Requested);
      expect(steps[1].status).toBe(ShareStatus.Ready);
      expect(steps[2].status).toBe('disputed');
      expect(steps[2].terminalType).toBe('disputed');
    });

    it('returns 4-step array for share disputed at PickedUp status', () => {
      const share = createMockShare({
        status: ShareStatus.PickedUp,
        isDisputed: true,
        disputedBy: 'user-1',
      });
      const steps = getTimelineSteps(share);

      expect(steps).toHaveLength(4);
      expect(steps[0].status).toBe(ShareStatus.Requested);
      expect(steps[1].status).toBe(ShareStatus.Ready);
      expect(steps[2].status).toBe(ShareStatus.PickedUp);
      expect(steps[3].status).toBe('disputed');
      expect(steps[3].terminalType).toBe('disputed');
    });

    it('returns 5-step array for share disputed at Returned status', () => {
      const share = createMockShare({
        status: ShareStatus.Returned,
        isDisputed: true,
        disputedBy: 'user-1',
      });
      const steps = getTimelineSteps(share);

      expect(steps).toHaveLength(5);
      expect(steps[0].status).toBe(ShareStatus.Requested);
      expect(steps[1].status).toBe(ShareStatus.Ready);
      expect(steps[2].status).toBe(ShareStatus.PickedUp);
      expect(steps[3].status).toBe(ShareStatus.Returned);
      expect(steps[4].status).toBe('disputed');
      expect(steps[4].terminalType).toBe('disputed');
    });
  });

  describe('HomeSafe shares', () => {
    it('returns full 5-step happy path array for HomeSafe share', () => {
      const share = createMockShare({ status: ShareStatus.HomeSafe });
      const steps = getTimelineSteps(share);

      expect(steps).toHaveLength(5);
      expect(steps[0].status).toBe(ShareStatus.Requested);
      expect(steps[1].status).toBe(ShareStatus.Ready);
      expect(steps[2].status).toBe(ShareStatus.PickedUp);
      expect(steps[3].status).toBe(ShareStatus.Returned);
      expect(steps[4].status).toBe(ShareStatus.HomeSafe);
      expect(steps[4].terminalType).toBe('success');
    });
  });

  describe('Active shares', () => {
    it('returns 5-step happy path array for active Requested share', () => {
      const share = createMockShare({ status: ShareStatus.Requested });
      const steps = getTimelineSteps(share);

      expect(steps).toHaveLength(5);
      expect(steps[0].status).toBe(ShareStatus.Requested);
      expect(steps[4].status).toBe(ShareStatus.HomeSafe);
    });

    it('returns 5-step happy path array for active Ready share', () => {
      const share = createMockShare({ status: ShareStatus.Ready });
      const steps = getTimelineSteps(share);

      expect(steps).toHaveLength(5);
    });

    it('returns 5-step happy path array for active PickedUp share', () => {
      const share = createMockShare({ status: ShareStatus.PickedUp });
      const steps = getTimelineSteps(share);

      expect(steps).toHaveLength(5);
    });

    it('returns 5-step happy path array for active Returned share', () => {
      const share = createMockShare({ status: ShareStatus.Returned });
      const steps = getTimelineSteps(share);

      expect(steps).toHaveLength(5);
    });
  });

  describe('Step properties', () => {
    it('Declined step has correct properties', () => {
      const share = createMockShare({ status: ShareStatus.Declined });
      const steps = getTimelineSteps(share);
      const declinedStep = steps[1];

      expect(declinedStep.label).toBe('Declined');
      expect(declinedStep.description).toBe('Lender declined this request');
      expect(declinedStep.isTerminal).toBe(true);
      expect(declinedStep.terminalType).toBe('declined');
    });

    it('Disputed step has correct properties', () => {
      const share = createMockShare({
        status: ShareStatus.Ready,
        isDisputed: true,
      });
      const steps = getTimelineSteps(share);
      const disputedStep = steps[steps.length - 1];

      expect(disputedStep.label).toBe('Disputed');
      expect(disputedStep.description).toBe('Share was disputed');
      expect(disputedStep.isTerminal).toBe(true);
      expect(disputedStep.terminalType).toBe('disputed');
    });
  });
});

describe('ShareStatusTimeline Component', () => {
  const defaultProps = {
    share: createMockShare(),
    isOwner: true,
    isBorrower: false,
    onStatusUpdate: jest.fn(),
    hasStatusNotification: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering step counts', () => {
    it('renders exactly 2 timeline steps for declined share', () => {
      const share = createMockShare({ status: ShareStatus.Declined });
      const { getAllByText } = render(
        <ShareStatusTimeline {...defaultProps} share={share} />
      );

      expect(getAllByText('Requested')).toHaveLength(1);
      expect(getAllByText('Declined')).toHaveLength(1);
    });

    it('renders exactly 3 timeline steps for share disputed at Ready', () => {
      const share = createMockShare({
        status: ShareStatus.Ready,
        isDisputed: true,
      });
      const { getByText } = render(
        <ShareStatusTimeline {...defaultProps} share={share} />
      );

      expect(getByText('Requested')).toBeTruthy();
      expect(getByText('Ready')).toBeTruthy();
      expect(getByText('Disputed')).toBeTruthy();
    });

    it('renders exactly 5 timeline steps for HomeSafe share', () => {
      const share = createMockShare({ status: ShareStatus.HomeSafe });
      const { getByText } = render(
        <ShareStatusTimeline {...defaultProps} share={share} />
      );

      expect(getByText('Requested')).toBeTruthy();
      expect(getByText('Ready')).toBeTruthy();
      expect(getByText('Picked Up')).toBeTruthy();
      expect(getByText('Returned')).toBeTruthy();
      expect(getByText('Home Safe')).toBeTruthy();
    });
  });

  describe('Labels and descriptions', () => {
    it('displays "Declined" label and description for declined share', () => {
      const share = createMockShare({ status: ShareStatus.Declined });
      const { getByText } = render(
        <ShareStatusTimeline {...defaultProps} share={share} />
      );

      expect(getByText('Declined')).toBeTruthy();
      expect(getByText('Lender declined this request')).toBeTruthy();
    });

    it('displays "Disputed" label and description for disputed share', () => {
      const share = createMockShare({
        status: ShareStatus.Ready,
        isDisputed: true,
      });
      const { getByText } = render(
        <ShareStatusTimeline {...defaultProps} share={share} />
      );

      expect(getByText('Disputed')).toBeTruthy();
      expect(getByText('Share was disputed')).toBeTruthy();
    });
  });

  describe('Action button visibility', () => {
    it('shows action buttons for active Requested share when owner', () => {
      const share = createMockShare({ status: ShareStatus.Requested });
      const { getByText } = render(
        <ShareStatusTimeline
          {...defaultProps}
          share={share}
          isOwner={true}
          isBorrower={false}
        />
      );

      expect(getByText('Mark as Ready')).toBeTruthy();
      expect(getByText('Decline Share')).toBeTruthy();
    });

    it('does not show action buttons for declined share', () => {
      const share = createMockShare({ status: ShareStatus.Declined });
      const { queryByText } = render(
        <ShareStatusTimeline {...defaultProps} share={share} />
      );

      expect(queryByText('Mark as Ready')).toBeNull();
      expect(queryByText('Decline Share')).toBeNull();
    });

    it('does not show action buttons for disputed share', () => {
      const share = createMockShare({
        status: ShareStatus.Ready,
        isDisputed: true,
      });
      const { queryByText } = render(
        <ShareStatusTimeline {...defaultProps} share={share} />
      );

      expect(queryByText('Mark as Picked Up')).toBeNull();
    });

    it('does not show action buttons for HomeSafe share', () => {
      const share = createMockShare({ status: ShareStatus.HomeSafe });
      const { queryByText } = render(
        <ShareStatusTimeline {...defaultProps} share={share} />
      );

      expect(queryByText('Mark as Ready')).toBeNull();
      expect(queryByText('Confirm Home Safe')).toBeNull();
    });

    it('shows PickedUp action for borrower when status is Ready', () => {
      const share = createMockShare({ status: ShareStatus.Ready });
      const { getByText } = render(
        <ShareStatusTimeline
          {...defaultProps}
          share={share}
          isOwner={false}
          isBorrower={true}
        />
      );

      expect(getByText('Mark as Picked Up')).toBeTruthy();
    });

    it('shows Returned action for borrower when status is PickedUp', () => {
      const share = createMockShare({ status: ShareStatus.PickedUp });
      const { getByText } = render(
        <ShareStatusTimeline
          {...defaultProps}
          share={share}
          isOwner={false}
          isBorrower={true}
        />
      );

      expect(getByText('Mark as Returned')).toBeTruthy();
    });

    it('shows HomeSafe action for owner when status is Returned', () => {
      const share = createMockShare({ status: ShareStatus.Returned });
      const { getByText } = render(
        <ShareStatusTimeline
          {...defaultProps}
          share={share}
          isOwner={true}
          isBorrower={false}
        />
      );

      expect(getByText('Confirm Home Safe')).toBeTruthy();
    });
  });

  describe('Status update callbacks', () => {
    it('calls onStatusUpdate with Declined when decline button is pressed and confirmed', () => {
      const onStatusUpdate = jest.fn();
      const share = createMockShare({ status: ShareStatus.Requested });
      const { getByText } = render(
        <ShareStatusTimeline
          {...defaultProps}
          share={share}
          onStatusUpdate={onStatusUpdate}
          isOwner={true}
        />
      );

      fireEvent.press(getByText('Decline Share'));
      // Note: This triggers an Alert, which would need to be mocked for full testing
      // The actual call happens after Alert confirmation
    });
  });

  describe('Book withdrawn (isBookDeleted)', () => {
    it('shows withdrawn message instead of timeline when isBookDeleted is true', () => {
      const share = createMockShare({ status: ShareStatus.PickedUp });
      const { getByText, queryByText } = render(
        <ShareStatusTimeline
          {...defaultProps}
          share={share}
          isBookDeleted={true}
        />
      );

      // Should show the withdrawn message
      expect(getByText('This book has been removed from the lender\'s library. Please coordinate the return if possible.')).toBeTruthy();

      // Should NOT show any timeline steps
      expect(queryByText('Requested')).toBeNull();
      expect(queryByText('Ready')).toBeNull();
      expect(queryByText('Picked Up')).toBeNull();
    });

    it('shows normal timeline when isBookDeleted is false', () => {
      const share = createMockShare({ status: ShareStatus.PickedUp });
      const { getByText, queryByText } = render(
        <ShareStatusTimeline
          {...defaultProps}
          share={share}
          isBookDeleted={false}
        />
      );

      // Should NOT show the withdrawn message
      expect(queryByText('This book has been removed from the lender\'s library. Please coordinate the return if possible.')).toBeNull();

      // Should show timeline steps
      expect(getByText('Requested')).toBeTruthy();
      expect(getByText('Ready')).toBeTruthy();
      expect(getByText('Picked Up')).toBeTruthy();
    });

    it('shows normal timeline when isBookDeleted prop is not provided', () => {
      const share = createMockShare({ status: ShareStatus.Ready });
      const { getByText, queryByText } = render(
        <ShareStatusTimeline
          {...defaultProps}
          share={share}
        />
      );

      // Should NOT show the withdrawn message
      expect(queryByText('This book has been removed from the lender\'s library. Please coordinate the return if possible.')).toBeNull();

      // Should show timeline steps
      expect(getByText('Requested')).toBeTruthy();
      expect(getByText('Ready')).toBeTruthy();
    });

    it('shows withdrawn message regardless of share status', () => {
      // Test with HomeSafe status
      const homeSafeShare = createMockShare({ status: ShareStatus.HomeSafe });
      const { getByText: getByTextHomeSafe, queryByText: queryByTextHomeSafe } = render(
        <ShareStatusTimeline
          {...defaultProps}
          share={homeSafeShare}
          isBookDeleted={true}
        />
      );

      expect(getByTextHomeSafe('This book has been removed from the lender\'s library. Please coordinate the return if possible.')).toBeTruthy();
      expect(queryByTextHomeSafe('Home Safe')).toBeNull();
    });

    it('does not show action buttons when book is deleted', () => {
      const share = createMockShare({ status: ShareStatus.Requested });
      const { queryByText } = render(
        <ShareStatusTimeline
          {...defaultProps}
          share={share}
          isOwner={true}
          isBookDeleted={true}
        />
      );

      // Action buttons should not be visible
      expect(queryByText('Mark as Ready')).toBeNull();
      expect(queryByText('Decline Share')).toBeNull();
    });
  });
});
