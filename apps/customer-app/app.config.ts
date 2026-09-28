import type { ExpoConfig, ConfigContext } from 'expo/config';
import base from './app.json';
export default ({ config }: ConfigContext): ExpoConfig => {
  const projectId = process.env.EXPO_PUBLIC_CUSTOMER_EAS_PROJECT_ID;
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (process.env.EXPO_PUBLIC_ENV === 'production') {
    if (!projectId) throw new Error('EXPO_PUBLIC_CUSTOMER_EAS_PROJECT_ID is required');
    if (!apiUrl?.startsWith('https://')) throw new Error('A production HTTPS EXPO_PUBLIC_API_URL is required');
  }
  const baseConfig = base.expo as unknown as ExpoConfig;
  return {...config,...baseConfig,updates:projectId?{...(baseConfig.updates??{}),url:'https:'+`//u.expo.dev/${projectId}`}:baseConfig.updates,extra:{...(baseConfig.extra??{}),apiUrl,eas:{projectId}}};
};
