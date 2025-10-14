import { useColorScheme } from 'react-native';

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    isDark,
    colors: {
      // Backgrounds
      background: isDark ? '#121212' : '#FFFFFF',
      surface: isDark ? '#1E1E1E' : '#FFFFFF',
      surfaceElevated: isDark ? '#262626' : '#F5F5F5',
      card: isDark ? '#1E1E1E' : '#FFFFFF',
      
      // Text
      text: isDark ? 'rgba(255, 255, 255, 0.87)' : '#000000',
      textSecondary: isDark ? 'rgba(255, 255, 255, 0.6)' : '#8A8E9E',
      textTertiary: isDark ? 'rgba(255, 255, 255, 0.4)' : '#8687A6',
      
      // Brand & Accent
      primary: isDark ? '#4F7AFF' : '#2563FF',
      primaryDark: isDark ? '#3B61DB' : '#1E40AF',
      
      // Semantic colors
      success: isDark ? '#66BB6A' : '#4BB8A8',
      warning: isDark ? '#FFB74D' : '#D9E85C',
      error: isDark ? '#EF5350' : '#E45E5E',
      
      // Borders & Dividers
      border: isDark ? '#2A2A2A' : '#DADCE0',
      borderLight: isDark ? '#1E1E1E' : '#DADDE4',
      
      // Icons
      icon: isDark ? 'rgba(255, 255, 255, 0.87)' : '#000000',
      iconSecondary: isDark ? 'rgba(255, 255, 255, 0.6)' : '#8A8E9E',
      
      // Special backgrounds
      tabBar: isDark ? '#1E1E1E' : '#FFFFFF',
      tabBarBorder: isDark ? '#2A2A2A' : '#DADCE0',
      
      // Empty state background
      emptyStateBg: isDark ? '#262626' : '#F4F5F7',
      
      // Profile card background
      profileCard: isDark ? '#1A1A2E' : '#F8F9FF',
      
      // Search background
      searchBg: isDark ? '#262626' : '#FFFFFF',
      
      // Input placeholder
      placeholder: isDark ? 'rgba(255, 255, 255, 0.4)' : '#84879B',

      // Drawing specific colors
      canvasBackground: isDark ? '#1A1A1A' : '#FAFAFA',
      strokeColor: isDark ? '#FFFFFF' : '#000000',
      highlightColor: isDark ? '#FFD700' : '#FFC107',
      eraserColor: isDark ? '#1A1A1A' : '#FAFAFA',
    },
  };
};

export const getProgressColor = (progress, isDark) => {
  if (progress >= 80) return isDark ? '#66BB6A' : '#4BB8A8';
  if (progress >= 60) return isDark ? '#FFB74D' : '#D9E85C';
  return isDark ? '#EF5350' : '#E45E5E';
};