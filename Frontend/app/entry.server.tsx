import { randomBytes } from "node:crypto";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import { ServerRouter } from "react-router";
import type { EntryContext } from "react-router";

export const streamTimeout = 5_000;

function setSecurityHeaders(headers: Headers) {
  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (import.meta.env.PROD) headers.set("Strict-Transport-Security", "max-age=31536000");
}

export function handleDataRequest(response: Response) {
  setSecurityHeaders(response.headers);
  return response;
}

export default async function handleRequest(
  request: Request,
  status: number,
  headers: Headers,
  context: EntryContext,
) {
  setSecurityHeaders(headers);
  headers.set("Content-Type", "text/html; charset=utf-8");
  const nonce = randomBytes(18).toString("base64");
  if (import.meta.env.PROD) {
    headers.set("Content-Security-Policy", [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}'`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
    ].join("; "));
  }

  if (request.method === "HEAD") return new Response(null, { status, headers });

  let shellRendered = false;
  const body = await renderToReadableStream(
    <ServerRouter context={context} url={request.url} nonce={nonce} />,
    {
      nonce,
      signal: AbortSignal.timeout(streamTimeout + 1000),
      onError(error: unknown) {
        status = 500;
        if (shellRendered) console.error(error);
      },
    },
  );
  shellRendered = true;
  const userAgent = request.headers.get("user-agent");
  if ((userAgent && isbot(userAgent)) || context.isSpaMode) await body.allReady;
  return new Response(body, { status, headers });
}
