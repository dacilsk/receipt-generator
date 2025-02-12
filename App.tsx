import {createDrawerNavigator} from '@react-navigation/drawer';
import {NavigationContainer} from '@react-navigation/native';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Íconos para el menú
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Drawer = createDrawerNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        screenOptions={({route}) => ({
          drawerIcon: ({color, size}) => {
            let iconName;
            if (route.name === 'Venta') {
              iconName = 'point-of-sale'; // Icono para ventas
            } else if (route.name === 'Configuración') {
              iconName = 'settings'; // Icono para configuración
            }
            return <Icon name={iconName as string} size={size} color={color} />;
          },
          drawerActiveTintColor: '#007bff',
          drawerInactiveTintColor: 'gray',
          headerShown: true, // Muestra el encabezado con botón de menú
        })}>
        <Drawer.Screen name="Venta" component={HomeScreen} />
        <Drawer.Screen name="Configuración" component={SettingsScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
};

export default App;
