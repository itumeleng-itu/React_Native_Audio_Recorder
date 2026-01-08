import { Image, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
const Logo = require("../assets/images/rcd.png");

export default function Index() {
  function handleClick() {
    router.push('/landing')
  }

  return (
    <Pressable 
      onPress={handleClick}
      className="flex-1 items-center justify-center bg-white"
    >
      <View className="items-center">
        <Image 
          source={Logo} 
          style={{ width: 150, height: 150 }}
          resizeMode="contain"               
        />
        <Text className="text-3xl font-extrabold text-gray-700 text-center">
          Note Recorder.
        </Text>
        <Text className="text-sm font-semibold italic text-gray-600 text-center">
          click waves to start.
        </Text>
      </View>
    </Pressable>
  );
}