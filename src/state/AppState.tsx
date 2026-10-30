import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { DEMO_REPORTS, PLACES, Report, REPORT_KINDS, ReportKind, Depth, Point } from '@/data/places';
import { computeAllRisk, Risk } from '@/data/risk';
import { Departure, NamedPoint, planRoute, RoutePlan } from '@/data/route';
import { Hourly, loadForecast, loadTide, stormScenario, Tide } from '@/data/weather';
import { Splash } from '@/ui/Splash';
import { DEFAULT_PREFS, loadPrefs, Prefs, savePrefs } from './storage';

export type RouteRequest = { from: NamedPoint; to: NamedPoint; offSel: Departure };
export type RouteStatus = 'idle' | 'loading' | 'error' | 'same';
export type NewReport = Point & { kind: ReportKind; depth?: Depth; photo?: string };

type AppState = {
  prefs: Prefs;
  updatePrefs: (p: Partial<Prefs>) => void;
  hourly: Record<string, Hourly>;
  tide: Tide;
  live: { rain: boolean; tide: boolean };
  updatedAt: Date | null;
  loading: boolean;
  refresh: () => Promise<void>;
  risk: Record<string, Risk>;
  reports: Report[];
  addReport: (r: NewReport) => Report;
  focusId: string;
  setFocusId: (id: string) => void;
  routeReq: RouteRequest;
  routePlan: RoutePlan | null;
  routeStatus: RouteStatus;
  runRoute: (req?: Partial<RouteRequest>) => Promise<RoutePlan | null>;
  customPoints: NamedPoint[];
  addCustomPoint: (p: NamedPoint) => void;
};

const Ctx = createContext<AppState | null>(null);
export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppStateProvider');
  return v;
}

const fetchAll = () => Promise.all([loadForecast(), loadTide()]);
const DEPTH_TEXT: Record<Depth, string> = { Tobillo: 'hasta el tobillo', Rodilla: 'hasta la rodilla', Cintura: 'hasta la cintura' };
const placeOf = (id: string) => PLACES.find((p) => p.id === id)!;
const defaultRoute = (homeId: string): RouteRequest => ({
  from: placeOf('s:' + homeId),
  to: placeOf(homeId === 'centro' ? 'p:malldelsol' : 'p:malecon'),
  offSel: 0,
});

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [liveHourly, setLiveHourly] = useState<Record<string, Hourly> | null>(null);
  const [storm, setStorm] = useState<Record<string, Hourly> | null>(null);
  const [tide, setTide] = useState<Tide | null>(null);
  const [live, setLive] = useState({ rain: false, tide: false });
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [focusId, setFocusId] = useState(DEFAULT_PREFS.homeId);
  const [routeReq, setRouteReq] = useState<RouteRequest>(defaultRoute(DEFAULT_PREFS.homeId));
  // runRoute merges each change into the latest request, even two calls within one render
  const reqRef = useRef(routeReq);
  const [routePlan, setRoutePlan] = useState<RoutePlan | null>(null);
  const [routeStatus, setRouteStatus] = useState<RouteStatus>('idle');
  const [customPoints, setCustomPoints] = useState<NamedPoint[]>([]);
  const routeSeq = useRef(0);

  useEffect(() => {
    loadPrefs().then((p) => {
      setPrefs(p);
      setFocusId(p.homeId);
      reqRef.current = defaultRoute(p.homeId);
      setRouteReq(reqRef.current);
      setPrefsLoaded(true);
    });
  }, []);

  const updatePrefs = useCallback((p: Partial<Prefs>) => {
    setPrefs((old) => {
      const next = { ...old, ...p };
      savePrefs(next);
      return next;
    });
  }, []);

  const apply = useCallback(([f, t]: [Awaited<ReturnType<typeof loadForecast>>, Awaited<ReturnType<typeof loadTide>>]) => {
    setLiveHourly(f.hourly);
    setStorm(stormScenario());
    setTide(t.tide);
    setLive({ rain: f.live, tide: t.live });
    setUpdatedAt(new Date());
    setLoading(false);
  }, []);
  const refresh = useCallback(async () => {
    setLoading(true);
    apply(await fetchAll());
  }, [apply]);
  useEffect(() => {
    fetchAll().then(apply);
  }, [apply]);

  const hourly = prefs.scenario === 'storm' ? storm : liveHourly;
  const reports = useMemo(() => [...myReports, ...DEMO_REPORTS], [myReports]);
  const risk = useMemo(() => (hourly && tide ? computeAllRisk(hourly, tide, reports) : {}), [hourly, tide, reports]);

  const addReport = useCallback((r: NewReport) => {
    const kind = REPORT_KINDS[r.kind];
    const report: Report = {
      id: 'mine-' + Date.now(),
      lat: r.lat,
      lon: r.lon,
      kind: r.kind,
      text: kind.label + (r.depth ? ' ' + DEPTH_TEXT[r.depth] : ''),
      ago: 'ahora',
      confirmations: 1,
      mine: true,
      photo: r.photo,
    };
    setMyReports((old) => [report, ...old]);
    return report;
  }, []);

  const addCustomPoint = useCallback((p: NamedPoint) => setCustomPoints((old) => [p, ...old.filter((x) => x.id !== p.id)]), []);

  const runRoute = useCallback(
    async (patch?: Partial<RouteRequest>) => {
      const req = { ...reqRef.current, ...patch };
      reqRef.current = req;
      setRouteReq(req);
      if (!hourly) return null;
      if (req.from.id === req.to.id) {
        setRouteStatus('same');
        return null;
      }
      const seq = ++routeSeq.current;
      setRouteStatus('loading');
      try {
        const plan = await planRoute(req.from, req.to, req.offSel, hourly, reports);
        if (seq !== routeSeq.current) return plan;
        setRoutePlan(plan);
        setRouteStatus('idle');
        return plan;
      } catch {
        if (seq === routeSeq.current) setRouteStatus('error');
        return null;
      }
    },
    [hourly, reports],
  );

  // a new report or a new scenario changes which way is safer
  const planRef = useRef<RoutePlan | null>(null);
  useEffect(() => {
    planRef.current = routePlan;
  }, [routePlan]);
  useEffect(() => {
    if (planRef.current) runRoute();
  }, [runRoute]);

  if (!hourly || !tide || !prefsLoaded) return <Splash />;
  const value: AppState = {
          prefs,
          updatePrefs,
          hourly,
          tide,
          live,
          updatedAt,
          loading,
          refresh,
          risk,
          reports,
          addReport,
          focusId,
          setFocusId,
          routeReq,
          routePlan,
          routeStatus,
          runRoute,
          customPoints,
          addCustomPoint,
        };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
