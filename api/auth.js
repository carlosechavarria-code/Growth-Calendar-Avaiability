// Abre esta ruta UNA vez en el navegador para autorizar tu cuenta.
export default function handler(req, res) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    access_type: "offline",   // necesario para recibir refresh_token
    prompt: "consent",        // fuerza a que SIEMPRE devuelva refresh_token
  });
  res.writeHead(302, {
    Location: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
  });
  res.end();
}
