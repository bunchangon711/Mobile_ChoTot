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
      {!profile?.verified && (
        <View style={styles.verificationLinkContainer}>
          <Text style={styles.verificationTitle}>
            It look like your profile is not verified.
          </Text>
          {busy ? (
            <Text style={styles.verificationLink}>Please Wait...</Text>
          ) : (
            <Text onPress={getVerificationLink} style={styles.verificationLink}>
              Tap here to get the link.
            </Text>
          )}
        </View>
      )}
      {/* Profile image and profile info */}
      <View style={styles.profileContainer}>
        <View>
          <Pressable onPress={updateAvatar}>
            <AvatarView uri={profile?.avatar} size={80} />
            <View style={styles.editIconContainer}>
              <MaterialIcons name="edit" size={16} color={colors.primary} />
            </View>
          </Pressable>
        </View>

        <View style={styles.profileInfo}>
          <View style={styles.nameContainer}>
            <View style={styles.nameEditContainer}>
              <TextInput
                value={userName}
                onChangeText={(text) => setUserName(text)}
                style={styles.name}
              />
              <MaterialIcons name="edit" size={16} color={colors.primary} />
            </View>
            {isNameChanged && (
              <Pressable onPress={updateProfile}>
                <AntDesign name="check" size={24} color={colors.primary} />
              </Pressable>
            )}
          </View>
          <Text style={styles.email}>{profile?.email}</Text>
        </View>
      </View>

      <FormDivider />

      {/* Options for profile */}

      <ProfileOptionListItem
        style={styles.marginBottom}
        antIconName="message1"
        title="Messages"
        onPress={onMessagePress}
        active={totalUnreadMessages > 0}
      />
      <ProfileOptionListItem
        style={styles.marginBottom}
        antIconName="appstore-o"
        title="Your Listings"
        onPress={onListingPress}
      />
      <ProfileOptionListItem
        antIconName="logout"
        title="Log out"
        onPress={signOut}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  verificationLinkContainer: {
    padding: 10,
    backgroundColor: colors.deActive,
    marginVertical: 10,
    borderRadius: 5,
  },
  verificationTitle: {
    fontWeight: "600",
    color: colors.primary,
    textAlign: "center",
  },
  verificationLink: {
    fontWeight: "600",
    color: colors.active,
    textAlign: "center",
    paddingTop: 5,
  },
  container: {
    padding: size.padding,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileInfo: {
    flex: 1,
    paddingLeft: size.padding,
  },
  name: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "bold",
  },
  email: {
    color: colors.primary,
    paddingTop: 2,
  },
  marginBottom: {
    marginBottom: 15,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  editIconContainer: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: colors.white,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  nameEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default Profile;
