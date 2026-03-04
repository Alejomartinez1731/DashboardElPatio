/**
 * Supabase Client Configuration
 *
 * Este archivo exporta dos clientes de Supabase:
 *
 * 1. `supabase` - Cliente público (ANON key)
 *    - Se usa en el browser (client components)
 *    - Solo tiene permisos de lectura por RLS
 *    - NUNCA exponer secrets en el cliente
 *
 * 2. `supabaseAdmin` - Cliente administrativo (SERVICE ROLE key)
 *    - SOLO se usa en API routes (server-side)
 *    - Tiene permisos completos (bypass RLS)
 *    - NUNCA importar en componentes del cliente
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuración desde variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan variables de entorno de Supabase. ' +
    'Verifica NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local'
  );
}

/**
 * Cliente público de Supabase
 *
 * Uso: Importar en componentes del cliente o Server Components
 * Permisos: Solo lectura (definido por RLS en Supabase)
 *
 * @example
 * ```typescript
 * import { supabase } from '@/lib/supabase';
 *
 * const { data } = await supabase
 *   .from('compras')
 *   .select('*')
 *   .limit(10);
 * ```
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // No usamos auth en este dashboard
    autoRefreshToken: false,
  },
});

/**
 * Cliente administrativo de Supabase
 *
 * ⚠️ ADVERTENCIA: SOLO usar en API routes (server-side)
 * ⚠️ NUNCA importar en componentes del cliente
 * ⚠️ Tiene permisos completos, bypass RLS
 *
 * Uso: Importar en src/app/api/**/*.ts
 * Permisos: Lectura y escritura completas
 *
 * @example
 * ```typescript
 * // ✅ CORRECTO - En API route
 * import { supabaseAdmin } from '@/lib/supabase';
 *
 * const { data } = await supabaseAdmin
 *   .from('compras')
 *   .insert({ ... });
 *
 * ❌ INCORRECTO - En componente del cliente
 * import { supabaseAdmin } from '@/lib/supabase';
 * // Esto expondrá la service role key en el browser!
 * ```
 */
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Tipos de TypeScript para las tablas de Supabase
 *
 * Generado automáticamente desde el esquema de Supabase
 * Para regenerar: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts
 */
