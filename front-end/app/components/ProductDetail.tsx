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
import { Ionicons } from "@expo/vector-icons";

interface Props {
  product: Product;
}

const ProductDetail: FC<Props> = ({ product }) => {
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.mainSection}>
          <ImageSlider images={product.image} />
          <Text style={styles.category}>{product.category}</Text>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          <Text style={styles.date}>
            Ngày mua: {formatDate(product.date, "dd LLL yyyy")}
          </Text>
        </View>

        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Mô tả chi tiết</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>

        <View style={styles.sellerSection}>
          <Text style={styles.sectionTitle}>Thông tin người bán</Text>
          <View style={styles.profileContainer}>
            <AvatarView uri={product.seller.avatar} size={60} />
            <View style={styles.nameContainer}>
              <Text style={styles.profileName}>{product.seller.name}</Text>
              <Ionicons name="checkmark-circle" size={20} color="#1DA1F2" />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainSection: {
    padding: size.padding,
    borderBottomWidth: 8,
    borderBottomColor: "#D3D3D3",
  },
  descriptionSection: {
    padding: size.padding,
    borderBottomWidth: 8,
    borderBottomColor: "#D3D3D3",
  },
  sellerSection: {
    padding: size.padding,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 12,
  },
  category: {
    marginTop: 15,
    color: colors.primary,
    fontSize: 18,
    fontWeight: "700",
    textTransform: 'uppercase',
  },
  price: {
    marginTop: 5,
    color: colors.active,
    fontWeight: "800",
    fontSize: 24,
  },
  date: {
    marginTop: 5,
    color: colors.grey,
    fontSize: 14,
    fontWeight: "600",
  },
  name: {
    marginTop: 20,
    color: colors.primary,
    fontWeight: "800",
    fontSize: 22,
    letterSpacing: 0.8,
  },
  description: {
    color: "#767575",
    fontSize: 16,
    letterSpacing: 0.5,
    lineHeight: 22,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 15,
    gap: 5,
  },
  profileName: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});

export default ProductDetail;
