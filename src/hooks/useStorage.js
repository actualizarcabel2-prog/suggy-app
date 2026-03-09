// ============================================================
// useStorage.js — Gestión carpeta /Downloads/Suggy/ en el móvil
// Rolling 7 días: día 8 borra el día 1 automáticamente
// ============================================================

import * as FileSystem from 'expo-file-system';
import { APP_CONFIG } from '../config';

const { retentionDays, mobileFolder } = APP_CONFIG;

// Ruta base: /storage/emulated/0/Downloads/Suggy/
// En Expo usamos FileSystem.documentDirectory como base accesible
const SUGGY_DIR      = FileSystem.documentDirectory + mobileFolder + '/';
const CONV_DIR       = SUGGY_DIR + 'conversaciones/';
const MEDIA_DIR      = SUGGY_DIR + 'media/';

// Inicializar carpetas al arrancar la app
export async function initSuggyFolder() {
  try {
    await FileSystem.makeDirectoryAsync(CONV_DIR,  { intermediates: true });
    await FileSystem.makeDirectoryAsync(MEDIA_DIR, { intermediates: true });
    // Crear .nomedia para evitar que aparezca en la galería
    const nomedia = SUGGY_DIR + '.nomedia';
    const exists = await FileSystem.getInfoAsync(nomedia);
    if (!exists.exists) await FileSystem.writeAsStringAsync(nomedia, '');
    await purgeOldDays();
    return true;
  } catch (e) {
    console.warn('[Storage] initSuggyFolder error:', e.message);
    return false;
  }
}

// Guardar mensaje del día actual
export async function saveMessage(msg) {
  try {
    const today   = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dayFile = CONV_DIR + today + '.json';
    let   messages = [];
    const info = await FileSystem.getInfoAsync(dayFile);
    if (info.exists) {
      const raw = await FileSystem.readAsStringAsync(dayFile);
      messages  = JSON.parse(raw);
    }
    messages.push({
      id:        msg.id || Date.now().toString(),
      text:      msg.text || '',
      fromMe:    msg.fromMe ?? false,
      timestamp: msg.timestamp || new Date().toISOString(),
    });
    await FileSystem.writeAsStringAsync(dayFile, JSON.stringify(messages));
  } catch (e) {
    console.warn('[Storage] saveMessage error:', e.message);
  }
}

// Cargar mensajes de los últimos N días
export async function loadRecentMessages(days = 7) {
  try {
    const info = await FileSystem.getInfoAsync(CONV_DIR);
    if (!info.exists) return [];
    const files = await FileSystem.readDirectoryAsync(CONV_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json')).sort().slice(-days);
    const all = [];
    for (const f of jsonFiles) {
      const raw  = await FileSystem.readAsStringAsync(CONV_DIR + f);
      const msgs = JSON.parse(raw);
      all.push(...msgs);
    }
    return all;
  } catch {
    return [];
  }
}

// Guardar archivo media (audio, imagen, vídeo) — devuelve ruta local
export async function saveMediaFile(uri, tipo = 'img') {
  try {
    const ext  = uri.split('.').pop()?.split('?')[0] || tipo;
    const name = Date.now() + '.' + ext;
    const dest = MEDIA_DIR + name;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch {
    return uri;
  }
}

// Purgar días con más de 7 días de antigüedad (rolling 7 días)
export async function purgeOldDays() {
  try {
    const info = await FileSystem.getInfoAsync(CONV_DIR);
    if (!info.exists) return;
    const files   = await FileSystem.readDirectoryAsync(CONV_DIR);
    const cutoff  = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    const cutStr  = cutoff.toISOString().split('T')[0];
    for (const f of files) {
      const date = f.replace('.json', '');
      if (date < cutStr) {
        await FileSystem.deleteAsync(CONV_DIR + f, { idempotent: true });
        console.log('[Storage] Purged old day:', date);
      }
    }
    // Purgar media de más de 7 días
    const mediaFiles = await FileSystem.readDirectoryAsync(MEDIA_DIR);
    for (const f of mediaFiles) {
      const fInfo = await FileSystem.getInfoAsync(MEDIA_DIR + f);
      if (fInfo.exists && fInfo.modificationTime) {
        const age = (Date.now() / 1000) - fInfo.modificationTime;
        if (age > retentionDays * 86400) {
          await FileSystem.deleteAsync(MEDIA_DIR + f, { idempotent: true });
        }
      }
    }
  } catch (e) {
    console.warn('[Storage] purgeOldDays error:', e.message);
  }
}

export { SUGGY_DIR, CONV_DIR, MEDIA_DIR };
