import { TextInput, View } from 'react-native';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
}

export default function SearchBar({ value, onChangeText }: Props) {
  return (
    <View className="mb-4">
      <TextInput
        className="bg-gray-100 rounded-xl px-4 py-3 text-base"
        placeholder="Search by name..."
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}
