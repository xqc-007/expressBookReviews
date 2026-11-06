const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../index');
let server, base;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));
async function call(path, method = 'GET', body, cookie) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers.Cookie = cookie;
  const response = await fetch(base + path, { method, headers, body: body && JSON.stringify(body) });
  return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
}
test('public catalogue, filters, reviews and missing ISBN', async () => {
  assert.equal(Object.keys((await call('/')).data).length, 10);
  assert.equal((await call('/isbn/1')).data.title, 'Things Fall Apart');
  assert.equal(Object.keys((await call('/author/Unknown')).data).length, 4);
  assert.equal((await call('/title/Things%20Fall%20Apart')).data['1'].author, 'Chinua Achebe');
  assert.deepEqual((await call('/review/1')).data, {});
  assert.equal((await call('/isbn/999')).status, 404);
  assert.equal((await call('/isbn/__proto__')).status, 404);
});
test('registration validation, concurrent duplicates and failed login', async () => {
  assert.equal((await call('/register', 'POST', {})).status, 400);
  const pair = await Promise.all([1,2].map(() => call('/register','POST',{username:'race',password:'demo'})));
  assert.deepEqual(pair.map(x => x.status).sort(), [201,409]);
  assert.equal((await call('/customer/login','POST',{username:'race',password:'wrong'})).status,401);
});
test('session authentication and ownership isolation across review CRUD', async () => {
  assert.equal((await call('/customer/auth/review/1','PUT',{review:'No session'})).status,401);
  const sessions = [];
  for (const username of ['alice','bob']) {
    assert.equal((await call('/register','POST',{username,password:'demo'})).status,201);
    const login = await call('/customer/login','POST',{username,password:'demo'});
    assert.equal(login.status,200);
    assert.ok(login.cookie);
    sessions.push(login.cookie);
  }
  const [alice,bob] = sessions;
  assert.equal((await call('/customer/auth/review/1','PUT',{review:''},alice)).status,400);
  await call('/customer/auth/review/1','PUT',{review:'Alice review'},alice);
  await call('/customer/auth/review/1','PUT',{review:'Bob review'},bob);
  const updated = await call('/customer/auth/review/1','PUT',{review:'Alice updated',username:'bob'},alice);
  assert.deepEqual(updated.data.reviews,{alice:'Alice updated',bob:'Bob review'});
  const deleted = await call('/customer/auth/review/1','DELETE',undefined,alice);
  assert.deepEqual(deleted.data.reviews,{bob:'Bob review'});
  assert.equal((await call('/customer/auth/review/1','DELETE',undefined,alice)).status,404);
});
