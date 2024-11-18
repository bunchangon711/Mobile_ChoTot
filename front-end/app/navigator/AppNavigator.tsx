import React, { FC } from "react";
import { StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "@views/Home";
import Chats from "@views/Chats";
import ProductList from "@views/ProductList";
import { Product } from "app/store/listings";
import SingleProduct from "@views/SingleProduct";
import ChatWindow from "@views/ChatWindow";
import EditProduct from "@views/EditProduct";

export type AppStackParamList = {
  Home: undefined;
  Chats: undefined;
  ProductList: { category: string };
  SingleProduct: { product?: Product; id?: string };
  ChatWindow: {
    conversationId: string;
    peerProfile: { id: string; name: string; avatar?: string };
  };
  EditProduct: { product: Product }; 
  ProductDetail: { productId: string };
};

const Stack = createNativeStackNavigator<AppStackParamList>();

interface Props {}

const AppNavigator: FC<Props> = (props) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="Chats" component={Chats} />
      <Stack.Screen name="ProductList" component={ProductList} />
      <Stack.Screen name="SingleProduct" component={SingleProduct} />
      <Stack.Screen 
        name="ChatWindow" 
        component={ChatWindow}
        options={{ 
          presentation: 'fullScreenModal',
          animation: 'slide_from_right'
        }} 
      />
      <Stack.Screen name="EditProduct" component={EditProduct} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {},
});

export default AppNavigator;
