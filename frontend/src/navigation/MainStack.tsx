import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MapScreen } from '../screens/MapScreen';
import { CheckinScreen } from '../screens/CheckinScreen';

const Stack = createStackNavigator();

export function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="Checkin" component={CheckinScreen} />
    </Stack.Navigator>
  );
}
