import * as Location from 'expo-location';

import { dist, GYE_CENTER } from '@/data/places';
import { NamedPoint } from '@/data/route';

export type LocateResult = { point: NamedPoint } | { error: string };

export async function locateMe(): Promise<LocateResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { error: 'Sin permiso para ver tu ubicación. Elige un punto en el mapa.' };
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const point = { id: 'me', name: '◎ Mi ubicación', lat: pos.coords.latitude, lon: pos.coords.longitude };
    if (dist(point, GYE_CENTER) > 40000) return { error: 'Estás lejos de Guayaquil. Por ahora la app solo cubre la ciudad: elige un punto en el mapa.' };
    return { point };
  } catch {
    return { error: 'No pudimos ver tu ubicación. Elige un punto en el mapa.' };
  }
}
