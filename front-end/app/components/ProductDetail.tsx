import AvatarView from "@ui/AvatarView";
import colors from "@utils/colors";
import { formatDate } from "@utils/date";
import { formatPrice } from "@utils/helper";
import size from "@utils/size";
import { FC } from "react";
import { View, StyleSheet, Text, ScrollView } from "react-native";
import ImageSlider from "./ImageSlider";
import { Product } from "app/store/listings";
import React from "react";

interface Props {
  product: Product;
}

const ProductDetail: FC<Props> = ({ product }) => {
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Images */}
        <ImageSlider images={product.image} />

        {/* Product Category */}
        <Text style={styles.category}>{product.category}</Text>

        {/* Product Price */}
        <Text style={styles.price}>{formatPrice(product.price)}</Text>

        {/* Purchase Date */}
        <Text style={styles.date}>
          Purchased on: {formatDate(product.date, "dd LLL yyyy")}
        </Text>

        {/* Product Name */}
        <Text style={styles.name}>{product.name}</Text>

        {/* Product Description */}
        <Text style={styles.description}>{product.description}</Text>

        {/* Seller Info */}
        <View style={styles.profileContainer}>
          <AvatarView uri={product.seller.avatar} size={60} />
          <Text style={styles.profileName}>{product.seller.name}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: size.padding,  // You can adjust the size based on the image design
    backgroundColor: '#FFFFFF', // Use a white background or another color as per the image design
  },
  category: {
    marginTop: 15,
    color: colors.primary,
    fontSize: 18, // Adjust font size based on design
    fontWeight: "700",
    textTransform: 'uppercase',  // This adds an uppercase style for better emphasis
  },
  price: {
    marginTop: 5,
    color: colors.active, // Ensure the active color is visually distinct
    fontWeight: "800", // Bold weight for price emphasis
    fontSize: 24, // Larger font size for the price
  },
  date: {
    marginTop: 5,
    color: colors.grey, // Slightly lighter color than the price to create a hierarchy
    fontSize: 14, // Smaller size for dates to differentiate from key information
    fontWeight: "600",
  },
  name: {
    marginTop: 20, // Increased margin for better separation
    color: colors.primary,
    fontWeight: "800", // Strong emphasis on the product name
    fontSize: 22, // Larger size for main heading
    letterSpacing: 0.8, // Slightly increased letter spacing for clarity
  },
  description: {
    marginTop: 15,
    color: colors.grey, // Use a neutral text color for the description
    fontSize: 16, // Moderate font size for readability
    letterSpacing: 0.5,
    lineHeight: 22, // Add line height for easier reading of the description
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20, // More spacing between profile and other sections
  },
  profileName: {
    paddingLeft: 15,
    color: colors.primary,
    fontSize: 18, // Slightly smaller than product name, but still bold for emphasis
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});

export default ProductDetail;
