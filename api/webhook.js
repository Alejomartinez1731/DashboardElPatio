// Serverless Function para Vercel - Proxy a n8n
// Evita problemas de CORS entre Vercel y n8n

export default async function handler(req, res) {
    // URL base de n8n
    const N8N_WEBHOOK_URL = 'https://micro-bits-n8n.aejhww.easypanel.host/webhook';

    // Habilitar CORS para todas las respuestas
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Manejar preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // Construir URL completa
        const endpoint = req.url.replace('/api/webhook', '');
        const url = N8N_WEBHOOK_URL + endpoint;

        console.log('📡 Proxy request:', req.method, url);

        // Configurar opciones de fetch
        const options = {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        // Agregar body si es POST/PUT
        if (req.method === 'POST' || req.method === 'PUT') {
            options.body = JSON.stringify(req.body);
        }

        // Hacer petición a n8n
        const response = await fetch(url, options);

        // Obtener respuesta
        const data = await response.json();

        // Devolver respuesta con CORS
        res.status(response.status).json(data);

    } catch (error) {
        console.error('❌ Error en proxy a n8n:', error);
        res.status(500).json({
            error: 'Error en proxy a n8n',
            message: error.message
        });
    }
}
