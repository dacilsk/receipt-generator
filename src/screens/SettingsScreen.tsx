import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect, useState} from 'react';
import {
  Alert,
  Button,
  FlatList,
  Modal,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BluetoothEscposPrinter,
  BluetoothDevice,
  BluetoothManager,
} from 'react-native-bluetooth-escpos-printer';
import Icon from 'react-native-vector-icons/MaterialIcons';
// import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

const SettingsScreen = () => {
  const [businessName, setBusinessName] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [bluetoothDevices, setBluetoothDevices] = useState<BluetoothDevice[]>(
    [],
  );
  const [selectedPrinter, setSelectedPrinter] =
    useState<BluetoothDevice | null>(null);
  const [printerConnected, setPrinterConnected] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const storedBusinessName = await AsyncStorage.getItem('businessName');
      const storedSellerName = await AsyncStorage.getItem('sellerName');
      const storedPrinterName = await AsyncStorage.getItem('printerName');
      const storedPrinterAddress = await AsyncStorage.getItem('printerAddress');

      if (storedBusinessName) {
        setBusinessName(storedBusinessName);
      }
      if (storedSellerName) {
        setSellerName(storedSellerName);
      }
      if (
        storedPrinterName &&
        storedPrinterName?.trim().length > 0 &&
        storedPrinterAddress &&
        storedPrinterAddress?.trim().length > 0
      ) {
        setSelectedPrinter({
          name: storedPrinterName,
          address: storedPrinterAddress,
        });
      }
    };

    loadSettings();
  }, []);

  // Solicitar permisos Bluetooth
  const requestBluetoothPermission = async () => {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        // Android 12+ (API 31+)
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);
        return (
          granted['android.permission.BLUETOOTH_SCAN'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.BLUETOOTH_CONNECT'] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        // Android 10-11
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } else {
      // iOS
      // const result = await request(PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL);
      // return result === RESULTS.GRANTED;
      Alert.alert('Permiso de Bluetooth para iOS no configurados');
      return false;
    }
  };

  const parseEnableBluetoothResponse = async (response: any[]) => {
    const pairedDevices: BluetoothDevice[] = response
      ?.map(value => {
        try {
          return JSON.parse(value);
        } catch (error) {
          console.error('Error parsing device', value, error);
          return null;
        }
      })
      .filter(device => device !== null); // filter out any items that failed to parse

    return pairedDevices;
  };

  // Buscar dispositivos Bluetooth
  const searchPrinter = async () => {
    try {
      const hasPermission: boolean = await requestBluetoothPermission();
      if (!hasPermission) {
        Alert.alert('Permiso de Bluetooth denegado');
        return;
      }

      const pairedDevices: BluetoothDevice[] =
        await BluetoothManager.enableBluetooth().then(response =>
          parseEnableBluetoothResponse(response),
        );

      setBluetoothDevices(pairedDevices);
      setModalVisible(true);
    } catch (error) {
      Alert.alert('Error al buscar dispositivos Bluetooth');
    }
  };

  const selectPrinter = async (device: BluetoothDevice) => {
    await connectBluetoothDevice(device);
  };

  const connectBluetoothDevice = async (device: BluetoothDevice) => {
    console.log('Connecting to', device);
    await BluetoothManager.connect(device.address)
      .then(() => {
        console.log('Connected to', device.name);
        setPrinterConnected(true);
        setSelectedPrinter(device);
        AsyncStorage.setItem('printerName', device.name);
        AsyncStorage.setItem('printerAddress', device.address);
        setModalVisible(false);
      })
      .catch(err => {
        console.log('Connection error:', err);
        Alert.alert('Connection Error', err.message || err);
      });
  };

  const testPrinter = async () => {
    if (!selectedPrinter) {
      Alert.alert('No hay impresora seleccionada');
      return;
    }

    if (!printerConnected) {
      await connectBluetoothDevice(selectedPrinter);
    }

    try {
      await BluetoothEscposPrinter.printText('Prueba de impresión\n\r', {});
      await BluetoothEscposPrinter.printText('----------------------\n\r', {});
      await BluetoothEscposPrinter.printText(
        '¡Impresora conectada correctamente!\n\r',
        {
          encoding: 'GBK',
          codepage: 0,
          widthtimes: 1,
          heigthtimes: 1,
          fonttype: 1,
        },
      );
    } catch (error) {
      console.error('Error al imprimir: ' + error);
      Alert.alert('Error al imprimir: ' + error);
    }
  };

  const saveSettings = async () => {
    const printerName =
      selectedPrinter && selectedPrinter.name ? selectedPrinter.name : '';
    const printerAddress =
      selectedPrinter && selectedPrinter.address ? selectedPrinter.address : '';

    await AsyncStorage.setItem('businessName', businessName);
    await AsyncStorage.setItem('sellerName', sellerName);
    await AsyncStorage.setItem('printerName', printerName);
    await AsyncStorage.setItem('printerAddress', printerAddress);
    Alert.alert('Configuración guardada');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Datos del negocio */}
      <Text style={styles.sectionTitle}>Datos del negocio</Text>
      <Text>Nombre del negocio:</Text>
      <TextInput
        style={styles.input}
        placeholder="Ejemplo: Mi Tienda"
        placeholderTextColor="gray"
        value={businessName}
        onChangeText={setBusinessName}
      />

      {/* Datos del vendedor */}
      <Text style={styles.sectionTitle}>Datos del vendedor</Text>
      <Text>Nombre del vendedor:</Text>
      <TextInput
        style={styles.input}
        placeholder="Ejemplo: Juan Pérez"
        placeholderTextColor="gray"
        value={sellerName}
        onChangeText={setSellerName}
      />

      {/* Configuración de la impresora */}
      <Text style={styles.sectionTitle}>Impresora</Text>
      <View style={styles.printerContainer}>
        <Text>
          {selectedPrinter && selectedPrinter.name
            ? `Conectado a: ${selectedPrinter.name}`
            : 'No hay impresora seleccionada'}
        </Text>
        <View style={styles.printerButtonsContainer}>
          <TouchableOpacity
            style={styles.searchPrinterButton}
            onPress={searchPrinter}>
            <Icon name="bluetooth" size={20} color="white" />
            <Text style={styles.printerButtonText}> Buscar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.printTestButton]}
            onPress={testPrinter}>
            <Icon name="print" size={20} color="white" />
            <Text style={styles.printerButtonText}> Probar impresora</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Button title="Guardar Configuración" onPress={saveSettings} />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona una impresora</Text>
            <FlatList
              data={bluetoothDevices}
              keyExtractor={item => item.address}
              // style={{ maxHeight: 300 }}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.deviceItem}
                  onPress={() => selectPrinter(item)}>
                  <Text>{item.name}</Text>
                  <Text>{item.address}</Text>
                </TouchableOpacity>
              )}
            />
            <Button title="Cancelar" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
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
  printerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  printerButtonsContainer: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  searchPrinterButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  printTestButton: {
    backgroundColor: '#28a745',
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  printerButtonText: {
    color: 'white',
    marginLeft: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    height: '50%', // Reducir altura
    maxHeight: 400, // Altura máxima para pantallas grandes
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  deviceItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});

export default SettingsScreen;
