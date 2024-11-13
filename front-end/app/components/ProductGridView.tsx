import { FC } from "react";
import { FlatList } from "react-native"; // Import FlatList từ react-native
import { LatestProduct } from "./LatestProductList";
import ProductCard from "@ui/ProductCard"; // Giả sử ProductCard là component hiển thị sản phẩm
import React from "react";

interface Props {
  data: LatestProduct[];
  onPress(item: LatestProduct): void;
}

const ProductGridView: FC<Props> = ({ data, onPress }) => {
  const renderItem = ({ item }: { item: LatestProduct }) => (
    <ProductCard product={item} onPress={onPress} />
  );

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default ProductGridView;