exports.handler = async function() {
  const TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE  = 'appD1ZqrwZXTza0KR';
  const TABLE = 'tbl5xdM5VGqrieG4a';

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${BASE}/${TABLE}`,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    if (!res.ok) {
      return { statusCode: res.status, body: JSON.stringify({ error: 'Airtable error' }) };
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
