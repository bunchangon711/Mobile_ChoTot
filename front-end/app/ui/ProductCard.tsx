import { FC } from "react";
import { View, StyleSheet, Text, Pressable, Image } from "react-native";
import { formatPrice } from "@utils/helper";
import colors from "@utils/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LatestProduct } from "@components/LatestProductList";
import React from "react";
//import { Image as CachedImage } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
interface Props {
  product: LatestProduct;
  onPress(item: LatestProduct): void;
}

const ProductCard: FC<Props> = ({ product, onPress }) => {
  const renderAvatar = () => {
    if (product.seller?.avatar?.url) {
      return <Image source={{ uri: product.seller.avatar.url }} style={styles.avatar} />;
    }
    return (
      <View style={[styles.avatar, styles.placeholderAvatar]}>
        <MaterialCommunityIcons name="account" size={20} color={colors.grey} />
      </View>
    );
  };

  return (
    <Pressable onPress={() => onPress(product)} style={styles.productContainer}>
      <View>
        {product.thumbnail ? (
          <Image source={{ uri: product.thumbnail }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.noImageView]}>
            <MaterialCommunityIcons
              name="image-off"
              size={52.5} 
              color={colors.primary}
            />
          </View>
        )}
        {product.image && product.image.length > 0 && (
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {product.image.length}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        <Text numberOfLines={2} ellipsizeMode="tail" style={styles.description}>
          {product.description}
        </Text>
        <View style={styles.sellerInfo}>
          {renderAvatar()}
          <Text style={styles.sellerName}>{product.seller?.name || "Unknown Seller"}</Text>
          <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" style={styles.verifiedBadge} />
        </View>
      </View>
    </Pressable>
  );
};


const styles = StyleSheet.create({
  productContainer: {
    flexDirection: "row",
    padding: 15, 
    backgroundColor: "#fff",
    borderRadius: 12, 
  },
  thumbnail: {
    width: 150, 
    height: 150, 
    borderRadius: 12, 
  },
  noImageView: {
    backgroundColor: colors.deActive,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContainer: {
    flex: 1,
    marginLeft: 15, 
    alignSelf: "flex-start", 
  },
  name: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.primary,
  },
  price: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.price,
    paddingTop: 6.5,
  },
  description: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 4,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  placeholderAvatar: {
    backgroundColor: colors.deActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerName: {
    marginLeft: 8,
    fontSize: 13,
    color: colors.grey,
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  imageCounter: {
    position: 'absolute',
    width: 35,
    height: 25,
    backgroundColor: colors.backDropDark,
    bottom: 10,
    right: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.white,
  },
  imageCounterText: {
    color: colors.white,
    fontWeight: '600',
  },
});

export default ProductCard;

