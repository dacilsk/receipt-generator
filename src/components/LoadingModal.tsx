import React from 'react';
import {Modal, View, ActivityIndicator, Text, StyleSheet} from 'react-native';

interface LoadingModalProps {
  loading: boolean;
  loadingText?: string;
}

const LoadingModal: React.FC<LoadingModalProps> = ({
  loading,
  loadingText = 'Cargando...',
}) => {
  return (
    <Modal visible={loading} transparent animationType="fade">
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>{loadingText}</Text>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fondo semi-transparente
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoadingModal;
