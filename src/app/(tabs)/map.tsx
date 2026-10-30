import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeOutDown,
  ReduceMotion,
  useReducedMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  dist,
  fold,
  LEVELS,
  nearestSector,
  Place,
  PLACES,
  sectorById,
} from "@/data/places";
import { headline } from "@/data/risk";
import { LeafletMap } from "@/map/LeafletMap";
import { cityView, reportMarks, sectorMarks } from "@/map/scenes";
import { MapEvent, MapScene } from "@/map/types";
import { useApp } from "@/state/AppState";
import { Drop, Icon } from "@/ui/icons";
import { Chip } from "@/ui/kit";
import { C, F } from "@/ui/theme";
import { PressableScale } from "@/ui/PressableScale";
import { useLightStatusBar } from "@/ui/statusBar";

type Layer = "clouds" | "sectors" | "reports";
const LAYER_LABEL: Record<Layer, string> = {
  clouds: "☁️ Nubes",
  sectors: "💧 Barrios",
  reports: "📣 Reportes",
};
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const SHEET_IN = FadeInDown.duration(240)
  .easing(EASE_OUT)
  .reduceMotion(ReduceMotion.System);
const SHEET_OUT = FadeOutDown.duration(180)
  .easing(EASE_OUT)
  .reduceMotion(ReduceMotion.System);

