const CANONICAL_HOST = 'transparency.quietlyworking.org';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const host = url.hostname;

  // Allow preview deployments and local dev
  if (host.endsWith('.pages.dev') || host === 'localhost') {
    return context.next();
  }

  // Redirect non-canonical hosts to main domain
  if (host !== CANONICAL_HOST) {
    return Response.redirect(
      `https://${CANONICAL_HOST}${url.pathname}${url.search}`,
      301
    );
  }

  return context.next();
}
