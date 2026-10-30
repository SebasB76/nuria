"""Nuria's tools on WhatsApp: live rain and flood risk per Guayaquil neighborhood.

The model lives in skills/guayaquil-flood-safety/scripts/flood_risk.py (linked here), so the app, WhatsApp and the
skill give the same answer. These are the only tools the WhatsApp agent gets: strangers write to it, so no terminal,
files or browser.
"""
from .flood_risk import city_overview, hourly_rain, neighborhood_risk

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
