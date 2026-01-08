import Button from "@/components/ui/button";
import { Image, Text, View } from 'react-native';

const emptyRecent = require("../../assets/images/empty.png");
const emptyHistory = require("../../assets/images/Silhouette with Headphones.png");

type Props = {
  tabIndex: number;
  onRecordPress: () => void;
}

export default function EmptyState({ tabIndex, onRecordPress }: Props) {
  return (
    <View className="flex-1 items-center justify-center">
      {/* Empty state image */}
      <View className="mb-10">
        <Image 
          source={tabIndex === 0 ? emptyRecent : emptyHistory} 
          style={{ width: 300, height: 300, resizeMode: 'contain' }} 
        />
      </View>

      {/* Empty state text */}
      <Text className="text-2xl font-bold text-gray-700 text-center px-6">
        {tabIndex === 0 
          ? "No recent recording?" 
          : "No past recording?"
        } Start recording.
      </Text>
      
      {/* Record button */}
      <View className="mb-10 mt-10">
        <Button 
          title="Record Note" 
          variant="primary" 
          onPress={onRecordPress}
        />
      </View>
    </View>
  );
}
