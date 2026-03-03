import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Configuración
const USE_MOCK = process.env.USE_MOCK_DATA === 'true';
const MAX_RETRIES = 1;
const TIMEOUT_MS = 15000; // 15 segundos
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL; // ✅ Server-side only, no NEXT_PUBLIC_

type ErrorType = 'timeout' | 'network' | 'parse' | 'validation' | 'unknown';

interface N8NError extends Error {
  type?: ErrorType;
  isTimeout?: boolean;
}

/**
 * Valida que la respuesta de n8n tenga la estructura esperada
 */
function validateN8NResponse(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'La respuesta no es un objeto válido' };
  }

  if (!data.success && !data.data) {
    return { valid: false, error: 'Respuesta sin success ni data' };
  }

  if (data.data && typeof data.data !== 'object') {
    return { valid: false, error: 'data no es un objeto' };
  }

  return { valid: true };
}

/**
 * Intenta obtener datos de n8n con reintentos
 */
async function fetchFromN8N(webhookUrl: string, attempt: number = 1): Promise<{ success: boolean; data?: any; error?: string; errorType?: ErrorType }> {
  console.log(`📡 Intento ${attempt}/${MAX_RETRIES} de conexión a n8n...`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(webhookUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Vercel-Function',
      },
    });
    clearTimeout(timeoutId);

    console.log(`📡 Respuesta n8n status: ${response.status}`);

    if (!response.ok) {
      return {
        success: false,
        error: `n8n respondió con status ${response.status}`,
        errorType: 'network'
      };
    }

    // Validar Content-Type
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return {
        success: false,
        error: `Respuesta no es JSON (Content-Type: ${contentType})`,
        errorType: 'parse'
      };
    }

    const data = await response.json();
    console.log('📡 Datos recibidos de n8n:', Object.keys(data.data || {}));

    // Validar estructura
    const validation = validateN8NResponse(data);
    if (!validation.valid) {
      return {
        success: false,
        error: `Estructura inválida: ${validation.error}`,
        errorType: 'validation'
      };
    }

    return { success: true, data };

  } catch (error: any) {
    clearTimeout(timeoutId);

    // Diferenciar tipos de error
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: `Timeout después de ${TIMEOUT_MS}ms`,
        errorType: 'timeout'
      };
    }

    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: `Error al parsear JSON: ${error.message}`,
        errorType: 'parse'
      };
    }

    return {
      success: false,
      error: error.message || 'Error desconocido',
      errorType: 'network'
    };
  }
}

/**
 * Intenta obtener datos con reintentos exponenciales
 */
async function fetchWithRetry(webhookUrl: string): Promise<{ success: boolean; data?: any; error?: string; errorType?: ErrorType; attempts?: number }> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const result = await fetchFromN8N(webhookUrl, attempt);

    if (result.success) {
      return { ...result, attempts: attempt };
    }

    // Si es el último intento o error de validación (no reintentable), retornar error
    if (attempt === MAX_RETRIES || result.errorType === 'validation' || result.errorType === 'parse') {
      return { ...result, attempts: attempt };
    }

    // Esperar antes de reintentar (backoff exponencial)
    const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5s
    console.log(`⏳ Esperando ${waitTime}ms antes del reintento...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  return { success: false, error: 'Máximo de reintentos alcanzado', attempts: MAX_RETRIES };
}

export async function GET(request: Request) {
  // Modo MOCK explícito
  if (USE_MOCK) {
    console.log('📭 MODO MOCK EXPLÍCITO (USE_MOCK_DATA=true)');
    const { GET } = await import('./mock/route');
    const mockResponse = await GET(request);
    const mockData = await mockResponse.json();

    return NextResponse.json({
      ...mockData,
      _source: 'mock',
      _isMock: true,
      _warning: 'Usando datos de prueba (configuración USE_MOCK_DATA=true)'
    });
  }

  console.log('📡 API /api/sheets llamada');

  // Validar configuración
  if (!N8N_WEBHOOK_URL) {
    console.warn('⚠️ N8N_WEBHOOK_URL no configurada');
    const { GET } = await import('./mock/route');
    const mockResponse = await GET(request);
    const mockData = await mockResponse.json();

    return NextResponse.json({
      ...mockData,
      _source: 'mock',
      _isMock: true,
      _warning: 'URL de n8n no configurada, usando datos de prueba'
    });
  }

  console.log('📡 Webhook URL:', N8N_WEBHOOK_URL.substring(0, 40) + '...');

  // Intentar obtener de n8n con reintentos
  const n8nResult = await fetchWithRetry(N8N_WEBHOOK_URL);

  if (!n8nResult.success) {
    console.error(`❌ n8n falló después de ${n8nResult.attempts} intentos:`, n8nResult.error);

    // Usar mock como fallback
    const { GET } = await import('./mock/route');
    const mockResponse = await GET(request);
    const mockData = await mockResponse.json();

    return NextResponse.json({
      ...mockData,
      _source: 'mock',
      _isMock: true,
      _warning: `n8n no disponible (${n8nResult.errorType}: ${n8nResult.error}). Usando datos de prueba.`,
      _n8nError: n8nResult.error,
      _n8nErrorType: n8nResult.errorType,
      _n8nAttempts: n8nResult.attempts ?? MAX_RETRIES
    });
  }

  console.log(`✅ n8n respondió correctamente (${n8nResult.attempts ?? 1} intento${(n8nResult.attempts ?? 1) > 1 ? 's' : ''})`);

  const data = n8nResult.data!;

  // Mapear nombres de n8n a nombres internos del dashboard
  const mappedData = {
    base_de_datos: data.data?.base_de_datos || data.data?.historico || {},
    historico: data.data?.historico || {},
    historico_precios: data.data?.historico_precios || {},
    costosos: data.data?.producto_mas_costoso || data.data?.costosos || {},
    gasto_tienda: data.data?.gasto_por_tienda || data.data?.gasto_tienda || {},
    precio_producto: data.data?.precio_por_producto || data.data?.precio_producto || {},
    registro_diario: data.data?.registro_diario || {},
  };

  return NextResponse.json({
    success: true,
    data: mappedData,
    timestamp: new Date().toISOString(),
    _source: 'n8n',
    _isMock: false,
    _n8nAttempts: n8nResult.attempts ?? 1
  });
}
