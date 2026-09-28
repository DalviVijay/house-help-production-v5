import Constants from 'expo-constants';
const raw=Constants.expoConfig?.extra?.apiUrl??process.env.EXPO_PUBLIC_API_URL;
if(!raw)throw new Error('EXPO_PUBLIC_API_URL is required');
if(!/^https:\/\//.test(raw)&&process.env.NODE_ENV==='production')throw new Error('Production API URL must use HTTPS');
export const runtime={apiUrl:raw.replace(/\/$/,''),isProduction:process.env.EXPO_PUBLIC_ENV==='production'} as const;
