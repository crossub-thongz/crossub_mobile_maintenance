import { type NextRequest, NextResponse } from 'next/server';

import { readUpstreamSetCookies, rewriteBffSetCookie } from '@/lib/bff-cookie';

const apiBase = (): string =>
  process.env.API_INTERNAL_URL ?? 'http://localhost:3001';

const forwardHeaders = (req: NextRequest): Headers => {
  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('connection');
  return headers;
};

const buildUpstreamUrl = (req: NextRequest, path: string[]): string => {
  const suffix = path.length > 0 ? path.join('/') : '';
  return `${apiBase()}/api/${suffix}${req.nextUrl.search}`;
};

const proxy = async (
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> => {
  const { path } = await context.params;

  let upstream: Response;
  try {
    upstream = await fetch(buildUpstreamUrl(req, path), {
      method: req.method,
      headers: forwardHeaders(req),
      body:
        req.method === 'GET' || req.method === 'HEAD'
          ? undefined
          : await req.arrayBuffer(),
      redirect: 'manual',
    });
  } catch {
    return NextResponse.json(
      { message: 'API unavailable. Check API_INTERNAL_URL or start crossub_web.' },
      { status: 503 },
    );
  }

  const responseBody =
    upstream.status === 204 || req.method === 'HEAD'
      ? null
      : await upstream.arrayBuffer();

  const response = new NextResponse(responseBody, {
    status: upstream.status,
    statusText: upstream.statusText,
  });

  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === 'set-cookie') return;
    if (lower === 'transfer-encoding') return;
    // fetch() decompresses gzip/br bodies; forwarding content-encoding breaks browsers.
    if (lower === 'content-encoding') return;
    if (lower === 'content-length') return;
    response.headers.set(key, value);
  });

  const requestHost = req.headers.get('host') ?? '';
  for (const cookie of readUpstreamSetCookies(upstream.headers)) {
    response.headers.append('set-cookie', rewriteBffSetCookie(cookie, requestHost));
  }

  return response;
};

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
