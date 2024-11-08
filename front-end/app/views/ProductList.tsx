import AppHeader from "@components/AppHeader";
import { LatestProduct } from "@components/LatestProductList";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import BackButton from "@ui/BackButton";
import EmptyView from "@ui/EmptyView";
import ProductCard from "@ui/ProductCard";
import colors from "@utils/colors";
import size from "@utils/size";
import { runAxiosAsync } from "app/api/runAxiosAsync";
import useClient from "app/hooks/useClient";
import { AppStackParamList } from "app/navigator/AppNavigator";
import { FC, useEffect, useState } from "react";
import { View, StyleSheet, Text, FlatList } from "react-native";
import React from "react";
import SearchBar from "@components/SearchBar";
import { Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Modal } from "react-native";
import Slider from '@react-native-community/slider';
import { formatPrice } from "@utils/helper";
import { TextInput } from 'react-native';
type Props = NativeStackScreenProps<AppStackParamList, "ProductList">;

const col = 1;

const ProductList: FC<Props> = ({ route, navigation }) => {
  const [products, setProducts] = useState<LatestProduct[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<LatestProduct[]>([]);
  const [priceRange, setPriceRange] = useState({ 
    min: 0, 
    max: 1000000000,
    minInput: '0',
    maxInput: '1000000000' 
  });
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const { authClient } = useClient();
  const { category } = route.params;
  const isOdd = products.length % col !== 0;
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");


  const fetchProducts = async (category: string) => {
    const res = await runAxiosAsync<{ products: LatestProduct[] }>(
      authClient.get("/product/by-category/" + category)
    );
    if (res) {
      setProducts(res.products);
    }
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.trim()) {
      const encodedCategory = encodeURIComponent(category);
      const encodedQuery = encodeURIComponent(text);
      const res = await runAxiosAsync<{ products: LatestProduct[] }>(
        authClient.get(`/product/search?query=${encodedQuery}&category=${encodedCategory}`)
      );
      if (res?.products) {
        setFilteredProducts(res.products);
        setIsFilterActive(true);
      }
    } else {
      setFilteredProducts([]);
      setIsFilterActive(false);
    }
  };

  const sortProducts = () => {
    const sorted = [...products];
    if (sortOrder === null || sortOrder === 'desc') {
      sorted.sort((a, b) => a.price - b.price);
      setSortOrder('asc');
    } else {
      sorted.sort((a, b) => b.price - a.price);
      setSortOrder('desc');
    }
    setProducts(sorted);
    
    // Also sort filtered products if they exist
    if (filteredProducts.length > 0) {
      const sortedFiltered = [...filteredProducts];
      if (sortOrder === null || sortOrder === 'desc') {
        sortedFiltered.sort((a, b) => a.price - b.price);
      } else {
        sortedFiltered.sort((a, b) => b.price - a.price);
      }
      setFilteredProducts(sortedFiltered);
    }
  };

  const applyPriceFilter = () => {
    const filtered = products.filter(
      product => product.price >= priceRange.min && product.price <= priceRange.max
    );
    setFilteredProducts(filtered);
    setIsFilterActive(true);
    setShowPriceFilter(false);
  };

  const resetFilters = () => {
    setFilteredProducts([]);
    setIsFilterActive(false);
    setPriceRange({ min: 0, max: 1000000000, minInput: '0', maxInput: '1000000000' });
  };

  const renderPriceFilterModal = () => (
    <Modal
      visible={showPriceFilter}
      transparent
      animationType="slide"
      onRequestClose={() => setShowPriceFilter(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Chọn khoảng giá</Text>
          <Text>Từ:</Text>
          <View style={styles.priceInputContainer}>
            <TextInput
              style={styles.priceInput}
              value={priceRange.minInput}
              onChangeText={(text) => {
                const value = text.replace(/[^0-9]/g, '');
                setPriceRange({
                  ...priceRange,
                  minInput: value,
                  min: Number(value) || 0
                });
              }}
              keyboardType="numeric"
            />
          </View>
          <Slider
            style={styles.slider}
            value={priceRange.min}
            onValueChange={(value) => setPriceRange({
              ...priceRange,
              min: value,
              minInput: value.toString()
            })}
            minimumValue={0}
            maximumValue={1000000000}
            step={100000}
          />

          <Text style={styles.labelText}>Đến:</Text>
          <View style={styles.priceInputContainer}>
            <TextInput
              style={styles.priceInput} 
              value={priceRange.maxInput}
              onChangeText={(text) => {
                const value = text.replace(/[^0-9]/g, '');
                setPriceRange({
                  ...priceRange,
                  maxInput: value,
                  max: Number(value) || 0
                });
              }}
              keyboardType="numeric"
            />
          </View>
          <Slider
            style={styles.slider}
            value={priceRange.max}
            onValueChange={(value) => setPriceRange({
              ...priceRange,
              max: value,
              maxInput: value.toString()
            })}
            minimumValue={0}
            maximumValue={1000000000}
            step={100000}
          />
          <View style={styles.modalButtons}>
            <Pressable style={styles.button} onPress={applyPriceFilter}>
              <Text>Áp dụng</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={resetFilters}>
              <Text>Reset</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={() => setShowPriceFilter(false)}>
              <Text>Hủy</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderHeader = () => (
    <View style={styles.topBar}>
      <BackButton />
      <View style={styles.searchBarContainer}>
        <SearchBar 
          placeholder={`Tìm kiếm ${category}`} 
          onSearch={handleSearch}
        />
      </View>
      <Pressable 
        onPress={() => {
          if (isFilterActive && filteredProducts.length === 0) {
            resetFilters();
          } else {
            setShowPriceFilter(true);
          }
        }} 
        style={styles.filterButton}
      >
        <MaterialIcons 
          name="filter-alt" 
          size={24} 
          color={isFilterActive ? colors.active : colors.primary} 
        />
      </Pressable>
      <Pressable onPress={sortProducts} style={styles.sortButton}>
        <MaterialIcons 
          name={sortOrder === 'asc' ? 'arrow-upward' : 'arrow-downward'} 
          size={24} 
          color={colors.primary}
        />
      </Pressable>
    </View>
  );

  useEffect(() => {
    fetchProducts(category);
  }, [category]);

  if (!products.length)
    return (
      <View style={styles.container}>
        {renderHeader()}
        <EmptyView title="There is no product in this category!" />
      </View>
    );

  // Modified empty check condition
  if ((!products.length) || (isFilterActive && filteredProducts.length === 0)) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <EmptyView title={
          isFilterActive && filteredProducts.length === 0
            ? "No products found!" 
            : "There is no product in this category!"
        } />
      </View>
    );
  }
 
  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderPriceFilterModal()}
      <FlatList
        numColumns={col}
        data={filteredProducts.length > 0 ? filteredProducts : products}
        renderItem={({ item, index }) => (
          <View style={{
            flex: isOdd && index === products.length - 1 ? 1 / col : 1,
          }}>
            <ProductCard
              product={item}
              onPress={({ id }) => navigation.navigate("SingleProduct", { id })}
            />
          </View>
        )}
      />
      </View>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "yellow",
      padding: 8,
    },
    searchBarContainer: {
      flex: 1,
      marginLeft: 10,
    },
    sortButton: {
      padding: 8,
      marginLeft: 8,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: 20,
    },
    modalContent: {
      backgroundColor: 'white',
      padding: 20,
      borderRadius: 10,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 15,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 20,
    },
    button: {
      padding: 10,
      backgroundColor: "yellow",
      borderRadius: 5,
    },
    filterButton: {
      padding: 8,
      marginLeft: 8,
    },
    priceInputContainer: {
      marginVertical: 5,
    },
    priceInput: {
      borderWidth: 1,
      borderColor: colors.grey,
      borderRadius: 5,
      padding: 8,
      width: '100%',
    },
    slider: {
      width: '100%',
      height: 40,
    },
    labelText: {
      marginTop: 10,
    }
  });
  
  export default ProductList;
