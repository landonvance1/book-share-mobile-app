import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface MessageOptionsSheetProps {
  visible: boolean;
  onClose: () => void;
  onReport: () => void;
}

export function MessageOptionsSheet({ visible, onClose, onReport }: MessageOptionsSheetProps) {
  const handleReport = () => {
    onClose();
    onReport();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <TouchableOpacity style={styles.option} onPress={handleReport} activeOpacity={0.7}>
          <Text style={styles.optionTextDestructive}>Report Message</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.option} onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.optionTextCancel}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34,
    paddingHorizontal: 16,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#D1D1D6',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  option: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  optionTextDestructive: {
    fontSize: 20,
    color: '#FF3B30',
  },
  optionTextCancel: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '500',
  },
});
