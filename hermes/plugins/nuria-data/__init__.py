"""Nuria's tools on WhatsApp: live rain and flood risk per Guayaquil neighborhood.

A port of the app's src/data (places, weather, risk, time), so WhatsApp and the app give the same answer.
These are the only tools the WhatsApp agent gets: strangers write to it, so no terminal, files or browser.
"""
import json
import math
import os
import time
import unicodedata
import urllib.request
from datetime import datetime, timedelta, timezone

TZ = timezone(timedelta(hours=-5))
CACHE_SECONDS = 600

# id, name, lat, lon, terrain (how low the ground is), reports: illustrative values, same as the app
SECTORS = [
    ("alborada", "Alborada", -2.14, -79.902, 0.75, 0.6),
    ("sauces", "Sauces y Samanes", -2.121, -79.904, 0.8, 0.7),
    ("urdesa", "Urdesa", -2.164, -79.91, 0.6, 0.3),
    ("centro", "Centro", -2.194, -79.884, 0.5, 0.4),
    ("trinitaria", "Isla Trinitaria", -2.236, -79.922, 0.85, 0.5),
    ("guasmo", "Guasmo", -2.268, -79.888, 0.8, 0.6),
    ("bastion", "Bastión Popular", -2.083, -79.957, 0.7, 0.5),
    ("mapasingue", "Mapasingue", -2.152, -79.935, 0.6, 0.3),
    ("costa", "Vía a la Costa", -2.183, -79.995, 0.35, 0.1),
    ("samborondon", "Samborondón", -2.142, -79.866, 0.55, 0.3),
    ("duran", "Durán", -2.172, -79.833, 0.7, 0.4),
]
# extra names people use for a place, mapped to the neighborhood that covers it
ALIASES = {"samanes": "sauces", "malecon": "centro", "malecon 2000": "centro", "las penas": "centro",
           "kennedy": "urdesa", "garzota": "alborada", "prosperina": "mapasingue", "espol": "mapasingue",
           "ceibos": "costa", "puerto azul": "costa", "la puntilla": "samborondon"}

LEVELS = [
    (25, "Tranquilo", "No se espera agua en la calle."),
    (50, "Ojo", "Mantente atento. Ten un plan si vas a salir."),
    (75, "Cuidado", "Es probable que se junte agua en las calles bajas."),
    (101, "Peligro", "Riesgo alto de inundación. Evita las zonas bajas y sigue al INAMHI y a la SNGR."),
]
RAIN = [(0.5, 0, "sin lluvia"), (2.5, 1, "llovizna"), (7.6, 2, "lluvia moderada"), (30, 3, "lluvia fuerte"),
        (1e9, 4, "lluvia muy fuerte")]
TODO = {
    "Tranquilo": ["Revisa que la alcantarilla de tu cuadra no tenga basura.",
                  "Guarda tus papeles importantes en una funda plástica."],
    "Ojo": ["Carga el celular y la batería externa.", "Ten lista la mochila de emergencia."],
    "Cuidado": ["Sube papeles, medicinas y aparatos a un lugar alto.",
                "Mueve el carro a una zona alta antes de la lluvia.", "Evita los pasos a desnivel."],
    "Peligro": ["Quédate en un lugar alto y seguro.", "No camines ni manejes por calles con agua que corre.",
                "Si el agua entra a tu casa, corta la luz y llama al 911."],
}

_cache: dict[str, tuple[float, object]] = {}


def _get_json(url: str):
    hit = _cache.get(url)
    if hit and time.time() - hit[0] < CACHE_SECONDS:
        return hit[1]
    with urllib.request.urlopen(url, timeout=15) as r:
        data = json.load(r)
    _cache[url] = (time.time(), data)
    return data


def _now() -> datetime:
    return datetime.now(TZ)


def _hour_key(d: datetime) -> str:
    return d.strftime("%Y-%m-%dT%H:00")


def _synth_times() -> list[str]:
    start = _now().replace(minute=0, second=0, microsecond=0) - timedelta(hours=1)
    return [_hour_key(start + timedelta(hours=i)) for i in range(50)]


def _storm(terrain: float) -> dict:
    # the app's pitch scenario: a heavy storm that peaks two hours from now
    times = _synth_times()
    rain = [round(math.exp(-(((i - 3) / 1.8) ** 2)) * (10 + 26 * terrain) + 0.3, 1) for i in range(50)]
    return {"time": times, "precipitation": rain}


def _forecast() -> tuple[dict[str, dict], str]:
    if os.environ.get("NURIA_SCENARIO") == "storm":
        return {s[0]: _storm(s[4]) for s in SECTORS}, "simulacro"
    lat = ",".join(str(s[2]) for s in SECTORS)
    lon = ",".join(str(s[3]) for s in SECTORS)
    url = (f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
           "&hourly=precipitation,precipitation_probability&past_hours=1&forecast_hours=49"
           "&timezone=America%2FGuayaquil")
    arr = _get_json(url)
    arr = arr if isinstance(arr, list) else [arr]
    return {s[0]: arr[i]["hourly"] for i, s in enumerate(SECTORS)}, "en vivo"


