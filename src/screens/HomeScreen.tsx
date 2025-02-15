import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  ListRenderItem,
  Modal,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BluetoothDevice,
  BluetoothEscposPrinter,
  BluetoothManager,
} from 'react-native-bluetooth-escpos-printer';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {StringUtils} from '../utils/StringUtils';
import {formatDate} from '../utils/DateUtils';

// Definimos la estructura de un ítem
interface Item {
  id: number;
  name: string;
  quantity: string;
  unitPrice: string;
  total: number;
}

function HomeScreen(): React.JSX.Element {
  const [customerName, setCustomerName] = useState<string>('');
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  // Función para agregar un nuevo ítem vacío
  const addItem = () => {
    setItems([
      ...items,
      {id: Date.now(), name: '', quantity: '', unitPrice: '', total: 0},
    ]);
  };

  // Función para actualizar un ítem
  const updateItem = (id: number, field: keyof Item, value: string) => {
    setItems(prevItems => {
      const updatedItems = prevItems.map(item => {
        if (item.id !== id) {
          return item;
        }

        // Allow user input, but validate numbers when they finish typing
        if (field === 'quantity' || field === 'unitPrice') {
          const validValue = validatePositiveNumber(value);
          return {
            ...item,
            [field]: validValue,
            total: calculateTotalItem(
              field === 'quantity'
                ? parseFloat(validValue) || 0
                : parseFloat(item.quantity) || 0,
              field === 'unitPrice'
                ? parseFloat(validValue) || 0
                : parseFloat(item.unitPrice) || 0,
            ),
          };
        }

        return {...item, [field]: value};
      });

      calculateTotalVenta(updatedItems);
      return updatedItems;
    });
  };

  // Allow numbers greater than 0, including decimals
  const validatePositiveNumber = (value: string) => {
    const regex = /^(?:0|[1-9]\d*)?(?:\.\d*)?$/;
    return regex.test(value) ? value : '';
  };

  const calculateTotalItem = (quantity: number, unitPrice: number) => {
    return quantity > 0 ? quantity * unitPrice : unitPrice;
  };

  // Función para calcular el total de la venta
  const calculateTotalVenta = (itemsList: Item[]) => {
    const totalAmount = itemsList.reduce((sum, item) => sum + item.total, 0);
    setTotal(totalAmount);
  };

  const deleteItem = (id: number) => {
    setItems(prevItems => {
      const updatedItems = prevItems.filter(item => item.id !== id);
      calculateTotalVenta(updatedItems); // Recalcular el total de la venta después de eliminar
      return updatedItems;
    });
  };

  const printReceipt = async () => {
    setLoading(true);
    setLoadingText('Imprimiendo Ticket...');

    try {
      const storedBusinessName = await AsyncStorage.getItem('businessName');
      const storedSellerName = await AsyncStorage.getItem('sellerName');
      const storedPrinterName = await AsyncStorage.getItem('printerName');
      const storedPrinterAddress = await AsyncStorage.getItem('printerAddress');

      let selectedPrinter: BluetoothDevice | undefined =
        StringUtils.isNotEmpty(storedPrinterName) &&
        StringUtils.isNotEmpty(storedPrinterAddress)
          ? {
              name: storedPrinterName as string,
              address: storedPrinterAddress as string,
            }
          : undefined;

      if (!selectedPrinter) {
        Alert.alert('Error', 'Por favor, configura una impresora');
        throw new Error('Impresora no configurada');
      }

      // checar si la impresora está conectada, si no, conectarla
      const connectedDeviceAddress =
        await BluetoothManager.getConnectedDeviceAddress();
      if (connectedDeviceAddress !== selectedPrinter.address) {
        const hasPermission: boolean = await requestBluetoothPermission();
        if (!hasPermission) {
          Alert.alert('Permiso de Bluetooth denegado');
          throw new Error('Permiso de Bluetooth denegado');
        }
        await BluetoothManager.connect(selectedPrinter.address);
      }

      // Imprimir encabezado
      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER,
      );

      // Nombre del negocio (si está disponible)
      if (StringUtils.isNotEmpty(storedBusinessName)) {
        await BluetoothEscposPrinter.setBlob(0);
        await BluetoothEscposPrinter.printText(`${storedBusinessName}\n\r`, {
          widthtimes: 1,
          heigthtimes: 1,
          fonttype: 1,
        });
      }

      await BluetoothEscposPrinter.setBlob(0);
      await BluetoothEscposPrinter.printText('--- Ticket De Venta ---\n\r', {});
      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.LEFT,
      );

      // Nombre del cliente (si está disponible)
      if (StringUtils.isNotEmpty(customerName)) {
        await BluetoothEscposPrinter.printText(
          `Cliente: ${customerName}\n\r`,
          {},
        );
      }

      await BluetoothEscposPrinter.printText(
        'Fecha：' + formatDate(new Date(), 'DD/MM/YYYY HH:mm:ss') + '\n\r',
        {},
      );

      // Nombre del vendedor (si está disponible)
      if (StringUtils.isNotEmpty(storedSellerName)) {
        await BluetoothEscposPrinter.printText(
          `Vendedor: ${storedSellerName}\n\r`,
          {},
        );
      }

      // Imprimir detalles de los ítems
      await BluetoothEscposPrinter.printText(
        '--------------------------------\n\r',
        {},
      );

      let columnWidths = [12, 6, 6, 8];
      let columnAligns = [
        BluetoothEscposPrinter.ALIGN.LEFT,
        BluetoothEscposPrinter.ALIGN.CENTER,
        BluetoothEscposPrinter.ALIGN.CENTER,
        BluetoothEscposPrinter.ALIGN.RIGHT,
      ];

      await BluetoothEscposPrinter.printColumn(
        columnWidths,
        columnAligns,
        ['Producto', 'Canti', 'Preci', 'Importe'],
        {},
      );

      items.forEach(async item => {
        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          columnAligns,
          [item.name, item.quantity, item.unitPrice, item.total.toString()],
          {},
        );
      });

      // Imprimir total
      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER,
      );
      await BluetoothEscposPrinter.printText('\n\r', {});
      await BluetoothEscposPrinter.printText(
        '--------------------------------\n\r',
        {},
      );
      await BluetoothEscposPrinter.printText(
        `\nTotal: $${total.toFixed(2)}\n`,
        {},
      );
      await BluetoothEscposPrinter.printText('\n\r', {});
      await BluetoothEscposPrinter.printText(
        '¡Gracias por su compra!\n\r\n\r',
        {encoding: 'utf-8'},
      );
      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.LEFT,
      );

      // Finalizar impresión y cortar papel
      BluetoothEscposPrinter.cutOnePoint();
    } catch (e) {
      console.error('Error al imprimir:', e);
      Alert.alert('Error', 'Hubo un problema al imprimir el ticket');
    } finally {
      setLoading(false);
      setLoadingText('');
    }
  };

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

  const renderListHeader = () => (
    <View style={styles.headerRowContainer}>
      <Text style={[styles.headerColumnText, styles.headerColumnNameText]}>
        Item
      </Text>
      <Text style={[styles.headerColumnText]}>Cantidad</Text>
      <Text style={[styles.headerColumnText]}>Precio</Text>
      <Text style={[styles.headerColumnText]}>Importe</Text>
    </View>
  );

  const renderListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No hay ítems en la lista</Text>
      <TouchableOpacity style={styles.addButton} onPress={addItem}>
        <Icon name="add" size={20} color="white" />
        <Text style={styles.addButtonText}>Agregar ítem</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRowItem: ListRenderItem<Item> = ({item}) => (
    <View style={styles.itemRowContainer}>
      <View style={styles.itemNameInputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Item"
          placeholderTextColor="gray"
          value={item.name}
          onChangeText={text => updateItem(item.id, 'name', text)}
        />
      </View>
      <View style={styles.itemInputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Cantidad"
          placeholderTextColor="gray"
          keyboardType="numeric"
          value={item.quantity}
          onChangeText={text => updateItem(item.id, 'quantity', text)}
        />
      </View>
      <View style={styles.itemInputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Precio"
          placeholderTextColor="gray"
          keyboardType="numeric"
          value={item.unitPrice}
          onChangeText={text => updateItem(item.id, 'unitPrice', text)}
        />
      </View>
      <View style={styles.itemInputContainer}>
        <Text style={styles.totalItemText}>{item.total.toFixed(2)}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteItem(item.id)}>
        <Icon name="delete" size={15} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      {/* Campo para el nombre del cliente */}
      <View style={styles.customerContainer}>
        <Text style={styles.customerLabel}>Cliente:</Text>
        <TextInput
          style={styles.customerInput}
          placeholder="Nombre del cliente (opcional)"
          placeholderTextColor="gray"
          value={customerName}
          onChangeText={setCustomerName}
        />
      </View>

      {/* Lista de Ítems */}
      <FlatList
        data={items}
        keyExtractor={item => item.id.toString()}
        renderItem={renderRowItem}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderListEmpty}
      />

      {items.length > 0 && (
        <View>
          {/* Botón para agregar ítem */}
          <View style={styles.addButtonContainer}>
            <TouchableOpacity style={styles.addButton} onPress={addItem}>
              <Icon name="add" size={20} color="white" />
              <Text style={styles.addButtonText}>Agregar ítem</Text>
            </TouchableOpacity>
          </View>

          {/* Total de la Venta */}
          <Text style={styles.totalVentaText}>Total: ${total.toFixed(2)}</Text>

          {/* Botón de Imprimir */}
          <Button title="Imprimir Ticket" onPress={printReceipt} />
        </View>
      )}

      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>{loadingText}</Text>
        </View>
      </Modal>
    </View>
  );
}

// Estilos
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  customerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  customerInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  headerRowContainer: {
    flexDirection: 'row',
    backgroundColor: '#3E4E55', // Color contrastante
    justifyContent: 'space-between',
    maxHeight: 30,
    paddingVertical: 2,
  },
  headerColumnText: {
    flex: 1,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerColumnNameText: {
    flex: 1.7,
    paddingLeft: 5,
  },
  itemRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxHeight: 50,
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  itemInputContainer: {
    flex: 1,
    marginHorizontal: 2,
  },
  itemNameInputContainer: {
    flex: 2, // Más ancho para el nombre
    marginHorizontal: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  totalItemText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
    paddingTop: 10,
    paddingRight: 5,
  },
  deleteButton: {
    backgroundColor: '#ff4d4d', // Red background for delete button
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  totalVentaText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  addButtonContainer: {
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 5,
  },
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

export default HomeScreen;
