import { STATUS } from '@/data/family';
import { fold, sectorById } from '@/data/places';
import { bestWorstText, headline, nextHigh } from '@/data/risk';
import { routeReasons } from '@/data/route';
import { atHour, hoursFromNowKey } from '@/data/time';
import { NuriaReply } from './nuria';
import { findSector, runTool, NuriaEnv } from './tools';

const lower = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

// scripted answers for when there is no DeepSeek key or no connection, so the demo never goes silent
export async function offlineNuria(text: string, env: NuriaEnv): Promise<NuriaReply> {
  const t = fold(text), { app, family } = env;
  const s = findSector(SECTOR_HINT(t) ? text : undefined, env), h = app.hourly[s.id], l = app.risk[s.id].level;

  if (/ruta|camino|por donde|llegar|irme|ir a/.test(t)) {
    const toName = /malecon/.test(t) ? 'malecón' : /mall/.test(t) ? 'mall del sol' : /aeropuerto/.test(t) ? 'aeropuerto' : /terminal/.test(t) ? 'terminal' : /espol/.test(t) ? 'espol' : /papa/.test(t) ? 'papá' : s.id === 'centro' ? 'mall del sol' : 'malecón';
    const r = await runTool('plan_safe_route', { to: toName, depart: /mejor hora|cuando/.test(t) ? 'best' : 'now' }, env);
    if (!r.card || r.card.type !== 'route') return { text: 'No pude calcular la ruta ahora. Prueba en un momento en la pestaña **Ruta**.', cards: [] };
    const b = r.card.plan.list[0];
    return {
      text: `Para ir a **${r.card.plan.to.name}**, te recomiendo ir ${b.r.name ? 'por **' + b.r.name + '**' : 'por la ruta marcada'}: unos ${Math.round(b.r.dur / 60)} minutos sin contar el tráfico.\n\n${routeReasons(b).map(([i, x]) => `- ${i} ${x}`).join('\n')}`,
      cards: [r.card],
    };
  }
  if (/salg|salir|hora|moverme|regres/.test(t)) {
    const bw = bestWorstText(h, app.tide), ht = nextHigh(app.tide);
    return {
      text: [
        bw.best ? `Sal de **${bw.best}**. Es el momento más tranquilo en ${s.name}.` : 'Hoy no veo un buen momento. Si puedes, quédate donde estás.',
        bw.worst ? `Evita salir de **${bw.worst}**: es lo más fuerte de la lluvia.` : '',
        ht ? `🌊 El río estará alto ${atHour(ht.t)}. Si llueve cerca de esa hora, el agua se queda más tiempo en la calle.` : '',
      ].filter(Boolean).join('\n\n'),
      cards: [{ type: 'rain', sectorId: s.id }],
    };
  }
  if (/casa|entra|entro|adentro|hogar/.test(t)) {
    const r = await runTool('show_home_flood_steps', {}, env);
    return { text: 'Si entra agua a tu casa, haz esto en orden. Después, toma fotos de los daños antes de limpiar: te sirven para pedir ayuda.', cards: r.card ? [r.card] : [] };
  }
  if (/mochila|kit|preparar|emergencia/.test(t)) return { text: 'Tu mochila de emergencia. Marca lo que ya tienes:', cards: [{ type: 'kit' }] };
  if (/report|inundad|alcantarill|deslave|calle|agua hasta/.test(t)) {
    const kind = /cerrad/.test(t) ? 'closed' : /alcantarill/.test(t) ? 'drain' : /deslave|tierra/.test(t) ? 'landslide' : 'water';
    const depth = /cintura/.test(t) ? 'Cintura' : /rodilla/.test(t) ? 'Rodilla' : /tobillo/.test(t) ? 'Tobillo' : undefined;
    const r = await runTool('report_street_problem', { kind, depth, neighborhood: s.name }, env);
    return { text: 'Listo ✅. Tu reporte ya está en el mapa. Lo comparo con otros reportes cerca antes de avisar al barrio. Gracias por ayudar a tus vecinos.', cards: r.card ? [r.card] : [] };
  }
  if (/nino|temporada|fenomeno|invierno/.test(t)) {
    return { text: 'El Niño está en su fase más fuerte. Ya llovió **2 de cada 3 partes** de un invierno normal, y se esperan lluvias fuertes **hasta abril**. Te propongo preparar tu casa esta semana: limpiar el canal del techo y armar la mochila.', cards: [{ type: 'season' }] };
  }
  if (/donde esta|donde estan|ubicacion|como esta mi|como estan|mi familia/.test(t) && !/avis|estoy bien/.test(t)) {
    const lines = family.members.filter((m) => !m.me).map((m) => {
      const z = family.zoneOf(m);
      return `- **${m.rel}**: ${STATUS[m.status].text.toLowerCase()}. ${m.moving ? 'Va en camino; ahora está en' : m.note ? m.note + ', en' : 'Está en'} ${sectorById(z.sectorId).name}${z.wet ? '. ⚠️ Está cerca de agua reportada' : ''}.`;
    });
    const pending = family.members.filter((m) => !m.me && m.status !== 'ok');
    return { text: `Así está tu familia ahora:\n\n${lines.join('\n')}${pending.length ? `\n\n${pending.map((x) => x.rel).join(' y ')} no ha${pending.length > 1 ? 'n' : ''} confirmado. Puedo preguntarle si está bien.` : ''}`, cards: [{ type: 'family' }] };
  }
  if (/familia|mama|papa|avis|estoy bien/.test(t)) {
    const msg = `Estoy bien 🙏. Estoy en ${s.name}. Aquí estamos en «${l.name}». Les escribo de nuevo ${atHour(hoursFromNowKey(2))}.`;
    return { text: 'Te preparé este mensaje para tu grupo «Familia». Revísalo antes de enviarlo:', cards: [{ type: 'whatsapp', text: msg }] };
  }
  if (/rio|marea/.test(t)) {
    const r = await runTool('get_river_tide', {}, env);
    return { text: 'Así va el río Guayas. Cuando está alto, el agua de la calle tarda más en irse.', cards: r.card ? [r.card] : [] };
  }
  if (/llov|lluv|aguacero|tormenta|clima|tiempo|riesgo|peligro|hoy/.test(t) || SECTOR_HINT(t)) {
    return { text: `En **${s.name}**: ${lower(headline(h, app.tide))}\n\nTu barrio está en **${l.name}**: ${lower(l.desc)}`, cards: [{ type: 'risk', sectorId: s.id }] };
  }
  return {
    text: 'Sin conexión con mi cerebro de IA, respondo sobre la lluvia, a qué hora salir, la ruta segura, qué hacer si entra agua, la mochila, reportes, El Niño y tu familia. Prueba con uno de los botones de abajo.',
    cards: [],
  };
}

const SECTOR_HINT = (t: string) => /alborada|sauces|samanes|urdesa|centro|trinitaria|guasmo|bastion|mapasingue|costa|samborondon|duran/.test(t);
