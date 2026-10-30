# Nuria


A phone app that helps people in Guayaquil get through the El Niño rainy season. Tamy, a raindrop
assistant ("tamya" is rain in Kichwa), tells you if your street may flood today, when to go out,
which way to drive to avoid flooded streets, and whether your family is OK.

Hackathon prototype. Not an official source: follow INAMHI and SNGR, and call 911 in an emergency.

## What it does

- **Hoy**: flood risk for your home, work and school barrios as a drop that fills up
  (Tranquilo, Ojo, Cuidado, Peligro), hour-by-hour rain, best and worst time to go out, and the
  Guayas river tide (a high river makes street water drain slower).
- **Mapa**: live GOES-19 satellite clouds over the city, every barrio with its risk drop, and
  neighbor reports.
- **Tamy**: chat backed by DeepSeek with tool calling over the app's own data (risk, rain, tide,
  safe route, family, reports, season). Without a key or connection it falls back to scripted
  answers, so a demo never goes silent. Tamy can read answers aloud.
- **Ruta**: driving routes from OSRM scored by rain on the way, reported water and low ground,
  with a detour around flooded points and the best hour to leave.
- **Familia**: where each family member is, whether they confirmed they are OK, and an SOS flow.
- **Reportar**, **modo Peligro**, **Así va el invierno** and a pitch scenario with a simulated storm.

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

## Tests

`npm run e2e` exports the web build and runs the Playwright suite against it with the installed
Chrome. The web build shares every screen and all the logic with the phone app. The suite uses the
live services, so it needs internet.

`prototype/` keeps the first HTML prototypes: the live map page and the screen flow.
