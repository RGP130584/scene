import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MapScreen } from '../screens/MapScreen';
import { CheckinScreen } from '../screens/CheckinScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { RankingScreen } from '../screens/RankingScreen';
import { InviteScreen } from '../screens/InviteScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Criamos um Stack para o Mapa porque ele precisa abrir o Checkin por cima de tudo
function MapStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MapHome" component={MapScreen} />
      <Stack.Screen name="Checkin" component={CheckinScreen} />
    </Stack.Navigator>
  );
}

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#1A1A1A', borderTopWidth: 0, paddingBottom: 5, height: 60 },
        tabBarActiveTintColor: '#FF3366',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tab.Screen 
        name="MapStack" 
        component={MapStack} 
        options={{ tabBarLabel: 'Mapa' }} 
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen} 
        options={{ tabBarLabel: 'Chat' }} 
      />
      <Tab.Screen 
        name="Ranking" 
        component={RankingScreen} 
        options={{ tabBarLabel: 'Ranking' }} 
      />
      <Tab.Screen 
        name="Convites" 
        component={InviteScreen} 
        options={{ tabBarLabel: 'Convites' }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ tabBarLabel: 'Perfil' }} 
      />
    </Tab.Navigator>
  );
}