export type Database = {
  public: {
    Tables: {
      compras: {
        Row: {
          id: string;
          fecha: string;
          tienda: string;
          descripcion: string;
          precio_unitario: number;
          cantidad: number;
          total: number;
          telefono: string | null;
          direccion: string | null;
          restaurante_id: string | null;
          proveedor_id: string | null;
          factura_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          fecha: string;
          tienda: string;
          descripcion: string;
          precio_unitario: number;
          cantidad?: number;
          total: number;
          telefono?: string | null;
          direccion?: string | null;
          restaurante_id?: string | null;
          proveedor_id?: string | null;
          factura_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          fecha?: string;
          tienda?: string;
          descripcion?: string;
          precio_unitario?: number;
          cantidad?: number;
          total?: number;
          telefono?: string | null;
          direccion?: string | null;
          restaurante_id?: string | null;
          proveedor_id?: string | null;
          factura_id?: string | null;
          created_at?: string;
        };
      };
      facturas: {
        Row: {
          id: string;
          fecha: string;
          tienda: string;
          total: number;
          num_productos: number;
          imagen_url: string | null;
          nombre_archivo: string | null;
          restaurante_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          fecha: string;
          tienda: string;
          total: number;
          num_productos: number;
          imagen_url?: string | null;
          nombre_archivo?: string | null;
          restaurante_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          fecha?: string;
          tienda?: string;
          total?: number;
          num_productos?: number;
          imagen_url?: string | null;
          nombre_archivo?: string | null;
          restaurante_id?: string | null;
          created_at?: string;
        };
      };
      proveedores: {
        Row: {
          id: string;
          nombre: string;
          nombre_normalizado: string;
          telefono: string | null;
          direccion: string | null;
          restaurante_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          nombre_normalizado: string;
          telefono?: string | null;
          direccion?: string | null;
          restaurante_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          nombre_normalizado?: string;
          telefono?: string | null;
          direccion?: string | null;
          restaurante_id?: string | null;
          created_at?: string;
        };
      };
      restaurantes: {
        Row: {
          id: string;
          nombre: string;
          direccion: string | null;
          telefono: string | null;
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          direccion?: string | null;
          telefono?: string | null;
          activo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          direccion?: string | null;
          telefono?: string | null;
          activo?: boolean;
          created_at?: string;
        };
      };
      recordatorios: {
        Row: {
          id: string;
          producto: string;
          dias: number;
          activo: boolean;
          notas: string | null;
          restaurante_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          producto: string;
          dias: number;
          activo?: boolean;
          notas?: string | null;
          restaurante_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          producto?: string;
          dias?: number;
          activo?: boolean;
          notas?: string | null;
          restaurante_id?: string | null;
          created_at?: string;
        };
      };
      alertas: {
        Row: {
          id: string;
          tipo: string;
          mensaje: string;
          producto: string | null;
          tienda: string | null;
          leida: boolean;
          restaurante_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tipo: string;
          mensaje: string;
          producto?: string | null;
          tienda?: string | null;
          leida?: boolean;
          restaurante_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tipo?: string;
          mensaje?: string;
          producto?: string | null;
          tienda?: string | null;
          leida?: boolean;
          restaurante_id?: string | null;
          created_at?: string;
        };
      };
      presupuestos: {
        Row: {
          id: string;
          restaurante_id: string | null;
          mes: number;
          anio: number;
          monto: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurante_id?: string | null;
          mes: number;
          anio: number;
          monto: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurante_id?: string | null;
          mes?: number;
          anio?: number;
          monto?: number;
          created_at?: string;
        };
      };
      precios_historico: {
        Row: {
          id: string;
          producto: string;
          tienda: string;
          precio: number;
          precio_anterior: number | null;
          variacion_porcentaje: number | null;
          fecha: string;
          restaurante_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          producto: string;
          tienda: string;
          precio: number;
          precio_anterior?: number | null;
          variacion_porcentaje?: number | null;
          fecha: string;
          restaurante_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          producto?: string;
          tienda?: string;
          precio?: number;
          precio_anterior?: number | null;
          variacion_porcentaje?: number | null;
          fecha?: string;
          restaurante_id?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      vista_gasto_por_tienda: {
        Row: {
          tienda: string;
          restaurante_id: string | null;
          total_compras: number;
          productos_unicos: number;
          gasto_total: number;
          precio_promedio: number;
          primera_compra: string;
          ultima_compra: string;
        };
      };
      vista_gasto_tienda_mensual: {
        Row: {
          tienda: string;
          restaurante_id: string | null;
          anio: number;
          mes: number;
          total_compras: number;
          gasto_total: number;
          precio_promedio: number;
        };
      };
      vista_productos_costosos: {
        Row: {
          producto: string;
          tienda: string;
          restaurante_id: string | null;
          precio_maximo: number;
          precio_minimo: number;
          precio_promedio: number;
          gasto_total: number;
          veces_comprado: number;
          ultima_compra: string;
        };
      };
      vista_productos_frecuentes: {
        Row: {
          producto: string;
          restaurante_id: string | null;
          veces_comprado: number;
          gasto_total_acumulado: number;
          precio_promedio: number;
          ultima_compra: string;
          en_tiendas: number;
        };
      };
      vista_evolucion_precios: {
        Row: {
          producto: string;
          tienda: string;
          precio: number;
          precio_anterior: number | null;
          variacion_porcentaje: number | null;
          fecha: string;
          restaurante_id: string | null;
        };
      };
      vista_resumen_mensual: {
        Row: {
          restaurante_id: string | null;
          anio: number;
          mes: number;
          total_facturas: number;
          total_lineas: number;
          gasto_total: number;
          gasto_promedio_linea: number;
          proveedores_activos: number;
          productos_distintos: number;
        };
      };
      vista_gasto_por_categoria: {
        Row: {
          restaurante_id: string | null;
          categoria: string;
          total_items: number;
          gasto_total: number;
          precio_promedio: number;
        };
      };
    };
    Functions: {
      comparar_periodos: {
        Args: {
          p_restaurante_id?: string;
          p_dias?: number;
        };
        Returns: {
          periodo: string;
          gasto_total: number;
          total_compras: number;
          total_facturas: number;
        }[];
      };
    };
  };
};
