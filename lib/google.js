// Helpers de Google OAuth + Calendar (sin dependencias; usa fetch nativo de Node 18+).

export async function getAccessToken() {
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    grant_type: "refresh_token",
  });
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await r.text();
  if (!r.ok) throw new Error("token " + r.status + ": " + text);
  return JSON.parse(text).access_token;
}

export async function freeBusy(token, ids, timeMin, timeMax, tz) {
  const r = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      timeZone: tz,
      items: ids.map((id) => ({ id })),
    }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error("freeBusy " + r.status + ": " + text);
  return JSON.parse(text);
}
