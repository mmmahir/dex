import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Home from '../screens/Home';
import Dex from '../screens/Dex';
import Collection from '../screens/Collection';

const Tab = createBottomTabNavigator();

const getMetrics = () => {
  const { width, height } = Dimensions.get('window');
  // Scale based on screen width — baseline is 390px (iPhone 14)
  const scale = Math.min(width / 390, 1.4);
  return {
    tabBarHeight: Math.round(120 * scale),
    iconSizeFocused: Math.round(40 * scale),
    iconSizeUnfocused: Math.round(32 * scale),
    labelSize: Math.round(14 * scale),
    iconBoxW: Math.round(58 * scale),
    iconBoxH: Math.round(46 * scale),
  };
};

const TabIcon = ({ name, focused }) => {
  const m = getMetrics();
  return (
    <View style={[
      styles.iconWrap,
      { width: m.iconBoxW, height: m.iconBoxH },
      focused && styles.iconWrapActive,
    ]}>
      {focused && <View style={[styles.iconGlow, { width: m.iconBoxW, height: m.iconBoxH }]} />}
      <MaterialCommunityIcons
        name={name}
        size={focused ? m.iconSizeFocused : m.iconSizeUnfocused}
        color={focused ? '#ca8f0f' : '#3a3a4a'}
      />

    </View>
  );
};

const MainTabNavigator = () => {
  const m = getMetrics();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: [styles.tabBar, { height: m.tabBarHeight, paddingBottom: Math.round(m.tabBarHeight * 0.1) }],
        tabBarLabelStyle: [styles.tabLabel, { fontSize: m.labelSize }],
        tabBarActiveTintColor: '#ca8f0f',
        tabBarInactiveTintColor: '#3a3a4a',
      }}
    >
      <Tab.Screen
        name="RADAR"
        component={Home}
        options={{
          tabBarLabel: 'RADAR',
          tabBarIcon: ({ focused }) => <TabIcon name="crosshairs-gps" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="DEX"
        component={Dex}
        options={{
          tabBarLabel: 'DEX',
          tabBarIcon: ({ focused }) => <TabIcon name="book-open-variant" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0d0d14',
    borderTopWidth: 1,
    borderTopColor: '#1e1e2e',
    paddingTop: 25,
  },
  tabLabel: {
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 0,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    position: 'relative',
    marginBottom: 20,
  },
  iconWrapActive: {
    backgroundColor: '#ca8f0f11',
    borderWidth: 1,
    borderColor: '#ca8f0f33',
  },
  iconGlow: {
    position: 'absolute',
    borderRadius: 4,
    backgroundColor: '#ca8f0f08',
  },
  activeDot: {
    position: 'absolute',
    bottom: -9,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ca8f0f',
  },
});

export default MainTabNavigator;