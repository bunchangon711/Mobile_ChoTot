import { FC } from "react";
import { StyleSheet, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "@utils/colors";
import React from "react";
import { useNavigation } from "@react-navigation/native";

interface Props {
  onPress?: () => void;
}

const BackButton: FC<Props> = ({ onPress }) => {
  const { goBack } = useNavigation();
  
  return (
    <Pressable style={styles.container} onPress={onPress || goBack}>
      <Ionicons name="chevron-back" size={18} color={colors.active} />
      <Text style={styles.title}>Back</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    color: colors.active,
  },
});

export default BackButton;