import { FC } from "react";
import { View, StyleSheet, Pressable, ViewStyle } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";  // Using native icon
import colors from "@utils/colors";
import size from "@utils/size";
import React from "react";
interface Props {
  indicate?: boolean;
  onPress?(): void;
  style?: ViewStyle;
}

const ChatNotification: FC<Props> = ({ indicate, onPress }) => {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <MaterialCommunityIcons
        name="message-outline" 
        size={24}
        color={indicate ? colors.active : colors.primary}
      />
      {indicate && <View style={styles.indicator} />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: size.padding, // Adjust for more precise spacing
    position: "relative",
  },
  indicator: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: colors.active,
    position: "absolute",
    top: 0,
    right: 0,
    borderWidth: 2,
    borderColor: colors.white,
  },
});

export default ChatNotification;
