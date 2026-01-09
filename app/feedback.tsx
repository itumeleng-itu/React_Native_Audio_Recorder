import { router } from "expo-router";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";

export default function Feedback() {
  
  function handleBack() {
    router.back();
  }

  function handleEmail() {
    Linking.openURL('mailto:support@noterecorder.com?subject=Note Recorder Feedback');
  }

  function handleRate() {
    // This would link to the app store in production
    Linking.openURL('https://play.google.com/store');
  }

  return (
    <View className="flex-1 bg-white">
      <View className="px-6 pt-12 pb-4 border-b border-gray-100">
        <Pressable onPress={handleBack} className="mb-4">
          <Text className="text-blue-500 text-base">Back</Text>
        </Pressable>
        <Text className="text-2xl font-bold text-gray-800">Feedback & Support</Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        <View className="bg-gray-50 rounded-2xl p-6 mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">Note Recorder</Text>
          <Text className="text-sm text-gray-500">Version 1.0.0</Text>
          <Text className="text-sm text-gray-500 mt-1">Your personal voice notes app</Text>
        </View>

        <Text className="text-base font-semibold text-gray-800 mb-4">Get in Touch</Text>

        <Pressable 
          onPress={handleEmail}
          className="bg-gray-50 rounded-xl p-4 mb-3 active:bg-gray-100"
        >
          <Text className="text-base font-semibold text-gray-800">Send Feedback</Text>
          <Text className="text-sm text-gray-500 mt-1">
            Found a bug? Let us know!
          </Text>
        </Pressable>

        <Pressable 
          onPress={handleRate}
          className="bg-gray-50 rounded-xl p-4 mb-3 active:bg-gray-100"
        >
          <Text className="text-base font-semibold text-gray-800">Rate the App</Text>
          <Text className="text-sm text-gray-500 mt-1">
            Enjoying Note Recorder? Leave us a review!
          </Text>
        </Pressable>

        <Text className="text-base font-semibold text-gray-800 mb-4 mt-6">FAQs</Text>

        <View className="bg-gray-50 rounded-xl p-4 mb-3">
          <Text className="text-sm font-semibold text-gray-800">How do I delete a recording?</Text>
          <Text className="text-sm text-gray-500 mt-1">
            Tap and hold on any recording card, then select "Delete".
          </Text>
        </View>

        <View className="bg-gray-50 rounded-xl p-4 mb-3">
          <Text className="text-sm font-semibold text-gray-800">How do I rename a recording?</Text>
          <Text className="text-sm text-gray-500 mt-1">
            Tap and hold on any recording card, then select "Rename".
          </Text>
        </View>

        <View className="bg-gray-50 rounded-xl p-4 mb-3">
          <Text className="text-sm font-semibold text-gray-800">Where are my recordings stored?</Text>
          <Text className="text-sm text-gray-500 mt-1">
            All recordings are stored locally on your device and persist even when the app is closed.
          </Text>
        </View>

        <View className="bg-gray-50 rounded-xl p-4 mb-6">
          <Text className="text-sm font-semibold text-gray-800">What is Recent vs History?</Text>
          <Text className="text-sm text-gray-500 mt-1">
            Recent shows recordings from the last 24 hours. Older recordings move to History.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