def _tide() -> dict:
    url = ("https://marine-api.open-meteo.com/v1/marine?latitude=-2.45&longitude=-79.95"
           "&hourly=sea_level_height_msl&past_hours=1&forecast_hours=49&timezone=America%2FGuayaquil")
    try:
        return _get_json(url)["hourly"]
    except Exception:
        times = _synth_times()
        return {"time": times,
                "sea_level_height_msl": [round(0.6 + 1.2 * math.cos(2 * math.pi * (i - 10) / 12.42), 2)
                                         for i in range(50)]}


def _now_index(times: list[str]) -> int:
    key = _hour_key(_now())
    return times.index(key) if key in times else 0


def _clamp(v: float) -> float:
    return max(0.0, min(1.0, v))


def _rain_cat(mm: float):
    return next(r for r in RAIN if mm < r[0])


def _level(score: int):
    return next(l for l in LEVELS if score < l[0])


def _h_short(h: int) -> str:
    h %= 24
    return "12 am" if h == 0 else "12 pm" if h == 12 else f"{h % 12} {'am' if h < 12 else 'pm'}"


def _range(a: int) -> str:
    A, B = _h_short(a), _h_short(a + 2)
    return f"{A.split()[0]} a {B}" if A.split()[1] == B.split()[1] else f"{A} a {B}"


def _day_prefix(t: str) -> str:
    return "" if t[:10] == _hour_key(_now())[:10] else "mañana "


def _at_hour(t: str) -> str:
    h = int(t[11:13])
    if h == 0:
        return _day_prefix(t) + "a la medianoche"
    if h == 12:
        return _day_prefix(t) + "al mediodía"
    return _day_prefix(t) + ("a la " if h % 12 == 1 else "a las ") + _h_short(h)


def _part_of_day(t: str) -> str:
    h = int(t[11:13])
    p = "madrugada" if h < 5 else "mañana" if h < 12 else "tarde" if h < 19 else "noche"
    if not _day_prefix(t):
        return "esta " + p
    return "mañana temprano" if p == "mañana" else "mañana en la " + p


def _assess(sector, hourly: dict, tide: dict) -> dict:
    _, name, _, _, terrain, reports = sector
    p = [x or 0 for x in hourly["precipitation"]]
    tv = tide["sea_level_height_msl"]
    lo, hi = min(tv), max(tv)
    norm = lambda v: _clamp((v - lo) / ((hi - lo) or 1))
    i, ti = _now_index(hourly["time"]), _now_index(tide["time"])
    r3, r24 = sum(p[i:i + 3]), sum(p[i:i + 24])
    score = round(30 * _clamp(r3 / 25) + 25 * _clamp(r24 / 70) + 15 * norm(max(tv[ti:ti + 6])) + 20 * terrain
                  + 10 * _clamp(reports))
    level = _level(score)

    # best = gentlest 2-hour window to go out (rain plus high river), worst = heaviest rain, next 14 hours
    best = worst = None
    for k in range(i, min(i + 14, len(p) - 2)):
        hour, rain, peak = int(hourly["time"][k][11:13]), p[k] + p[k + 1], max(p[k], p[k + 1])
        cost = rain + 3 * norm(tv[ti + k - i] if ti + k - i < len(tv) else lo)
        if 6 <= hour <= 21 and (best is None or cost < best[1]):
            best = (k, cost, peak)
        if worst is None or rain > worst[1]:
            worst = (k, rain, peak)

    if worst is None or _rain_cat(worst[2])[1] == 0:
        headline = "No se espera lluvia en las próximas horas."
    else:
        verb = ["", "Puede caer una llovizna", "Puede llover moderado", "Puede llover fuerte",
                "Puede llover muy fuerte"][_rain_cat(worst[2])[1]]
        t = hourly["time"][worst[0]]
        headline = f"{verb} {_part_of_day(t)}, de {_range(int(t[11:13]))}."

    high = next((tide["time"][k] for k in range(max(1, ti), len(tv) - 1) if tv[k] >= tv[k - 1] and tv[k] > tv[k + 1]),
                None)
    amount = ("Casi no se espera lluvia" if r24 < 2 else "Se espera poca lluvia" if r24 < 10
              else "Se espera bastante lluvia" if r24 < 30 else "Se espera mucha lluvia")
    return {
        "neighborhood": name,
        "level": level[1],
        "level_meaning": level[2],
        "headline": headline,
        "next_24_hours": f"{amount} en las próximas 24 horas.",
        "best_time_to_go_out": _range(int(hourly["time"][best[0]][11:13])) if best else None,
        "worst_time": _range(int(hourly["time"][worst[0]][11:13])) if worst and _rain_cat(worst[2])[1] >= 2 else None,
        "river_high": _at_hour(high) if high else None,
        "terrain": ("zona baja: el agua se junta rápido" if terrain > 0.7 else
                    "a veces se junta agua" if terrain > 0.5 else "zona alta: el agua se va rápido"),
        "what_to_do": TODO[level[1]],
        "_score": score,
    }


