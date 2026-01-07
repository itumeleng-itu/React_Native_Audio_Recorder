import { View, Pressable, Text, Image } from "react-native";
const Logo = require("../assets/images/rcd.png");

export default function Index() {
  function handleClick() {
    alert("hello")
    
  }

  return (
    <Pressable 
    onPress ={handleClick}
    className="flex-1 items-center justify-center bg-white">
      <View className="items-center">
        <Image 
          source={Logo} 
          style={{ width: 150, height: 150 }} // Fixed dimensions
          resizeMode="contain"               // Ensures the image isn't cropped
        />
        <Text className="text-3xl font-bold text-#494949">
          Note Recorder.
        </Text>
        <Text className="text-sm font-normal text-gray-550">
          click anywhere to record.
        </Text>

      </View>
    </Pressable>
  );
}