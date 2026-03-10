// Vercel Serverless Function: /api/n8n/dashboard-contador

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
    const curso = req.query.curso;
    const n8nUrl = `${N8N_BASE_URL}/dashboard-contador?curso=${curso}`;
    console.log('Proxying to:', n8nUrl);

    const response = await fetch(n8nUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    console.log('Response status:', response.status);

    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
