// Vercel Serverless Function: /api/n8n/toggle-estudiante

const N8N_BASE_URL = 'https://micro-bits-n8n.aejhww.easypanel.host/webhook';

export default async function handler(req, res) {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const n8nUrl = `${N8N_BASE_URL}/toggle-estudiante`;
    console.log('Proxying POST to:', n8nUrl);
    console.log('Body:', req.body);

    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    console.log('Response status:', response.status);

    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
