# Nuria

A phone app that helps people in Guayaquil get through the El Niño rainy season. Nuria, an assistant
drawn as a bird that watches the rain, tells you if your street may flood today, when to go out, which way to drive to avoid
flooded streets, and whether your family is OK.

Hackathon prototype, MIT license. Not an official source: follow INAMHI and SNGR, and call 911 in an emergency.

All the AI in Nuria is open: an open-weight model, an open-source agent harness and an agent skill that any agent can
install. See [Open-source AI](#open-source-ai).

## What it does

- **Hoy**: flood risk for your home, work and school barrios as a drop that fills up
  (Tranquilo, Ojo, Cuidado, Peligro), hour-by-hour rain, best and worst time to go out, and the
  Guayas river tide (a high river makes street water drain slower).
- **Mapa**: live GOES-19 satellite clouds over the city, every barrio with its risk drop, and
  neighbor reports.
- **Nuria**: chat backed by DeepSeek V4 Flash (open weights) with tool calling over the app's own data (risk, rain, tide,
  safe route, family, reports, season). Without a key or connection it falls back to scripted
  answers, so a demo never goes silent. Nuria can read answers aloud.
- **Ruta**: driving routes from OSRM scored by rain on the way, reported water and low ground,
  with a detour around flooded points and the best hour to leave.
- **Familia**: where each family member is, whether they confirmed they are OK, and an SOS flow.
- **Reportar**, **modo Peligro**, **Así va el invierno** and a pitch scenario with a simulated storm.

## Open-source AI

| Part | What runs it |
| --- | --- |
| The model | [DeepSeek V4 Flash](https://huggingface.co/deepseek-ai), open weights under the MIT license. The app chat and the WhatsApp bot both use it. |
| The app agent | Our own tool-calling loop (`src/ai/nuria.ts`) over the app's data: risk, rain, river, safe route, family, reports. |
| The WhatsApp agent | [Hermes Agent](https://github.com/NousResearch/hermes-agent) (MIT), adapted with our `nuria-data` plugin and a locked tool list. |
| The agent skill | `skills/guayaquil-flood-safety`: the flood-risk model and the safety guide in the open [Agent Skills](https://agentskills.io) format. |

The app, the WhatsApp bot and the skill run the same risk model, so they give the same answer.

To run the app chat on your own hardware, point it at any OpenAI-compatible server with tool calling (Ollama, vLLM,
llama.cpp) in `.env`: `EXPO_PUBLIC_AI_BASE_URL=http://<computer>:11434/v1` and `EXPO_PUBLIC_DEEPSEEK_MODEL=<model>`.
Put any text as the key if the server does not check it. We tested the app with DeepSeek's API only.

## Run it on your phone

1. Install **Expo Go** from the Play Store or the App Store.
2. Run `npm install`.
3. Optional: run `cp .env.example .env` and put a DeepSeek key in `EXPO_PUBLIC_DEEPSEEK_API_KEY`.
   You can also paste the key in the app, in Ajustes.
4. Run `npx expo start`.
5. Scan the QR code with the camera (iPhone) or with Expo Go (Android).
   If the phone and the computer are on different networks, run `npx expo start --tunnel`.

For the pitch, open Ajustes and pick **Aguacero simulado**: the forecast becomes a storm that peaks
in two hours, so the app shows Cuidado and Peligro whatever today's sky is. "Simular aviso" sends a
local notification that opens the danger screen.

## The DeepSeek key

The key is bundled into the app (`EXPO_PUBLIC_*`) or stored with SecureStore on the phone, so anyone
with the app could extract it. Use a key made only for the demo, with a small prepaid balance, and
revoke it after the hackathon. Never commit `.env`.

## Data

| What | Source | Live? |
| --- | --- | --- |
| Hourly rain per barrio | Open-Meteo forecast | yes |
| River tide | Open-Meteo marine model | yes |
| Clouds | NOAA GOES-19 via NASA GIBS | yes |
| Streets and routes | OpenStreetMap, OSRM public demo server | yes |
| Barrio terrain, neighbor reports, family | sample data | no |

Open-Meteo and the OSRM demo server are for non-commercial use. A product would need its own
routing server and a commercial weather plan.

## Limits of Expo Go

Expo Go has no remote push notifications and no background location. Alerts here are local
notifications, and the family is simulated. A development build (`eas build`) removes both limits.

## Nuria on WhatsApp

`hermes/` turns Nuria into a WhatsApp bot on [Hermes Agent](https://github.com/NousResearch/hermes-agent), with DeepSeek V4 Flash and the same rain and flood-risk model as the app.

1. Run `hermes/setup.sh`. It creates or updates the Hermes profile `nuria`: personality (`SOUL.md` plus the skill's safety guide), data tools (`plugins/nuria-data`, which runs the skill's risk model) and settings. It takes the DeepSeek key from `.env`.
2. Link the number: `node hermes/link-whatsapp.mjs 593…` prints an 8-character code. On the phone, open WhatsApp → Linked devices → Link with phone number, and type it.
3. Set `WHATSAPP_ENABLED=true` in `~/.hermes/profiles/nuria/.env` and run `hermes gateway restart`.
4. For a pitch with the app's "Aguacero simulado", set `NURIA_SCENARIO=storm` in the same `.env` and restart the gateway.

Anyone can write to the number, so the WhatsApp agent only gets the `nuria` toolset: no terminal, files or browser.

## The agent skill

`skills/guayaquil-flood-safety` teaches any agent with skills (Claude Code, Codex, Hermes Agent, OpenCode and others)
to answer about rain and floods in Guayaquil, with live data and the same safety rules as Nuria.

1. Copy the folder to your agent's skills folder, for example `~/.claude/skills/` or `~/.hermes/skills/`.
2. Ask the agent: "¿Se va a inundar Urdesa hoy?"

The agent runs the risk model, a Python script with no dependencies. You can run it yourself:

```bash
python3 skills/guayaquil-flood-safety/scripts/flood_risk.py risk Urdesa
python3 skills/guayaquil-flood-safety/scripts/flood_risk.py hourly Alborada 6
python3 skills/guayaquil-flood-safety/scripts/flood_risk.py overview
```

## Tests

`npm run e2e` exports the web build and runs the Playwright suite against it with the installed
Chrome. The web build shares every screen and all the logic with the phone app. The suite uses the
live services, so it needs internet.

`prototype/` keeps the first HTML prototypes: the live map page and the screen flow.

## License

MIT. See `LICENSE`.
