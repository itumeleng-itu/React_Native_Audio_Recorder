import React from 'react';
import { Text, Pressable, PressableProps } from 'react-native';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  disabled?: boolean;
}

export default function Button({
  title,
  variant = 'primary',
  size = 'medium',
  className = '',
  disabled = false,
  ...props
}: ButtonProps) {
  
  // Variant styles
  const variantStyles = {
    primary: 'bg-blue-500 active:bg-blue-600',
    secondary: 'bg-gray-200 active:bg-gray-300',
    tertiary: 'bg-transparent active:bg-gray-100',
  };

  // Size styles
  const sizeStyles = {
    small: 'px-4 py-2',
    medium: 'px-6 py-3',
    large: 'px-8 py-4',
  };

  // Text styles based on variant
  const textVariantStyles = {
    primary: 'text-white',
    secondary: 'text-gray-900',
    tertiary: 'text-blue-500',
  };

  // Text size styles
  const textSizeStyles = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  return (
    <Pressable
      className={`
        rounded-full
        items-center
        justify-center
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabled ? 'opacity-50' : ''}
        ${className}
      `}
      disabled={disabled}
      style={({ pressed }) => ({
        opacity: pressed && !disabled ? 0.8 : 1,
      })}
      {...props}
    >
      <Text
        className={`
          font-semibold
          ${textVariantStyles[variant]}
          ${textSizeStyles[size]}
        `}
      >
        {title}
      </Text>
    </Pressable>
  );
}