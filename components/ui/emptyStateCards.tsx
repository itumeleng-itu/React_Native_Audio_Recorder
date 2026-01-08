import { View, Image, ImageSourcePropType } from 'react-native';
const emp: ImageSourcePropType = require("../../assets/images/empty.png")

type Props = {
  size?: number
}

export default function StackedCards({ size }: Props) {
  return (
    <View className="w-48 h-48 mb-16 mt-20 items-center justify-center">
      <View>
        <Image source={emp} 
        style={{ width: size, height: size, resizeMode: 'contain' }} />
      </View>
    </View>
  );
}