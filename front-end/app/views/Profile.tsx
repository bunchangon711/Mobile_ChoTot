import ProfileOptionListItem from "@components/ProfileOptionListItem";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import AvatarView from "@ui/AvatarView";
import FormDivider from "@ui/FormDivider";
import colors from "@utils/colors";
import size from "@utils/size";
import useAuth from "app/hooks/useAuth";
import { ProfileNavigatorParamList } from "app/navigator/ProfileNavigator";
import { FC, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  Pressable,
  RefreshControl,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { runAxiosAsync } from "app/api/runAxiosAsync";
import useClient from "app/hooks/useClient";
import { ProfileRes } from "app/navigator";
import { useDispatch, useSelector } from "react-redux";
import { updateAuthState } from "app/store/auth";
import { showMessage } from "react-native-flash-message";
import { getUnreadChatsCount } from "app/store/chats";
import React from "react";
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from "@expo/vector-icons";

interface Props {}

const Profile: FC<Props> = (props) => {
  const { navigate } =
    useNavigation<NavigationProp<ProfileNavigatorParamList>>();

  const { authState, signOut } = useAuth();
  const { profile } = authState;
  const [userName, setUserName] = useState(profile?.name || "");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { authClient } = useClient();
  const dispatch = useDispatch();
  const totalUnreadMessages = useSelector(getUnreadChatsCount);

  const isNameChanged =
    profile?.name !== userName && userName.trim().length >= 3;

  const onMessagePress = () => {
    navigate("Chats");
  };

  const onListingPress = () => {
    navigate("Listings");
  };

  const fetchProfile = async () => {
    setRefreshing(true);
    const res = await runAxiosAsync<{ profile: ProfileRes }>(
      authClient.get("/auth/profile")
    );
    setRefreshing(false);
    if (res) {
      dispatch(
        updateAuthState({
          profile: { ...profile!, ...res.profile },
          pending: false,
        })
      );
    }
  };

  const getVerificationLink = async () => {
    setBusy(true);
    const res = await runAxiosAsync<{ message: string }>(
      authClient.get("/auth/verify-token")
    );
    setBusy(false);
    if (res) {
      showMessage({ message: res.message, type: "success" });
    }
  };

  const updateProfile = async () => {
    const res = await runAxiosAsync<{ profile: ProfileRes }>(
      authClient.patch("/auth/update-profile", { name: userName })
    );
    if (res) {
      showMessage({ message: "Name updated successfully.", type: "success" });
      dispatch(
        updateAuthState({
          pending: false,
          profile: { ...profile!, ...res.profile },
        })
      );
    }
  };

  const updateAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      const formData = new FormData();
      formData.append('avatar', {
        uri: result.assets[0].uri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);

      const res = await runAxiosAsync<{ profile: ProfileRes }>(
        authClient.patch("/auth/update-avatar", formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      );

      if (res) {
        dispatch(
          updateAuthState({
            pending: false,
            profile: { ...profile!, ...res.profile },
          })
        );
        showMessage({ message: "Avatar updated successfully", type: "success" });
      }
    }
  };

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={fetchProfile} />
      }
      contentContainerStyle={styles.container}
    >
      {/* Thông báo xác thực */}
      {!profile?.verified && (
        <View style={styles.verificationLinkContainer}>
          <Text style={styles.verificationTitle}>
            Your profile is not verified.
          </Text>
          {busy ? (
            <Text style={styles.verificationLink}>Please wait...</Text>
          ) : (
            <Text onPress={getVerificationLink} style={styles.verificationLink}>
              Tap here to verify your profile.
            </Text>
          )}
        </View>
      )}
  
      {/* Avatar và thông tin cá nhân */}
      <View style={styles.profileHeader}>
        <Pressable onPress={updateAvatar}>
          <AvatarView uri={profile?.avatar} size={100} />
          <View style={styles.editIconContainer}>
            <MaterialIcons name="edit" size={16} color={colors.primary} />
          </View>
        </Pressable>
        <TextInput
          value={userName}
          onChangeText={setUserName}
          style={styles.name}
          placeholder="Enter your name"
        />
        {isNameChanged && (
          <Pressable onPress={updateProfile} style={styles.updateButton}>
            <AntDesign name="check" size={20} color="#FFF" />
            <Text style={styles.updateButtonText}>Save</Text>
          </Pressable>
        )}
        <Text style={styles.email}>{profile?.email}</Text>
      </View>
  
      {/* Tuỳ chọn */}
      <View style={styles.optionsContainer}>
        <ProfileOptionListItem
          style={styles.optionCard}
          antIconName="message1"
          title="Messages"
          onPress={onMessagePress}
          active={totalUnreadMessages > 0}
        />
        <ProfileOptionListItem
          style={styles.optionCard}
          antIconName="appstore-o"
          title="Your Listings"
          onPress={onListingPress}
        />
        <ProfileOptionListItem
          style={styles.optionCard}
          antIconName="logout"
          title="Log out"
          onPress={signOut}
        />
      </View>
    </ScrollView>
  );
  
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  verificationLinkContainer: {
    backgroundColor: "#E8F5E9",
    padding: 20,
    marginBottom: 25,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#388E3C",
  },
  verificationTitle: {
    fontWeight: "bold",
    color: "#388E3C",
    textAlign: "center",
    fontSize: 16,
    marginBottom: 10,
  },
  verificationLink: {
    fontWeight: "600",
    color: "#2E7D32",
    textAlign: "center",
    textDecorationLine: "underline",
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 25,
    padding: 30,
    backgroundColor: "#E8F5E9",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#388E3C",
    marginTop: 15,
    textAlign: "center",
  },
  email: {
    fontSize: 16,
    color: "#616161",
    marginTop: 8,
  },
  editIconContainer: {
    position: "absolute",
    bottom: -10,
    right: -10,
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderRadius: 15,
    borderColor: "#388E3C",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  updateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    backgroundColor: "#388E3C",
    padding: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  updateButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 10,
  },
  optionsContainer: {
    marginTop: 25,
  },
  optionCard: {
    backgroundColor: "#F1F8E9",
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderColor: "#388E3C",
    borderWidth: 1,
  },
});



export default Profile;

