import { CategoriaProducto, CATEGORIAS_INFO } from '@/types';

/**
 * Palabras clave para cada categoría de producto
 */
const PALABRAS_CLAVE: Record<CategoriaProducto, string[]> = {
  carnes: [
    'lomo', 'poll', 'pollo', 'ternera', 'cerdo', 'bistec', 'costilla', 'jamon', 'pernil',
    'hamburguesa', 'salchicha', 'butifarra', 'choriz', 'chuleta', 'alitas', 'muslo',
    'pechuga', 'entrecot', 'cinta', 'llom', 'cordero', 't-bone', 'ribeye',
  ],
  lacteos: [
    'lech', 'llet', 'yogur', 'queso', 'formatge', 'mantequilla', 'mantega', 'nata',
    'crema', 'cuajada', 'requeson', 'bri', 'gouda', 'edam', 'emmental', 'mozzarella',
    'parmesan', 'brie', 'camembert', 'roquefort',
  ],
  verdura: [
    'tomat', 'tomaq', 'ceboll', 'ceba', 'ajo', 'lechuga', 'espinaca', 'acelga',
    'zanahoria', 'pastanag', 'pata', 'brocoli', 'coliflor', 'pimient', 'pebr',
    'calabaza', 'berenjena', 'pepin', 'pepino', 'calabac', 'judia', 'monget',
    'guisante', 'lenteja', 'garbanz', 'fruta', 'poma', 'manzana', 'naranja', 'limon',
    'llimona', 'platano', 'banana', 'fresa', 'madroño', 'uva', 'melon', 'sandia',
    'pera', 'kiwi', 'mango', 'piña', 'raym', 'raim',
  ],
  panaderia: [
    'pan', 'pa', 'harina', 'farina', 'galleta', 'galeta', 'bollo', 'bol', 'croissant',
    'pastel', 'past', 'bizcocho', 'tarta', 'empanada', 'pizza', 'pasta', 'macarron',
    'espagu', 'fideo', 'tallarin', 'raviol', 'canelon', 'panett', 'brioche',
  ],
  bebidas: [
    'agua', 'aigua', 'refresc', 'gaseosa', 'coca', 'pepsi', 'cola', 'zumo', 'exprim',
    'jugo', 'nestea', 'fanta', 'sprite', 'cerveza', 'cerve', 'vino', 'cafe', 'caf',
    'te', 'te', 'tonic', 'whisky', 'ron', 'ginebra', 'vodka', 'cava', 'champ',
    'licor', 'batido', 'yogurt', 'leche',
  ],
  limpieza: [
    'limpia', 'detergente', 'jabon', 'gel', 'champu', 'shampoo', 'colonia', 'perfume',
    'desodorant', 'papel higien', 'toallita', 'pañal', 'servillet', 'escoba', 'mopa',
    'fregona', 'bayeta', 'esponja', 'lejia', 'lejía', 'lavavajilla', 'suavizant',
    'ambientador', 'insecticida', 'limpiacristal', 'desatascador',
  ],
  otros: [
    // Categoría por defecto - sin palabras clave específicas
  ],
};

/**
 * Categoriza un producto basándose en palabras clave
 *
 * @param producto - Nombre del producto a categorizar
 * @returns La categoría del producto
 */
export function categorizarProducto(producto: string): CategoriaProducto {
  if (!producto) return 'otros';

  const nombreNormalizado = producto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .trim();

  // Buscar coincidencias con palabras clave de cada categoría
  for (const [categoria, palabras] of Object.entries(PALABRAS_CLAVE)) {
    for (const palabra of palabras) {
      // Buscar la palabra como parte del nombre (coincidencia parcial)
      if (nombreNormalizado.includes(palabra)) {
        return categoria as CategoriaProducto;
      }
    }
  }

  // Si no hay coincidencia, retornar 'otros'
  return 'otros';
}

/**
 * Obtiene el gasto total por categoría
 */
export function calcularGastoPorCategoria(
  compras: Array<{ producto: string; total: number }>
): Record<CategoriaProducto, number> {
  const gastoPorCategoria: Record<string, number> = {
    carnes: 0,
    lacteos: 0,
    verdura: 0,
    panaderia: 0,
    bebidas: 0,
    limpieza: 0,
    otros: 0,
  };

  compras.forEach(compra => {
    const categoria = categorizarProducto(compra.producto);
    gastoPorCategoria[categoria] += compra.total;
  });

  return gastoPorCategoria as Record<CategoriaProducto, number>;
}

/**
 * Obtiene el porcentaje de gasto por categoría
 */
export function calcularPorcentajePorCategoria(
  compras: Array<{ producto: string; total: number }>
): Record<CategoriaProducto, number> {
  const gastoPorCategoria = calcularGastoPorCategoria(compras);
  const totalGastado = Object.values(gastoPorCategoria).reduce((sum, val) => sum + val, 0);

  if (totalGastado === 0) {
    return {
      carnes: 0,
      lacteos: 0,
      verdura: 0,
      panaderia: 0,
      bebidas: 0,
      limpieza: 0,
      otros: 0,
    } as Record<CategoriaProducto, number>;
  }

  const porcentajes: Record<string, number> = {};
  Object.entries(gastoPorCategoria).forEach(([cat, gasto]) => {
    porcentajes[cat] = (gasto / totalGastado) * 100;
  });

  return porcentajes as Record<CategoriaProducto, number>;
}

/**
 * Obtiene todas las categorías disponibles
 */
export function obtenerCategorias(): CategoriaProducto[] {
  return Object.keys(CATEGORIAS_INFO) as CategoriaProducto[];
}