def _fold(t: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", t.lower()) if unicodedata.category(c) != "Mn").strip()


def _find_sector(text: str):
    q = _fold(text or "")
    for alias, sid in ALIASES.items():
        if alias in q:
            return next(s for s in SECTORS if s[0] == sid)
    return next((s for s in SECTORS if s[0] in q or _fold(s[1]) in q or q in _fold(s[1])), None) if q else None


def _known() -> list[str]:
    return [s[1] for s in SECTORS]


def neighborhood_risk(args: dict, **_kw) -> str:
    sector = _find_sector(args.get("neighborhood", ""))
    if not sector:
        return json.dumps({"error": "No conozco ese barrio.", "known_neighborhoods": _known()}, ensure_ascii=False)
    try:
        hourly, source = _forecast()
        out = _assess(sector, hourly[sector[0]], _tide())
    except Exception as e:
        return json.dumps({"error": f"No pude leer el pronóstico ahora ({type(e).__name__})."}, ensure_ascii=False)
    out.pop("_score")
    out["data"] = source
    return json.dumps(out, ensure_ascii=False)


def city_overview(args: dict, **_kw) -> str:
    try:
        hourly, source = _forecast()
        tide = _tide()
        rows = sorted((_assess(s, hourly[s[0]], tide) for s in SECTORS), key=lambda r: -r["_score"])
    except Exception as e:
        return json.dumps({"error": f"No pude leer el pronóstico ahora ({type(e).__name__})."}, ensure_ascii=False)
    return json.dumps({"data": source, "river_high": rows[0]["river_high"],
                       "neighborhoods": [{"neighborhood": r["neighborhood"], "level": r["level"],
                                          "headline": r["headline"]} for r in rows]}, ensure_ascii=False)


def hourly_rain(args: dict, **_kw) -> str:
    sector = _find_sector(args.get("neighborhood", ""))
    if not sector:
        return json.dumps({"error": "No conozco ese barrio.", "known_neighborhoods": _known()}, ensure_ascii=False)
    hours = max(1, min(24, int(args.get("hours") or 12)))
    try:
        hourly, source = _forecast()
    except Exception as e:
        return json.dumps({"error": f"No pude leer el pronóstico ahora ({type(e).__name__})."}, ensure_ascii=False)
    h = hourly[sector[0]]
    i = _now_index(h["time"])
    prob = h.get("precipitation_probability") or [None] * len(h["time"])
    rows = [{"hour": _h_short(int(t[11:13])) + (" (mañana)" if _day_prefix(t) else ""),
             "rain": _rain_cat(mm or 0)[2], "chance_percent": pr}
            for t, mm, pr in list(zip(h["time"], h["precipitation"], prob))[i:i + hours]]
    return json.dumps({"neighborhood": sector[1], "data": source, "hours": rows}, ensure_ascii=False)


_NEIGHBORHOOD = {"type": "string", "description": "Barrio o lugar de Guayaquil tal como lo escribió la persona."}
_TOOLS = (
    ("nuria_neighborhood_risk", neighborhood_risk, "🌧️",
     "Flood risk for one Guayaquil neighborhood right now: level, when it rains hardest, the best time to go "
     "out, when the river is high, and what to do.",
     {"type": "object", "properties": {"neighborhood": _NEIGHBORHOOD}, "required": ["neighborhood"]}),
    ("nuria_city_overview", city_overview, "🗺️",
     "Flood risk level of every neighborhood Nuria knows, worst first. Use it when no neighborhood is given "
     "or to compare.",
     {"type": "object", "properties": {}}),
    ("nuria_hourly_rain", hourly_rain, "⏱️",
     "Rain hour by hour for one neighborhood, for questions like 'va a llover a las 5?'.",
     {"type": "object", "properties": {"neighborhood": _NEIGHBORHOOD,
                                       "hours": {"type": "integer", "description": "1 to 24, default 12."}},
      "required": ["neighborhood"]}),
)


def register(ctx) -> None:
    for name, handler, emoji, description, params in _TOOLS:
        schema = {"name": name, "description": description, "parameters": params}
        ctx.register_tool(name=name, toolset="nuria", schema=schema, handler=handler, emoji=emoji,
                          description=description)
