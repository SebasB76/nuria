// Ecuador has no daylight saving time, so local time is always UTC−5
export const TZ_OFFSET_H = -5;

export const localNow = () => new Date(Date.now() + TZ_OFFSET_H * 3600e3);
export const hourKey = (d: Date) => d.toISOString().slice(0, 13) + ':00';
export const hourOf = (t: string) => +t.slice(11, 13);

export function hShort(h: number) {
  h = ((h % 24) + 24) % 24;
  return h === 0 ? '12 am' : h === 12 ? '12 pm' : (h % 12) + (h < 12 ? ' am' : ' pm');
}

export function range(a: number, b: number) {
  const A = hShort(a), B = hShort(b);
  return A.split(' ')[1] === B.split(' ')[1] ? `${A.split(' ')[0]} a ${B}` : `${A} a ${B}`;
}

export function atHour(t: string) {
  const h = hourOf(t), today = hourKey(localNow()).slice(0, 10), pre = t.slice(0, 10) === today ? '' : 'mañana ';
  if (h === 0) return pre + 'a la medianoche';
  if (h === 12) return pre + 'al mediodía';
  return pre + (h % 12 === 1 ? 'a la ' : 'a las ') + hShort(h);
}

export function partOfDay(t: string) {
  const h = hourOf(t), today = hourKey(localNow()).slice(0, 10);
  const p = h < 5 ? 'madrugada' : h < 12 ? 'mañana' : h < 19 ? 'tarde' : 'noche';
  if (t.slice(0, 10) === today) return 'esta ' + p;
  return p === 'mañana' ? 'mañana temprano' : 'mañana en la ' + p;
}

export function clock(d: Date) {
  const l = new Date(d.getTime() + TZ_OFFSET_H * 3600e3), h = l.getUTCHours();
  return `${h % 12 || 12}:${String(l.getUTCMinutes()).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}

export function todayLong() {
  const d = localNow();
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${days[d.getUTCDay()]} ${d.getUTCDate()} de ${months[d.getUTCMonth()]}`;
}

export const hoursFromNowKey = (h: number) => hourKey(new Date(localNow().getTime() + h * 3600e3));
