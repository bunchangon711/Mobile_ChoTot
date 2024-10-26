import { FC } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import colors from "@utils/colors";
import size from "@utils/size";
import React from "react";

const SearchBar: FC = () => {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="magnify" size={24} color={colors.grey} />
      <TextInput
        style={styles.input}
        placeholder="Tìm kiếm trên Chợ Tốt"
        placeholderTextColor={colors.grey}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: size.padding,
    paddingVertical: 8,
    marginHorizontal: size.margin,
    backgroundColor: "#F3F3F3", 
  },
  input: {
    marginLeft: 10,
    fontSize: 16,
    flex: 1,
  },
});

export default SearchBar;