export default function MapScreen() {
  const app = useApp();
  const insets = useSafeAreaInsets();
  useLightStatusBar();
  const [layers, setLayers] = useState<Record<Layer, boolean>>({
    clouds: true,
    sectors: true,
    reports: true,
  });
  const reduced = useReducedMotion();
  // with reduced motion the clouds start still; the person can still play them
  const [playing, setPlaying] = useState(!reduced);
  const [cloudLabel, setCloudLabel] = useState(
    "Cargando la foto del satélite…",
  );
  const [view, setView] = useState<MapScene["view"]>(cityView());
  const [sheetH, setSheetH] = useState(240);
  const [sheetOpen, setSheetOpen] = useState(true);
  const [query, setQuery] = useState("");
  const q = fold(query.trim());
  const matches = q
    ? PLACES.filter((p) => fold(p.name).includes(q)).slice(0, 6)
    : [];
  const s = sectorById(app.focusId),
    l = app.risk[s.id].level;
  const nearReports = app.reports.filter((r) => dist(r, s) < 1800).length;

  const scene: MapScene = useMemo(
    () => ({
      sectors: layers.sectors ? sectorMarks(app.risk, app.focusId) : [],
      reports: layers.reports ? reportMarks(app.reports) : [],
      clouds: layers.clouds,
      cloudsPlaying: playing,
      view,
    }),
    [layers, playing, app.risk, app.focusId, app.reports, view],
  );

  const onEvent = (e: MapEvent) => {
    if (e.type === "sector") {
      if (e.id !== app.focusId) Haptics.selectionAsync().catch(() => {});
      app.setFocusId(e.id);
      setSheetOpen(true);
    }
    if (e.type === "clouds") setCloudLabel(e.label);
  };

  // a place outside the barrio list opens the barrio that covers it
  const goTo = (p: Place) => {
    Keyboard.dismiss();
    setQuery("");
    app.setFocusId(nearestSector(p).id);
    setSheetOpen(true);
    setView({ points: [[p.lat, p.lon]], zoom: 14, key: p.id + Date.now() });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#1b2229" }}>
      <LeafletMap
        scene={scene}
        onEvent={onEvent}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[styles.top, { top: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <View style={styles.search}>
          <Icon name="search" size={18} color={C.ink2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Busca un barrio o lugar"
            placeholderTextColor={C.ink2}
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={() => matches[0] && goTo(matches[0])}
            accessibilityLabel="Buscar un barrio o lugar"
          />
          {!!query && (
            <Pressable
              onPress={() => setQuery("")}
              hitSlop={10}
              accessibilityLabel="Borrar la búsqueda"
            >
              <Icon name="close" size={16} color={C.ink2} />
            </Pressable>
          )}
        </View>
        {!!q && (
          <View style={styles.results}>
            {matches.length ? (
              matches.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => goTo(p)}
                  style={({ pressed }) => [
                    styles.result,
                    pressed && { backgroundColor: C.paper },
                  ]}
                >
                  <Icon
                    name={p.group === "Barrios" ? "drop" : "pin"}
                    size={16}
                    color={C.celDeep}
                  />
                  <Text style={styles.resultText}>{p.name}</Text>
                  <Text style={styles.resultGroup}>
                    {p.group === "Barrios" ? "Barrio" : "Lugar"}
                  </Text>
                </Pressable>
              ))
            ) : (
              <Text style={styles.noResult}>
                No encontré esa zona. Prueba con un barrio de Guayaquil.
              </Text>
            )}
          </View>
        )}
        {layers.clouds && (
          <PressableScale
            style={styles.float}
            onPress={() => setPlaying(!playing)}
            accessibilityLabel={
              playing ? "Pausar las nubes" : "Ver cómo se mueven las nubes"
            }
          >
            <Icon
              name={playing ? "pause" : "play"}
              size={14}
              color={C.ink}
              strokeWidth={2.6}
            />
            <Text style={styles.floatText}>{cloudLabel}</Text>
          </PressableScale>
        )}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
        >
          {(Object.keys(LAYER_LABEL) as Layer[]).map((k) => (
            <Chip
              key={k}
              label={LAYER_LABEL[k]}
              on={layers[k]}
              onPress={() => setLayers({ ...layers, [k]: !layers[k] })}
            />
          ))}
          <Chip
            label="🏙️ Toda la ciudad"
            onPress={() => setView(cityView("city" + Date.now()))}
          />
        </ScrollView>
      </View>

      <PressableScale
        style={[styles.fab, { bottom: sheetOpen ? sheetH + 18 : 18 }]}
        onPress={() => router.push("/report")}
        accessibilityLabel="Reportar mi calle"
      >
        <Icon name="camera" size={20} color="#fff" />
        <Text style={styles.fabText}>Reportar</Text>
      </PressableScale>

      {sheetOpen && (
        <Animated.View
          entering={SHEET_IN}
          exiting={SHEET_OUT}
          style={styles.sheet}
          onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}
        >
          <View style={styles.grab} />
          <Pressable
            onPress={() => setSheetOpen(false)}
            hitSlop={12}
            style={styles.closeBtn}
            accessibilityLabel="Cerrar la ficha del barrio"
          >
            <Icon name="close" size={16} color={C.ink2} strokeWidth={2.4} />
          </Pressable>
          <Pressable
            style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            onPress={() =>
              setView({
                points: [[s.lat, s.lon]],
                zoom: 14,
                key: s.id + Date.now(),
              })
            }
          >
            <Drop level={l} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>
                {s.name} · {l.name}
              </Text>
              <Text style={styles.sheetSub}>
                {headline(app.hourly[s.id], app.tide)}
              </Text>
              <Text style={styles.sheetSub}>
                {nearReports
                  ? `📣 ${nearReports} ${nearReports === 1 ? "reporte" : "reportes"} de vecinos cerca hoy.`
                  : "Nadie ha reportado agua cerca hoy."}
              </Text>
            </View>
          </Pressable>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            <Chip
              label="Ver su día"
              onPress={() => router.navigate("/")}
              style={{ flex: 1, justifyContent: "center" }}
            />
            <Chip
              label="Ruta desde aquí"
              onPress={() => {
                app.runRoute({
                  from: PLACES.find((p) => p.id === "s:" + s.id)!,
                });
                router.navigate("/route");
              }}
              style={{ flex: 1, justifyContent: "center" }}
            />
          </View>
          <View style={styles.legend}>
            {LEVELS.map((lv) => (
              <View key={lv.key} style={styles.legendItem}>
                <Drop level={lv} size={20} />
                <Text style={styles.legendText}>{lv.name}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.note}>
            La gota más llena = más riesgo de que se inunde la calle. Lo blanco
            que se mueve son nubes de verdad, vistas por el satélite.
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: "absolute", left: 12, right: 12, gap: 8 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: F.medium,
    fontSize: 16,
    color: C.ink,
    paddingVertical: 0,
  },
  results: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 4,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  result: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  resultText: { flex: 1, fontFamily: F.bold, fontSize: 15, color: C.ink },
  resultGroup: { fontFamily: F.medium, fontSize: 12.5, color: C.ink2 },
  noResult: {
    fontFamily: F.medium,
    fontSize: 14,
    color: C.ink2,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  closeBtn: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.paper,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  float: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  floatText: { fontFamily: F.bold, fontSize: 12.5, color: C.ink },
  fab: {
    position: "absolute",
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: C.navy,
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 15,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: { fontFamily: F.bold, fontSize: 14, color: "#fff" },
  sheet: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 8,
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 14,
    paddingTop: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 14,
  },
  grab: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DDD5C7",
    alignSelf: "center",
    marginBottom: 10,
  },
  sheetTitle: { fontFamily: F.display, fontSize: 19, color: C.ink },
  sheetSub: { fontFamily: F.body, fontSize: 13, lineHeight: 18, color: C.ink2 },
  legend: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EFE8DC",
  },
  legendItem: { alignItems: "center", gap: 2, flex: 1 },
  legendText: { fontFamily: F.bold, fontSize: 11, color: C.ink2 },
  note: {
    fontFamily: F.body,
    fontSize: 11.5,
    lineHeight: 15,
    color: C.muted,
    marginTop: 8,
    textAlign: "center",
  },
});
