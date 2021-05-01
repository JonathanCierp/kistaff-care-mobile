import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import React, { useEffect, useState } from "react";
import { Platform, View, TextInput } from "react-native";
import { WebView } from "react-native-webview";
import axios from "axios";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [token, setToken] = useState("");

  useEffect(() => {
    registerForPushNotificationsAsync().then((t) => {
      setToken(t);
    });
  });

  return (
    <WebView
      source={{ uri: "http://kistaff-front-test.vercel.app" }}
      injectedJavaScript=""
      onMessage={(event) => {
        registerDevice(
          event.nativeEvent.data.split(" ")[0],
          token,
          event.nativeEvent.data.split(" ")[1]
        );
      }}
      style={{ marginTop: 25 }}
    />
  );
}

async function registerDevice(contactId, token, jwt) {
  const device = {
    xEmployee__c: contactId,
    xModel__c: Platform.OS,
    xCategory__c: "Phone",
    xToken__c: token,
  };

  try {
    await axios.post("https://kistaff-api-prod.herokuapp.com/devices", device, {
      headers: {
        Accept: "application/json",
        Authorization: jwt,
      },
    });
  } catch (e) {
    console.log(e);
  }
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Constants.isDevice) {
    const {
      status: existingStatus,
    } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }
    token = (await Notifications.getDevicePushTokenAsync()).data;
  } else {
    alert("Must use physical device for Push Notifications");
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}
