import { View, Text } from "react-native";
import { Image } from "react-native-reanimated/lib/typescript/Animated";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-3xl font-bold text-#494949">
        Note Recorder.
      </Text>
      <Text className="text-sm font-normal text-gray-550">
        click anywhere to record.
      </Text>
      <Image 
    </View>
  );
}