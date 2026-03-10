// Serverless Function para Vercel - Proxy a N8N
// Este archivo permite usar variables de entorno en Vercel

export default async function handler(req, res) {
  // Configuración CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Obtener la URL base de N8N desde variables de entorno
    const n8nBaseUrl = process.env.N8N_WEBHOOK_URL || 'https://micro-bits-n8n.aejhww.easypanel.host/webhook';

    // Obtener el endpoint de los query params
    const endpoint = req.query.path || '';
    const curso = req.query.curso;

    // Construir la URL completa
    let url = n8nBaseUrl + endpoint;

    // Agregar query params si existen
    const queryParams = new URLSearchParams();
    if (curso) {
      queryParams.append('curso', curso);
    }

    // Agregar cualquier query param adicional
    Object.keys(req.query).forEach(key => {
      if (key !== 'path' && key !== 'curso') {
        queryParams.append(key, req.query[key]);
      }
    });

    if (queryParams.toString()) {
      url += '?' + queryParams.toString();
    }

    console.log('🔍 Proxy N8N Request:', {
      method: req.method,
      url: url,
      endpoint: endpoint,
      curso: curso
    });

    // Hacer la petición a N8N
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });

    const data = await response.json();

    console.log('✅ N8N Response:', {
      status: response.status,
      dataReceived: !!data
    });

    // Enviar respuesta al cliente
    res.status(response.status).json(data);

  } catch (error) {
    console.error('❌ Error en proxy N8N:', error);
    res.status(500).json({
      error: 'Error al conectar con N8N',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
