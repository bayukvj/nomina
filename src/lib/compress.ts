import { brotliCompress, gzip } from 'node:zlib';

const COMPRESSIBLE = [
  'text/html',
  'text/css',
  'text/plain',
  'text/xml',
  'application/javascript',
  'application/json',
  'application/xml',
  'image/svg+xml',
  'application/rss+xml',
  'application/ld+json',
];

/** whether the response is worth compressing */
export function shouldCompress(request: Request, response: Response): boolean {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false;
  if (response.status >= 300 && response.status < 400) return false;

  const encoding = (request.headers.get('accept-encoding') ?? '').toLowerCase();
  if (!/gzip|br/.test(encoding)) return false;

  const type = (response.headers.get('content-type') ?? '').toLowerCase();
  if (!COMPRESSIBLE.some((t) => type.includes(t))) return false;

  // already compressed?
  if (response.headers.get('content-encoding')) return false;

  const length = Number(response.headers.get('content-length') ?? '0');
  if (length && length < 1024) return false;

  return true;
}

/** compress the response body with gzip or brotli */
export async function compressResponse(response: Response, request: Request): Promise<Response> {
  const encoding = (request.headers.get('accept-encoding') ?? '').toLowerCase();
  const useBrotli = /\bbr\b/.test(encoding);

  let body: Buffer;
  try {
    body = Buffer.from(await response.arrayBuffer());
  } catch {
    return response;
  }

  if (body.length < 512) return response;

  const compressed = useBrotli
    ? await new Promise<Buffer>((resolve, reject) => {
        brotliCompress(body, { params: { [1]: 6, [2]: 4 } }, (err, result) =>
          err ? reject(err) : resolve(result),
        );
      })
    : await new Promise<Buffer>((resolve, reject) => {
        gzip(body, { level: 6 }, (err, result) =>
          err ? reject(err) : resolve(result),
        );
      });

  // not worth it if the compressed size is bigger
  if (compressed.length >= body.length) return response;

  const headers = new Headers(response.headers);
  headers.set('Content-Encoding', useBrotli ? 'br' : 'gzip');
  headers.set('Content-Length', String(compressed.length));
  headers.set('Vary', 'Accept-Encoding');
  headers.delete('ETag');

  return new Response(new Uint8Array(compressed), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
