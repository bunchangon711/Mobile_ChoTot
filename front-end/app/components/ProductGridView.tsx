import { FC } from "react";
import { LatestProduct } from "./LatestProductList";
import ProductCard from "@ui/ProductCard"; // Giả sử ProductCard là component hiển thị sản phẩm
import React from "react";
import { View } from "react-native";

interface Props {
  data: LatestProduct[];
  onPress(item: LatestProduct): void;
}

const ProductGridView: FC<Props> = ({ data, onPress }) => {
  return (
    <View style={{ paddingHorizontal: 4 }}>
      {data.map((item) => (
        <ProductCard 
          key={item.id}
          product={item} 
          onPress={onPress}
        />
      ))}
    </View>
  );
};

export default ProductGridView;