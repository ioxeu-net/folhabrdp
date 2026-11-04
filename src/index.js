const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

function responseJson(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...headers }
  });
}

function allowedOrigin(request, env) {
  const origin = request.headers.get("Origin");
  const configured = (env.APP_ORIGIN || "https://folhabrdp.pages.dev")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);

  return origin && configured.includes(origin) ? origin : null;
}

function corsHeaders(request, env) {
  const origin = allowedOrigin(request, env);
  const headers = {
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  };

  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function securityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
  };
}

function withHeaders(response, extra = {}) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(extra)) {
    if (value !== undefined && value !== null) headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function healthDatabase(env) {
  if (!env.DB) {
    return responseJson({
      ok: false,
      service: "folhabrdp-api",
      database: "not_configured"
    }, 503);
  }

  try {
    const result = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
    ).all();

    return responseJson({
      ok: true,
      service: "folhabrdp-api",
      database: "connected",
      table_count: (result.results || []).length
    });
  } catch {
    return responseJson({
      ok: false,
      service: "folhabrdp-api",
      database: "query_failed"
    }, 503);
  }
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    const security = securityHeaders();

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: { ...cors, ...security }
      });
    }

    const url = new URL(request.url);
    let response;

    if (request.method === "GET" && url.pathname === "/") {
      response = responseJson({
        service: "Folha DP BR API",
        status: "online",
        version: "0.1.0"
      });
    } else if (request.method === "GET" && url.pathname === "/api/health") {
      response = responseJson({
        ok: true,
        service: "folhabrdp-api",
        timestamp: new Date().toISOString()
      });
    } else if (request.method === "GET" && url.pathname === "/api/health/db") {
      response = await healthDatabase(env);
    } else {
      response = responseJson({
        ok: false,
        error: "route_not_found"
      }, 404);
    }

    return withHeaders(response, { ...cors, ...security });
  }
};
