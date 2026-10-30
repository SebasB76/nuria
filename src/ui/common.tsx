import { Prefs } from '@/state/storage';

export const placeLabel = (prefs: Prefs, id: string) => (id === prefs.homeId ? 'Casa' : id === prefs.workId ? 'Trabajo' : id === prefs.schoolId ? 'Colegio' : null);
