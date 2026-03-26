exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE  = 'appD1ZqrwZXTza0KR';
  const TABLE = 'tbl5xdM5VGqrieG4a';

  try {
    const body = JSON.parse(event.body);
    const res = await fetch(
      `https://api.airtable.com/v0/${BASE}/${TABLE}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) {
      const err = await res.json();
      return { statusCode: res.status, body: JSON.stringify(err) };
    }
    const data = await res.json();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
