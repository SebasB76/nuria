// Links a WhatsApp number to the `nuria` Hermes profile with an 8-character code typed on the phone, so nobody
// has to scan a QR that changes every 20 seconds. Baileys comes from Hermes' own WhatsApp bridge.
// Usage: node hermes/link-whatsapp.mjs <phone, country code and no «+»>
import { randomBytes } from 'node:crypto';
import { homedir } from 'node:os';

const modules = process.env.BAILEYS_DIR ?? `${homedir()}/.hermes/hermes-agent/scripts/whatsapp-bridge/node_modules`;
const session = process.env.NURIA_SESSION ?? `${homedir()}/.hermes/profiles/nuria/whatsapp/session`;
const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } =
  await import(`${modules}/@whiskeysockets/baileys/lib/index.js`);
const { default: pino } = await import(`${modules}/pino/pino.js`);

const phone = process.argv[2];
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTVWXYZ';
// one code for the whole run: a reconnect registers the same code, so the one already shown stays valid
const code = Array.from(randomBytes(8), (b) => ALPHABET[b % 32]).join('');
const { version } = await fetchLatestBaileysVersion();
let shown = false;

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(session);
  if (state.creds.registered) {
    console.log('El número ya está vinculado a Nuria.');
    process.exit(0);
  }
  if (!phone) {
    console.error('Pasa el número: 593…, sin «+» ni el 0 inicial.');
    process.exit(2);
  }
  const sock = makeWASocket({ version, auth: state, logger: pino({ level: 'silent' }),
                              browser: Browsers.ubuntu('Chrome'), printQRInTerminal: false });
  let asked = false;
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr && !asked) {
      asked = true;
      await sock.requestPairingCode(phone, code);
      if (!shown) {
        shown = true;
        console.log(`Código: ${code.slice(0, 4)}-${code.slice(4)}`);
        console.log('En el celular: WhatsApp → Dispositivos vinculados → Vincular un dispositivo →');
        console.log('«Vincular con el número de teléfono», y escribe el código.');
      }
    }
    if (connection === 'open') {
      console.log('Vinculado.');
      setTimeout(() => process.exit(0), 2000); // Baileys flushes the session files
    }
    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason === DisconnectReason.loggedOut) {
        console.error('WhatsApp cerró la sesión: borra la carpeta de la sesión y vuelve a vincular.');
        process.exit(1);
      }
      setTimeout(start, reason === DisconnectReason.restartRequired ? 1000 : 3000);
    }
  });
}
start();
