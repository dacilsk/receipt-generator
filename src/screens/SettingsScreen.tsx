import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SettingsScreen = () => {
  const [businessName, setBusinessName] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [printer, setPrinter] = useState<string | null>(null);

  // Cargar configuración almacenada al iniciar
  useEffect(() => {
    const loadSettings = async () => {
      const storedBusinessName = await AsyncStorage.getItem('businessName');
      const storedSellerName = await AsyncStorage.getItem('sellerName');
      const storedPrinter = await AsyncStorage.getItem('printer');

      if (storedBusinessName) {
        setBusinessName(storedBusinessName);
      }
      if (storedSellerName) {
        setSellerName(storedSellerName);
      }
      if (storedPrinter) {
        setPrinter(storedPrinter);
      }
    };

    loadSettings();
  }, []);

  // Guardar la configuración
  const saveSettings = async () => {
    await AsyncStorage.setItem('businessName', businessName);
    await AsyncStorage.setItem('sellerName', sellerName);
    await AsyncStorage.setItem('printer', printer || '');
    Alert.alert('Configuraciones guardadas');
  };

  // Simulación de búsqueda de impresoras
  const searchPrinter = () => {
    // Aquí iría la lógica para escanear y seleccionar una impresora
    setPrinter('Impresora BT-1234'); // Simulación de selección de impresora
  };

  return (
    <ScrollView style={styles.container}>
      {/* Datos del negocio */}
      <Text style={styles.sectionTitle}>Datos del negocio</Text>
      <Text>Nombre del negocio:</Text>
      <TextInput
        style={styles.input}
        placeholder="Ejemplo: Mi Tienda"
        value={businessName}
        onChangeText={setBusinessName}
      />

      {/* Datos del vendedor */}
      <Text style={styles.sectionTitle}>Datos del vendedor</Text>
      <Text>Nombre del vendedor:</Text>
      <TextInput
        style={styles.input}
        placeholder="Ejemplo: Juan Pérez"
        value={sellerName}
        onChangeText={setSellerName}
      />

      {/* Configuración de la impresora */}
      <Text style={styles.sectionTitle}>Impresora</Text>
      <View style={styles.printerRow}>
        <Text>
          {printer
            ? `Conectado a: ${printer}`
            : 'No hay impresora seleccionada'}
        </Text>
        <TouchableOpacity style={styles.printerButton} onPress={searchPrinter}>
          <Icon name="bluetooth" size={20} color="white" />
          <Text style={styles.printerButtonText}> Buscar</Text>
        </TouchableOpacity>
      </View>

      {/* Botón de guardar */}
      <Button title="Guardar Configuración" onPress={saveSettings} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
    marginBottom: 10,
  },
  printerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  printerButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  printerButtonText: {
    color: 'white',
    marginLeft: 5,
  },
});

export default SettingsScreen;
