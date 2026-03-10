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
        // Obtener la ruta después de /api/webhook o /webhook
        // Vercel reescribe /webhook/* a /api/webhook, así que usamos query o la ruta completa
        let path = req.url;

        // Remover prefijos que pueda agregar Vercel
        if (path.startsWith('/api/webhook')) {
            path = path.replace('/api/webhook', '');
        } else if (path.startsWith('/webhook')) {
            path = path.replace('/webhook', '');
        }

        // Eliminar query params si existen
        const urlParts = path.split('?');
        path = urlParts[0];

        // Construir URL completa para n8n
        const url = N8N_WEBHOOK_URL + path;

        // Agregar query params si existen
        const queryParams = urlParts[1];
        const fullUrl = queryParams ? `${url}?${queryParams}` : url;

        console.log('📡 [Vercel Proxy]', req.method, fullUrl);

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
        const response = await fetch(fullUrl, options);

        // Obtener respuesta como texto primero para debug
        const text = await response.text();
        console.log('📡 [Vercel Proxy] Response status:', response.status);

        // Intentar parsear como JSON
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            // Si no es JSON, devolver el texto tal cual
            data = text || { success: true };
        }

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
