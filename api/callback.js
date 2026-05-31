// Recibe el código de Google, lo cambia por tokens y te muestra el refresh_token
// para que lo pegues como variable de entorno en Vercel.
export default async function handler(req, res) {
  const code = req.query.code;
  if (!code) {
    res.status(400).send("Falta ?code en la URL");
    return;
  }
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    grant_type: "authorization_code",
  });
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await r.json();
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  if (!data.refresh_token) {
    res.status(200).send(
      `<pre>No llegó refresh_token. Revoca el acceso en ` +
      `https://myaccount.google.com/permissions y vuelve a /api/auth.\n\n` +
      `Respuesta:\n${JSON.stringify(data, null, 2)}</pre>`
    );
    return;
  }
  res.status(200).send(
    `<h2>¡Listo!</h2>
     <p>Copia este valor y pégalo en Vercel como la variable de entorno
     <code>GOOGLE_REFRESH_TOKEN</code>, luego vuelve a desplegar:</p>
     <pre style="white-space:pre-wrap;word-break:break-all;background:#eee;padding:12px;border-radius:8px">${data.refresh_token}</pre>
     <p>Después de guardarla, esta ruta ya no es necesaria.</p>`
  );
}
