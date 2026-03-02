import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProductoListaCompra {
  producto: string;
  notas: string;
  ultimaCompra?: string;
  tienda?: string;
  precio?: number;
  agregadoEn: string; // ISO timestamp
}

interface ListaCompraStore {
  productos: ProductoListaCompra[];

  // Añadir producto a la lista
  agregarProducto: (producto: ProductoListaCompra) => void;

  // Eliminar producto de la lista
  eliminarProducto: (producto: string) => void;

  // Toggle: si existe elimina, si no existe añade
  toggleProducto: (producto: ProductoListaCompra) => void;

  // Verificar si un producto está en la lista
  estaEnLista: (producto: string) => boolean;

  // Limpiar toda la lista
  limpiarLista: () => void;

  // Marcar producto como comprado (elimina de la lista)
  marcarComprado: (producto: string) => void;

  // Obtener contador
  contador: () => number;
}

export const useListaCompra = create<ListaCompraStore>()(
  persist(
    (set, get) => ({
      productos: [],

      agregarProducto: (producto) => {
        console.log('➕ agregarProducto:', producto);
        set((state) => {
          // Verificar si ya existe
          const existe = state.productos.some((p) => p.producto === producto.producto);
          console.log('   ¿Ya existe?', existe);
          if (existe) {
            console.log('   ⚠️ Producto ya existe, no se añade');
            return state;
          }

          const nuevos = [...state.productos, producto];
          console.log('   ✅ Producto añadido. Total:', nuevos.length);
          return {
            productos: nuevos,
          };
        });
      },

      eliminarProducto: (productoNombre) => {
        console.log('➖ eliminarProducto:', productoNombre);
        set((state) => {
          const nuevos = state.productos.filter((p) => p.producto !== productoNombre);
          console.log('   ✅ Producto eliminado. Antes:', state.productos.length, 'Ahora:', nuevos.length);
          return {
            productos: nuevos,
          };
        });
      },

      toggleProducto: (producto) => {
        console.log('🔄 toggleProducto llamado:', producto);
        const { estaEnLista, agregarProducto, eliminarProducto } = get();
        const esta = estaEnLista(producto.producto);
        console.log('   ¿Está en lista?', esta);

        if (esta) {
          console.log('   ➖ Eliminando...', producto.producto);
          eliminarProducto(producto.producto);
        } else {
          console.log('   ➕ Añadiendo...', producto.producto);
          agregarProducto(producto);
        }
        console.log('   ✅ Toggle completado');
      },

      estaEnLista: (productoNombre) => {
        return get().productos.some((p) => p.producto === productoNombre);
      },

      limpiarLista: () => {
        set({ productos: [] });
      },

      marcarComprado: (productoNombre) => {
        set((state) => ({
          productos: state.productos.filter((p) => p.producto !== productoNombre),
        }));
      },

      contador: () => {
        return get().productos.length;
      },
    }),
    {
      name: 'lista-compra-storage', // Key para localStorage
    }
  )
);
