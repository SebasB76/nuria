import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type Scenario = 'live' | 'storm';
export type Prefs = {
  onboarded: boolean;
  homeId: string;
  workId: string;
  schoolId: string;
  scenario: Scenario;
  model: string;
  notifyPhone: boolean;
  quietNights: boolean;
  tasksDone: number[];
};

export const DEFAULT_PREFS: Prefs = {
  onboarded: false,
  homeId: 'alborada',
  workId: 'centro',
  schoolId: 'urdesa',
  scenario: 'live',
  model: process.env.EXPO_PUBLIC_DEEPSEEK_MODEL || 'deepseek-flash',
  notifyPhone: true,
  quietNights: true,
  tasksDone: [0, 1],
};

const PREFS_KEY = 'nuria.prefs';
const API_KEY = 'nuria.deepseekKey';

export async function loadPrefs(): Promise<Prefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}
export const savePrefs = (p: Prefs) => AsyncStorage.setItem(PREFS_KEY, JSON.stringify(p));

// SecureStore has no web implementation; the web build is only for local testing
export async function getStoredKey() {
  if (Platform.OS === 'web') return AsyncStorage.getItem(API_KEY);
  return SecureStore.getItemAsync(API_KEY);
}
export async function setStoredKey(v: string) {
  if (Platform.OS === 'web') return v ? AsyncStorage.setItem(API_KEY, v) : AsyncStorage.removeItem(API_KEY);
  return v ? SecureStore.setItemAsync(API_KEY, v) : SecureStore.deleteItemAsync(API_KEY);
}
export async function getApiKey() {
  return (await getStoredKey()) || process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY || '';
}
