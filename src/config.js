// ============================================================
// config.js — Configuración global SuggyApp
// Suggy = bot WhatsApp alojado 24/7 en VPS DigitalOcean 46.101.96.230
// ============================================================

export const VPS_URL      = 'https://cure-everything-studios-ana.trycloudflare.com';
// NOTA: URL cambia al reiniciar el VPS. Obtener nueva URL con:
//   pm2 logs cloudflare-tunnel --lines 10  (en VPS)

export const APP_PASSWORD = 'cabel1n3'; // contraseña universal para todos los clientes

export const APP_CONFIG = {
  name: 'SuggyApp',
  version: '1.0.0',
  colors: {
    primary:     '#25D366',
    primaryDark: '#128C7E',
    background:  '#0D1117',
    surface:     '#161B22',
    bubbleOut:   '#25D366',
    bubbleIn:    '#1E2D24',
    text:        '#FFFFFF',
    textMuted:   '#8B949E',
    border:      '#30363D',
    error:       '#FF4444',
    warning:     '#F0A500',
  },
  storage: {
    token:    'suggy_token',
    username: 'suggy_username',
    clientData: 'suggy_client_data',
  },
  // Carpeta en el móvil — rolling 7 días
  mobileFolder: 'Suggy',
  retentionDays: 7,
};
