import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { DAD_DESTINATION, INITIAL_FAMILY, Member, MemberStatus, Privacy } from '@/data/family';
import { dist, isBlocking, nearestSector, Point, Report } from '@/data/places';
import { osrm, samples } from '@/data/route';
import { useToast } from '@/ui/Toast';
import { useApp } from './AppState';

type FamilyState = {
  members: Member[];
  privacy: Privacy;
  setPrivacy: (p: Privacy) => void;
  askFamily: () => void;
  setStatus: (id: string, status: MemberStatus) => void;
  sos: Member | null;
  triggerSos: (id: string) => void;
  clearSos: () => void;
  zoneOf: (m: Point) => { sectorId: string; wet: Report | undefined };
};

const Ctx = createContext<FamilyState | null>(null);
export function useFamily() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useFamily outside FamilyProvider');
  return v;
}

export function FamilyProvider({ children }: { children: ReactNode }) {
  const { reports } = useApp();
  const toast = useToast();
  const [members, setMembers] = useState<Member[]>(INITIAL_FAMILY);
  const [privacy, setPrivacy] = useState<Privacy>('always');
  const [sosId, setSosId] = useState<string | null>(null);
  const warned = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const zoneOf = useCallback(
    (m: Point) => ({ sectorId: nearestSector(m).id, wet: reports.filter(isBlocking).find((r) => dist(m, r) < 300) }),
    [reports],
  );
  const zoneRef = useRef(zoneOf);
  useEffect(() => {
    zoneRef.current = zoneOf;
  }, [zoneOf]);

  const patch = useCallback((id: string, p: Partial<Member>) => setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, ...p } : m))), []);

  // Papá drives from Centro to Durán on real streets, one step every 1.2 s
  useEffect(() => {
    let path: Point[] = [];
    let step = 0;
    let timer: ReturnType<typeof setInterval>;
    const dad = INITIAL_FAMILY.find((m) => m.id === 'dad')!;
    osrm([dad, DAD_DESTINATION], false)
      .then(([r]) => (path = samples(r.coords, 90)))
      .catch(() => (path = Array.from({ length: 40 }, (_, k) => ({ lat: dad.lat + ((DAD_DESTINATION.lat - dad.lat) * k) / 39, lon: dad.lon + ((DAD_DESTINATION.lon - dad.lon) * k) / 39 }))))
      .then(() => {
        timer = setInterval(() => {
          if (step >= path.length - 1) {
            clearInterval(timer);
            patch('dad', { moving: false });
            return;
          }
          const q = path[++step];
          setMembers((ms) => {
            const next = ms.map((m) => (m.id === 'dad' ? { ...m, lat: q.lat, lon: q.lon } : m));
            const d = next.find((m) => m.id === 'dad')!;
            if (!warned.current && d.status !== 'ok' && zoneRef.current(d).wet) {
              warned.current = true;
              setTimeout(() => toast('Tamy: Papá está cerca de una calle con agua y no ha confirmado que está bien.'), 0);
            }
            return next;
          });
        }, 1200);
      });
    return () => clearInterval(timer);
  }, [patch, toast]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const askFamily = useCallback(() => {
    setMembers((ms) => ms.map((m) => (!m.me && m.status !== 'help' ? { ...m, status: 'wait' } : m)));
    const later = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));
    later(1500, () => patch('mom', { status: 'ok', okAgo: 0 }));
    later(3000, () => patch('daughter', { status: 'ok', okAgo: 0 }));
    later(6000, () => {
      setMembers((ms) => ms.map((m) => (m.id === 'dad' && m.status === 'wait' ? { ...m, status: 'unknown' } : m)));
      toast('Papá no responde. Tamy le escribió por WhatsApp y te avisa apenas conteste.');
    });
  }, [patch, toast]);

  const setStatus = useCallback((id: string, status: MemberStatus) => patch(id, { status, okAgo: status === 'ok' ? 0 : null }), [patch]);
  const triggerSos = useCallback(
    (id: string) => {
      patch(id, { status: 'help' });
      setSosId(id);
    },
    [patch],
  );

  return (
    <Ctx.Provider
      value={{
        members,
        privacy,
        setPrivacy,
        askFamily,
        setStatus,
        sos: members.find((m) => m.id === sosId) ?? null,
        triggerSos,
        clearSos: () => setSosId(null),
        zoneOf,
      }}>
      {children}
    </Ctx.Provider>
  );
}
