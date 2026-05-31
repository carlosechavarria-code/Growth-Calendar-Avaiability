import { getAccessToken, freeBusy } from "../lib/google.js";

const CALS = {
  Rafa: "rafael@usehandle.ai",
  Mirelle: "mirelle.solca@usehandle.ai",
  Ramiro: "ramiro.castro@usehandle.ai",
};
const TZ = "America/Mexico_City";

function addDaysISO(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n, 12));
  return dt.toISOString().slice(0, 10);
}

// Convierte un instante ISO a {date:"YYYY-MM-DD", hm:"HH:MM"} en hora de CDMX.
function localParts(iso) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  const p = Object.fromEntries(
    fmt.formatToParts(new Date(iso)).map((x) => [x.type, x.value])
  );
  return { date: `${p.year}-${p.month}-${p.day}`, hm: `${p.hour}:${p.minute}` };
}

// Un bloque ocupado -> uno o varios triples [fecha, inicio, fin] partidos por día.
function busyToTriples(startISO, endISO) {
  const s = localParts(startISO), e = localParts(endISO);
  if (s.date === e.date) return [[s.date, s.hm, e.hm]];
  const out = [[s.date, s.hm, "24:00"]];
  let cur = addDaysISO(s.date, 1);
  while (cur < e.date) { out.push([cur, "00:00", "24:00"]); cur = addDaysISO(cur, 1); }
  out.push([e.date, "00:00", e.hm]);
  return out;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  try {
    const monday = String(req.query.monday || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(monday)) {
      res.status(400).json({ error: "Falta ?monday=YYYY-MM-DD" });
      return;
    }
    const timeMin = `${monday}T00:00:00-06:00`;
    const timeMax = `${addDaysISO(monday, 5)}T00:00:00-06:00`; // Lun..Vie

    const token = await getAccessToken();
    const fb = await freeBusy(token, Object.values(CALS), timeMin, timeMax, TZ);

    const out = {};
    for (const [name, email] of Object.entries(CALS)) {
      const cal = fb.calendars?.[email];
      if (cal?.errors?.length) { out[name] = []; out[name + "_error"] = cal.errors; continue; }
      const busy = cal?.busy || [];
      out[name] = busy.flatMap((b) => busyToTriples(b.start, b.end));
    }
    // cache de 60s en el CDN de Vercel para no pegarle a Google en cada clic
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    res.status(200).json(out);
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
}
