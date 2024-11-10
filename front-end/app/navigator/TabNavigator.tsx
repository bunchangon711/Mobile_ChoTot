import React from 'react';
import { createBottomTabNavigator, BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AntDesign } from "@expo/vector-icons";
import AppNavigator from "./AppNavigator";
import ProfileNavigator from "./ProfileNavigator";
import NewListing from "@views/NewListing";
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

const Tab = createBottomTabNavigator();

const getOptions = (iconName: string, label: string): BottomTabNavigationOptions => {
  return {
    tabBarIcon: ({ color, size }) => (
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <AntDesign name={iconName as any} size={size} color={color} />
        <Text style={{ color, fontSize: 12, marginTop: 4 }}>{label}</Text>
      </View>
    ),
    tabBarLabel: () => null,
  };
};

const PostButton = () => {
  const navigation = useNavigation<any>();  // Use the navigation hook with any type

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('NewListing')}  // Navigate to NewListing
      style={{
        top: -30,  // Raise the button to overlap the tab bar
        justifyContent: 'center',
        alignItems: 'center',
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#FFD700',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 3 },
        elevation: 5,
      }}
    >
      <AntDesign name="plus" size={30} color="white" />
    </TouchableOpacity>
  );
};

const TabNavigator = () => {
  return (
    <Tab.Navigator 
      screenOptions={({ route }) => {
        const routeName = getFocusedRouteNameFromRoute(route);
        return { 
          headerShown: false,
          tabBarActiveTintColor: '#F28500',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            backgroundColor: 'white',
            borderTopWidth: 0,
            elevation: 8,
            height: 60,
            display: routeName === 'ChatWindow' ? 'none' : 'flex',
          },
          // Hide tab bar completely for ChatWindow
          tabBarButton: routeName === 'ChatWindow' ? () => null : undefined,
        }
      }}
    >
      <Tab.Screen
        name="HomeNavigator"
        component={AppNavigator}
        options={getOptions("home", "Trang chủ")}
      />
      <Tab.Screen
        name="NewListing"
        component={NewListing}
        options={{
          tabBarButton: () => <PostButton />,  // Custom floating button with navigation
        }}
      />
      <Tab.Screen
        name="ProfileNavigator"
        component={ProfileNavigator}
        options={getOptions("user", "Tài khoản")}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
