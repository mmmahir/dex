import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import test from '../screens/test';
import { MaterialCommunityIcons } from '@expo/vector-icons';





const Tab = createBottomTabNavigator();

const MainTabNavigator = ({ }) => {
  return (
    <Tab.Navigator
      
      screenOptions={{
        tabBarActiveTintColor:"#FFF",
        tabBarInactiveTintColor:"#aaa",
        tabBarStyle:{
            backgroundColor:"#1a1a1a",
            height:120,
        },
        tabBarLabelStyle:{
            fontSize:20,
        },
        tabBarIconStyle:{
            height:50,
            width:50,
        },
        headerShown:false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={test}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons name="sword-cross" size={focused ? 40 : 28} color={"#FFF"} />
          )
        }}/>
    </Tab.Navigator>
  );
};

export default MainTabNavigator;