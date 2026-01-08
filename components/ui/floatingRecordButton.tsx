import { Pressable, View } from 'react-native';

type Props = {
  onPress: () => void;
}

export default function FloatingRecordButton({ onPress }: Props) {
  return (
    <View className="absolute bottom-6 right-0 left-0 items-center">
      <Pressable
        onPress={onPress}
        className="bg-gray-800 w-16 h-16 rounded-full items-center justify-center shadow-lg active:bg-gray-900"
      >
        <View className="w-4 h-4 rounded-full bg-red-500" />
      </Pressable>
    </View>
  );
}
