// `pnpm mock`: local stand-in for the Nightlight API (PLAN.md §7), no AWS needed.
// The TV reaches it via reverse port forwarding (see `pnpm tv:sim`), so the app uses
// http://localhost:<port>/v1 on both the simulator and a physical device.
import {createServer} from 'node:http';
import {MOCK_PORT} from './lib/util.ts';

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  console.log(`${new Date().toISOString()} ${req.method} ${url.pathname}${url.search}`);

  const send = (status: number, body: unknown) => {
    res.writeHead(status, {'content-type': 'application/json'});
    res.end(JSON.stringify(body));
  };

  if (req.method === 'GET' && url.pathname === '/v1/health') {
    send(200, {ok: true, service: 'nightlight-mock'});
    return;
  }
  send(404, {error: 'not_found', path: url.pathname});
});

server.listen(MOCK_PORT, () => {
  console.log(`Nightlight mock API on http://localhost:${MOCK_PORT}/v1`);
});
