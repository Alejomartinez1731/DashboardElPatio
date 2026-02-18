'use client';

import { useEffect, useState } from 'react';
import { KPICardEnhanced } from '@/components/dashboard/kpi-card-enhanced';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { FilterPanel } from '@/components/dashboard/filter-panel';
import { Compra, KPIData, SheetName } from '@/types';
import { calcularKPIs, normalizarTienda } from '@/lib/data-utils';
import { Table, TrendingUp, PieChart, ShoppingBag, AlertCircle, Download, ChevronUp, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { formatearMoneda, formatearFecha } from '@/lib/formatters';

type TabId = 'historico' | 'historico_precios' | 'producto_costoso' | 'gasto_tienda' | 'precio_producto';

interface Tab {
  id: TabId;
  label: string;
  sheetName: SheetName;
  icon: any;
  description: string;
}

const TABS: Tab[] = [
  { id: 'historico_precios', label: 'Histórico de Precios', sheetName: 'historico_precios', icon: TrendingUp, description: 'Evolución de precios por producto' },
  { id: 'producto_costoso', label: 'Producto más Costoso', sheetName: 'costosos', icon: ShoppingBag, description: 'Ranking de productos por precio' },
  { id: 'gasto_tienda', label: 'Gasto por Tienda', sheetName: 'gasto_tienda', icon: PieChart, description: 'Gastos acumulados por proveedor/tienda' },
  { id: 'precio_producto', label: 'Precio x Producto', sheetName: 'precio_producto', icon: AlertCircle, description: 'Comparativa de precios por producto' },
  { id: 'historico', label: 'Base de Datos', sheetName: 'historico', icon: Table, description: 'Tabla completa de historial de compras' },
];

interface Filtros {
  fechaInicio: Date | null;
  fechaFin: Date | null;
  rangoFecha: 'todo' | 'hoy' | 'semana' | 'mes' | 'mesPasado' | 'anio';
  tiendas: string[];
  busqueda: string;
  precioMin: number | null;
  precioMax: number | null;
}

type SortField = 'fecha' | 'tienda' | 'producto' | 'cantidad' | 'precio' | 'total';

export default function DashboardPage() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [comprasFiltradas, setComprasFiltradas] = useState<Compra[]>([]);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('historico');
  const [sheetsData, setSheetsData] = useState<Record<string, string[][]>>({});

  // Filtros
  const [filtros, setFiltros] = useState<Filtros>({
    fechaInicio: null,
    fechaFin: null,
    rangoFecha: 'todo',
    tiendas: [],
    busqueda: '',
    precioMin: null,
    precioMax: null,
  });

  // Ordenamiento
  const [sortField, setSortField] = useState<SortField>('fecha');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    async function fetchDatos() {
      try {
        setCargando(true);
        setError(null);

        const response = await fetch('/api/sheets');
        if (!response.ok) throw new Error('Error al obtener datos');

        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Error desconocido');

        // Guardar datos crudos
        const allData: Record<string, string[][]> = {};
        TABS.forEach(tab => {
          const sheetData = result.data[tab.sheetName];
          if (sheetData && sheetData.values && Array.isArray(sheetData.values)) {
            allData[tab.sheetName] = sheetData.values;
          } else {
            allData[tab.sheetName] = [];
          }
        });
        setSheetsData(allData);

        // Procesar compras
        const hojaHistorico = result.data.historico;
        console.log('📊 Datos de historico recibidos:', hojaHistorico);

        if (hojaHistorico && hojaHistorico.values) {
          const values = hojaHistorico.values as any[][];
          console.log('📊 Valores de historico:', values.length, 'filas');
          console.log('📊 Primera fila (cabeceras):', values[0]);
          console.log('📊 Segunda fila (ejemplo):', values[1]);

          if (values.length > 1) {
            // Normalizar cabeceras: minúsculas, sin espacios, sin tildes
            const cabeceras = values[0].map((h: string) => {
              return h.toLowerCase()
                .trim()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar tildes
                .replace(/\s+/g, '_'); // Reemplazar espacios con guiones bajos
            });
            console.log('📊 Cabeceras procesadas:', cabeceras);

            const comprasProcesadas: Compra[] = [];

            for (let i = 1; i < values.length; i++) {
              const fila = values[i];
              const obj: any = {};
              cabeceras.forEach((cab: string, idx: number) => { obj[cab] = fila[idx]; });

              console.log(`📝 Procesando fila ${i}:`, obj);

              const compra: Compra = {
                id: `compra-${i}`,
                fecha: parsearFecha(obj.fecha || ''),
                tienda: obj.tienda || '',
                producto: obj.descripcion || '',
                cantidad: parseFloat(obj.cantidad || '0') || 0,
                precioUnitario: parseFloat(obj['precio_unitario'] || obj['precio unitario'] || '0') || 0,
                total: parseFloat(obj.total || '0') || 0,
                telefono: obj.telefono,
                direccion: obj.direccion,
              };

              const excluida = excluirFilaResumen(compra.producto);
              console.log(`📝 Fila ${i}: producto="${compra.producto}", excluida=${excluida}`);

              if (compra.producto && !excluida) {
                comprasProcesadas.push(compra);
              }
            }

            console.log('✅ Compras procesadas:', comprasProcesadas.length);
            console.log('✅ Primera compra:', comprasProcesadas[0]);

            setCompras(comprasProcesadas);
            const kpis = calcularKPIs(comprasProcesadas);
            setKpiData(kpis);
            setComprasFiltradas(comprasProcesadas);
          }
        } else {
          console.log('❌ No hay valores en historico');
        }
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setCargando(false);
      }
    }

    fetchDatos();
  }, []);

  // Aplicar filtros cuando cambian
  useEffect(() => {
    console.log('🔍 Aplicando filtros:', filtros);
    let filtradas = [...compras];

    // Filtro por rango de fechas
    if (filtros.fechaInicio) {
      const inicio = new Date(filtros.fechaInicio);
      inicio.setHours(0, 0, 0, 0);
      filtradas = filtradas.filter(c => c.fecha >= inicio);
      console.log('📅 Filtro fecha inicio:', inicio, '→', filtradas.length, 'filas');
    }
    if (filtros.fechaFin) {
      const fin = new Date(filtros.fechaFin);
      fin.setHours(23, 59, 59, 999);
      filtradas = filtradas.filter(c => c.fecha <= fin);
      console.log('📅 Filtro fecha fin:', fin, '→', filtradas.length, 'filas');
    }

    // Filtro por tiendas
    if (filtros.tiendas.length > 0) {
      filtradas = filtradas.filter(c => filtros.tiendas.includes(normalizarTienda(c.tienda)));
      console.log('🏪 Filtro tiendas:', filtros.tiendas, '→', filtradas.length, 'filas');
    }

    // Filtro por búsqueda de producto
    if (filtros.busqueda) {
      const busquedaLower = filtros.busqueda.toLowerCase().trim();
      filtradas = filtradas.filter(c =>
        c.producto.toLowerCase().includes(busquedaLower)
      );
      console.log('🔎 Filtro búsqueda:', filtros.busqueda, '→', filtradas.length, 'filas');
    }

    // Filtro por rango de precios
    if (filtros.precioMin !== null) {
      filtradas = filtradas.filter(c => c.precioUnitario >= filtros.precioMin!);
      console.log('💰 Filtro precio min:', filtros.precioMin, '→', filtradas.length, 'filas');
    }
    if (filtros.precioMax !== null) {
      filtradas = filtradas.filter(c => c.precioUnitario <= filtros.precioMax!);
      console.log('💰 Filtro precio max:', filtros.precioMax, '→', filtradas.length, 'filas');
    }

    // Aplicar ordenamiento
    filtradas.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case 'fecha':
          aVal = a.fecha.getTime();
          bVal = b.fecha.getTime();
          break;
        case 'tienda':
          aVal = normalizarTienda(a.tienda);
          bVal = normalizarTienda(b.tienda);
          break;
        case 'producto':
          aVal = a.producto.toLowerCase();
          bVal = b.producto.toLowerCase();
          break;
        case 'cantidad':
          aVal = a.cantidad;
          bVal = b.cantidad;
          break;
        case 'precio':
          aVal = a.precioUnitario;
          bVal = b.precioUnitario;
          break;
        case 'total':
          aVal = a.total;
          bVal = b.total;
          break;
      }
      if (sortOrder === 'asc') return aVal > bVal ? 1 : (aVal < bVal ? -1 : 0);
      return aVal < bVal ? 1 : (aVal > bVal ? -1 : 0);
    });

    console.log('✅ Filtrado final:', filtradas.length, 'de', compras.length, 'filas');
    setComprasFiltradas(filtradas);
  }, [compras, filtros, sortField, sortOrder]);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleExport = () => {
    const currentSheetName = TABS.find(t => t.id === activeTab)?.sheetName;
    const currentData = sheetsData[currentSheetName || ''];
    if (!currentData || currentData.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    const csv = currentData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSheetName}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFilter = () => {
    setShowFilters(!showFilters);
  };

  // Obtener tiendas únicas
  const tiendasUnicas = Array.from(new Set(compras.map(c => normalizarTienda(c.tienda)))).sort();

  // Función para ordenar
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  if (cargando) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Panel General</h1>
            <p className="text-[#94a3b8]">Tablas de Google Sheets</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg">
            <div className="w-2 h-2 bg-[#f59e0b] rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-[#f59e0b]">Cargando...</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-[#111827] border border-[#1e293b] rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center bg-[#1a2234] border border-[#ef4444]/30 rounded-lg p-8">
          <p className="text-[#ef4444] font-semibold mb-2">Error de Carga</p>
          <p className="text-[#94a3b8] text-sm mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-[#f59e0b] text-white rounded-lg">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const activeSheetName = TABS.find(t => t.id === activeTab)?.sheetName || 'historico';
  const activeData = sheetsData[activeSheetName] || [];
  const numRows = activeData.length;
  const numFilasFiltradas = comprasFiltradas.length;

  console.log('📊 Estado del dashboard:', {
    activeTab,
    activeSheetName,
    numRows,
    numFilasFiltradas,
    totalCompras: compras.length,
    filtros,
    sheetsDataKeys: Object.keys(sheetsData)
  });
  const comprasComoTabla = activeTab === 'historico'
    ? compras.map(c => {
        const row = [
          c.id.split('-')[1] || '',
          formatearFecha(c.fecha),
          c.tienda,
          c.producto,
          c.precioUnitario.toFixed(2).replace('.00', ''),
          c.cantidad.toString(),
          c.total.toFixed(2).replace('.00', ''),
          c.telefono || '',
          c.direccion || ''
        ];
        console.log('📝 Row de compra:', row, 'Tipos:', row.map(r => typeof r));
        return row;
      })
    : [];

  // Cabeceras personalizadas para Histórico
  const cabecerasHistorico = ['ID', 'FECHA', 'TIENDA', 'PRODUCTO', 'PRECIO', 'CANTIDAD', 'TOTAL', 'TELÉFONO', 'DIRECCIÓN'];

  // Para pestañas que no son histórico, arreglar cabeceras si es necesario
  let datosTabla = activeTab === 'historico'
    ? [cabecerasHistorico, ...comprasComoTabla]
    : activeData;

  // Normalizar cabeceras en todas las pestañas
  if (datosTabla.length > 0) {
    // Para Precio x Producto, la estructura es diferente (transpuesta)
    if (activeTab === 'precio_producto' && datosTabla.length > 0) {
      console.log('📊 ESTRUCTURA precio_producto:');
      console.log('📊 Fila 0 (cabeceras originales?):', datosTabla[0]);
      console.log('📊 Fila 1 (primera fila de datos):', datosTabla[1]);
      console.log('📊 Fila 2 (segunda fila de datos):', datosTabla[2]);
      console.log('📊 Total filas:', datosTabla.length);

      // Si la primera fila tiene "Descripcion" como cabecera, probablemente
      // la estructura es: ID | Descripcion | vacio | fecha1 | fecha2 | ...
      if (datosTabla[0][1] && String(datosTabla[0][1]).toLowerCase().includes('descripcion')) {
        console.log('📊 Detectado: Estructura con Descripcion en fila 0');
        console.log('📊 datosTabla[0]:', datosTabla[0]);

        // Crear cabeceras correctas - solo ID y PRODUCTO
        const nuevasCabeceras = ['ID', 'PRODUCTO'];

        // Agregar fechas como cabeceras - recorrer todas las columnas desde la 3
        for (let i = 3; i < datosTabla[0].length; i++) {
          const valor = datosTabla[0][i];
          console.log(`📊 Procesando cabecera ${i}:`, valor, 'tipo:', typeof valor, 'es fecha yyyy-mm-dd:', String(valor).match(/^\d{4}-\d{2}-\d{2}$/));

          if (valor && String(valor).match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Es una fecha en formato yyyy-mm-dd, convertirla manualmente a dd/mm/yyyy
            const fechaStr = String(valor);
            const [anio, mes, dia] = fechaStr.split('-');
            const fechaFormateada = `${dia}/${mes}/${anio}`;
            console.log(`📊 Fecha convertida: ${valor} → ${fechaFormateada}`);
            nuevasCabeceras.push(fechaFormateada);
          } else if (valor && valor !== '') {
            nuevasCabeceras.push(String(valor).toUpperCase());
          }
        }

        console.log('📊 Nuevas cabeceras creadas:', nuevasCabeceras);

        // Crear nuevas filas de datos, omitiendo filas vacías y procesando correctamente
        const nuevasFilas = [nuevasCabeceras];

        // Empezar desde la fila 2 (la fila 1 suele ser de totales/vacía)
        // Primero, fusionar filas que parecen ser continuación de un producto incompleto
        const filasFusionadas = [];

        for (let rowIdx = 2; rowIdx < datosTabla.length; rowIdx++) {
          const row = datosTabla[rowIdx];

          // Si la fila está completamente vacía, saltarla
          if (!row || row.length === 0) continue;

          console.log(`📊 Procesando fila ${rowIdx}:`, row);

          // Obtener el nombre del producto de la columna 1
          let productoActual = String(row[1] || '').trim();

          // Si el producto actual parece incompleto (solo números cortos), buscar si la siguiente fila es continuación
          // Un producto está incompleto si:
          // 1. Es solo un número (ej: "15", "24", "40")
          // 2. La siguiente fila tiene un producto que parece ser continuación (texto sin números al inicio)
          if (productoActual.match(/^\d+$/) && rowIdx + 1 < datosTabla.length) {
            const nextRow = datosTabla[rowIdx + 1];
            const nextProducto = String(nextRow[1] || '').trim();

            // Si la siguiente fila NO empieza con número, es probablemente la continuación
            if (nextProducto && !nextProducto.match(/^\d+/)) {
              console.log(`📊 Detectado producto incompleto: "${productoActual}" + "${nextProducto}"`);

              // Fusionar las filas
              const rowFusionada = [...row];

              // Unir los nombres de productos
              rowFusionada[1] = `${productoActual} ${nextProducto}`;

              // Fusionar los precios (sumar o tomar el que tenga valor)
              for (let i = 3; i < row.length; i++) {
                const valor1 = row[i];
                const valor2 = nextRow[i];

                // Si uno está vacío y el otro no, usar el que tiene valor
                if ((valor1 === '' || valor1 === '-' || valor1 === null) && valor2 && valor2 !== '' && valor2 !== '-') {
                  rowFusionada[i] = valor2;
                }
                // Si ambos tienen valores numéricos, sumarlos
                else if (valor1 && valor2 && valor1 !== '-' && valor2 !== '-') {
                  const num1 = parseFloat(String(valor1)) || 0;
                  const num2 = parseFloat(String(valor2)) || 0;
                  if (!isNaN(num1) && !isNaN(num2)) {
                    rowFusionada[i] = (num1 + num2).toString();
                  }
                }
              }

              filasFusionadas.push(rowFusionada);
              console.log(`📊 Fila fusionada:`, rowFusionada);

              // Saltar la siguiente fila porque ya la fusionamos
              rowIdx++; // Incrementar para saltar nextRow
              continue;
            }
          }

          // Si no se fusionó, agregar la fila tal cual
          filasFusionadas.push(row);
        }

        // Ahora procesar las filas fusionadas
        for (let f = 0; f < filasFusionadas.length; f++) {
          const row = filasFusionadas[f];
          const rowIdx = f + 2; // Para logs

          console.log(`📊 Procesando fila fusionada ${rowIdx}:`, row);

          // El producto está en la columna 1
          let producto = String(row[1] || '').trim();

          // Si es un array, unirlo
          if (Array.isArray(producto)) {
            producto = producto.join(' ').trim();
          }

          console.log(`📊 Producto final fila ${rowIdx}:`, `"${producto}"`);

          // Crear nueva fila procesada
          const newRow = [
            row[0] || '', // ID
            producto, // PRODUCTO
          ];

          // Agregar los precios (desde columna 3 en adelante)
          for (let i = 3; i < row.length; i++) {
            let valor = row[i];

            // Si el valor es un array, unirlo
            if (Array.isArray(valor)) {
              valor = valor.join(' ').trim();
            }

            newRow.push(valor);
          }

          // Solo agregar la fila si tiene un producto válido
          if (producto && producto.trim() !== '' && producto.trim() !== '0') {
            console.log(`📊 Fila ${rowIdx} procesada FINAL:`, newRow);
            nuevasFilas.push(newRow);
          } else {
            console.log(`⚠️ Fila ${rowIdx} descartada: producto vacío`);
          }
        }

        datosTabla = nuevasFilas;
      } else {
        console.log('📊 Estructura no reconocida, usando cabeceras genéricas');
        // Crear cabeceras genéricas pero SIN CANTIDAD
        datosTabla[0] = datosTabla[0].map((cell, idx) => {
          const cellStr = String(cell).toLowerCase().trim();
          if (cellStr === 'col-1' || cellStr === 'column1' || idx === 1) return 'PRODUCTO';
          // NO agregar CANTIDAD - saltar índice 2 o renombrar a otra cosa
          if (cellStr === 'col-2' || cellStr === 'column2' || idx === 2) {
            // Si el valor original es una fecha, formatearlo
            const cellVal = String(datosTabla[0][idx] || '');
            if (cellVal.match(/^\d{4}-\d{2}-\d{2}$/)) {
              const fecha = new Date(cellVal + 'T00:00:00');
              if (!isNaN(fecha.getTime())) {
                return formatearFecha(fecha);
              }
            }
            return 'DATOS'; // Nombre genérico, no CANTIDAD
          }
          if (cellStr.match(/^col-\d+$/)) return `DATOS ${idx}`;
          // Si es una fecha en formato yyyy-mm-dd, formatearla
          const cellVal = String(cell).trim();
          if (cellVal.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const fecha = new Date(cellVal + 'T00:00:00');
            if (!isNaN(fecha.getTime())) {
              return formatearFecha(fecha);
            }
          }
          return String(cell).toUpperCase();
        });
      }
    } else {
      // Para otras pestañas, normalizar normalmente
      datosTabla = datosTabla.map((row, idx) => {
        if (idx === 0) {
          // Es la cabecera - normalizarla
          return row.map((cell: string | number) => {
            const cellStr = String(cell).toLowerCase().trim();

            // Reemplazos específicos
            if (cellStr === 'row_number' || cellStr === 'row number' || cellStr.startsWith('col')) {
              return 'ID';
            }
            if (cellStr === 'fecha' || cellStr === 'date') {
              return 'FECHA';
            }
            if (cellStr === 'tienda' || cellStr === 'store') {
              return 'TIENDA';
            }
            if (cellStr === 'descripcion' || cellStr === 'descripción' || cellStr === 'producto' || cellStr === 'product') {
              return 'PRODUCTO';
            }
            if (cellStr === 'precio_unitario' || cellStr === 'precio unitario' || cellStr === 'precio' || cellStr === 'precio_promedio' || cellStr === 'precio promedio' || cellStr === 'sum de precio unitario') {
              return 'PRECIO';
            }
            if (cellStr === 'cantidad' || cellStr === 'quantity') {
              return 'CANTIDAD';
            }
            if (cellStr === 'total') {
              return 'TOTAL';
            }
            if (cellStr === 'telefono' || cellStr === 'teléfono') {
              return 'TELÉFONO';
            }
            if (cellStr === 'direccion' || cellStr === 'dirección') {
              return 'DIRECCIÓN';
            }

            // Para cabeceras tipo "COL-X", mejorarlas
            if (cellStr.match(/^col-\d+$/)) {
              return `DATOS ${cellStr.replace('col-', '')}`;
            }

            // Para otras cabeceras, limpiar y poner en mayúsculas
            return cellStr
              .replace(/_/g, ' ')        // Guiones bajos a espacios
              .replace(/-/g, ' ')        // Guiones a espacios
              .replace(/\s+/g, ' ')      // Múltiples espacios a uno solo
              .trim()
              .toUpperCase();
          });
        }
        return row;
      });
    }

    console.log('📊 Cabeceras finales para', activeTab, ':', datosTabla[0]);
  }

  if (activeTab === 'historico') {
    console.log('📊 Estado de Histórico:');
    console.log('  - comprasFiltradas.length:', comprasFiltradas.length);
    console.log('  - compras.length:', compras.length);
    console.log('  - comprasComoTabla.length:', comprasComoTabla.length);
    console.log('  - datosTabla.length:', datosTabla.length);
    console.log('  - datosTabla[0]:', datosTabla[0]);
    console.log('  - datosTabla[1]:', datosTabla[1]);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white to-[#94a3b8] bg-clip-text text-transparent">
            Panel General
          </h1>
          <p className="text-[#94a3b8]">Tablas de Google Sheets</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg">
            <div className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-[#10b981]">Conectado a n8n</span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICardEnhanced titulo="Gasto del Día" valor={kpiData?.gastoDelDia || 0} variacion={kpiData?.variacionDia} icono="euro" tipo="moneda" />
        <KPICardEnhanced titulo="Gasto del Mes" valor={kpiData?.gastoDelMes || 0} variacion={kpiData?.variacionMes} icono="activity" tipo="moneda" />
        <KPICardEnhanced titulo="Facturas Procesadas" valor={kpiData?.facturasProcesadas || 0} icono="shopping" tipo="numero" />
        <KPICardEnhanced titulo="Alertas de Precio" valor={kpiData?.alertasDePrecio || 0} icono="trending-up" tipo="numero" />
      </div>

      {/* Quick Actions */}
      <QuickActions
        onRefresh={handleRefresh}
        onExport={handleExport}
        onFilter={activeTab === 'historico' ? undefined : handleFilter}
        cargando={cargando}
        filtrosActivos={filtros.busqueda !== '' || filtros.tiendas.length > 0 || filtros.rangoFecha !== 'todo' || filtros.precioMin !== null || filtros.precioMax !== null}
      />

      {/* Panel de Filtros - Solo mostrar si NO es histórico */}
      {activeTab !== 'historico' && showFilters && (
        <FilterPanel
          filtros={filtros}
          onFiltrosChange={setFiltros}
          onReset={() => {
            setFiltros({
              fechaInicio: null,
              fechaFin: null,
              rangoFecha: 'todo',
              tiendas: [],
              busqueda: '',
              precioMin: null,
              precioMax: null,
            });
          }}
          tiendasUnicas={tiendasUnicas}
          compras={compras}
        />
      )}

      {/* Tabs Navigation */}
      <div className="bg-[#111827] border border-[#1e293b] rounded-xl overflow-hidden">
        <div className="flex overflow-x-auto border-b border-[#1e293b] scrollbar-thin scrollbar-thumb-[#f59e0b]/20 scrollbar-track-transparent">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-4 whitespace-nowrap transition-all duration-200 relative ${
                  isActive ? 'text-[#f59e0b] bg-[#f59e0b]/5' : 'text-[#94a3b8] hover:text-white hover:bg-[#0d1117]/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
                {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,0.5)]" />}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Barra de herramientas */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[#94a3b8]">
              {(() => {
                const Icon = TABS.find(t => t.id === activeTab)?.icon || Table;
                return <Icon className="w-5 h-5" />;
              })()}
              <p className="text-sm">{TABS.find(t => t.id === activeTab)?.description}</p>
              {activeTab === 'historico' && (
                <span className="ml-2 text-xs bg-[#1e293b] px-2 py-1 rounded-full">
                  {compras.length} filas
                </span>
              )}
            </div>
          </div>

          {numRows === 0 ? (
            <div className="text-center py-16">
              <Table className="w-16 h-16 mx-auto mb-4 text-[#64748b]" />
              <p className="text-[#64748b]">No hay datos en esta tabla</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#1e293b]">
              <table className="w-full text-sm">
                <thead className="bg-[#0d1117] sticky top-0">
                  <tr>
                    {datosTabla[0]?.map((header: string, idx: number) => (
                      <th
                        key={idx}
                        onClick={() => activeTab === 'historico' && ['fecha', 'tienda', 'producto', 'cantidad', 'precio', 'total'].includes(header.toLowerCase()) && handleSort(header.toLowerCase() as SortField)}
                        className={`px-4 py-3 text-left font-semibold text-white whitespace-nowrap border-b-2 border-[#f59e0b] cursor-pointer select-none ${
                          activeTab === 'historico' && ['fecha', 'tienda', 'producto', 'cantidad', 'precio', 'total'].includes(header.toLowerCase()) ? 'hover:bg-[#f59e0b]/10' : ''
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          {header}
                          {activeTab === 'historico' && ['fecha', 'tienda', 'producto', 'cantidad', 'precio', 'total'].includes(header.toLowerCase()) && (
                            sortField === header.toLowerCase() && (
                              sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            )
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]">
                  {datosTabla.slice(1).map((row: any[], rowIdx: number) => {
                    // Log solo las primeras 2 filas para no saturar
                    if (rowIdx < 2) {
                      console.log(`🔵 Fila ${rowIdx}:`, row);
                      console.log(`🔵 Longitud de fila ${rowIdx}:`, row.length, 'cabeceras:', datosTabla[0]?.length);
                    }

                    // Si la fila tiene muchas celdas vacías consecutivas, puede ser un problema de datos
                    const celdasVaciasConsecutivas = row.reduce((count, cell, idx) => {
                      if ((cell === '' || cell === null || cell === undefined) && idx < row.length - 1) {
        // Verificar si las siguientes también están vacías
        let consecutivas = 1;
        for (let i = idx + 1; i < Math.min(idx + 5, row.length); i++) {
          if (row[i] === '' || row[i] === null || row[i] === undefined) {
            consecutivas++;
          } else {
            break;
          }
        }
        if (consecutivas >= 3) {
          return count + consecutivas;
        }
      }
      return count;
    }, 0);

    if (celdasVaciasConsecutivas > 3 && rowIdx < 2) {
      console.warn(`⚠️ Fila ${rowIdx} tiene ${celdasVaciasConsecutivas} celdas vacías consecutivas - puede ser un problema de estructura de datos`);
    }

    return (
      <tr key={rowIdx} className="hover:bg-[#0d1117]/50 transition-colors">
        {row.map((cell: string | number, cellIdx: number) => {
          // Log del tipo de dato de la celda
          if (rowIdx < 2 && cellIdx < 8) {
            console.log(`🔍 Celda [${rowIdx},${cellIdx}]:`, {
              valor: cell,
              tipo: typeof cell,
              esArray: Array.isArray(cell),
              cabecera: datosTabla[0]?.[cellIdx]
            });
          }

          // Si es un array, unir los elementos
          let cellValue = cell;
          if (Array.isArray(cell)) {
            cellValue = cell.join(' ').trim();
            if (rowIdx < 2) {
              console.log(`⚠️ Celda [${rowIdx},${cellIdx}] es array:`, cell, `→ unido: "${cellValue}"`);
            }
          }

          // Para Precio x Producto, manejar productos vacíos
          if (activeTab === 'precio_producto' && cellIdx === 1) {
            // Columna PRODUCTO - si está vacío, buscar en la fila actual
            if (!cellValue || cellValue === '' || cellValue === '0') {
              // Intentar construir el producto de las primeras columnas
              const partesProducto = [];
              for (let i = 0; i < Math.min(5, row.length); i++) {
                const val = row[i];
                if (val && val !== '' && val !== '0' && i !== 0) { // Saltar ID
                  let strVal = Array.isArray(val) ? val.join(' ').trim() : String(val).trim();
                  if (strVal && strVal.match(/^\d+$/)) {
                    // Si es solo números, puede ser parte de un producto split
                    partesProducto.push(strVal);
                  } else if (strVal && !strVal.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    // No es una fecha, agregar
                    partesProducto.push(strVal);
                  }
                }
              }
              if (partesProducto.length > 0) {
                cellValue = partesProducto.join(' ');
                console.log(`📊 Reconstruido producto para fila ${rowIdx}:`, cellValue);
              }
            }
          }

          // Si está vacío y no es la última columna, ocultar
          if ((cellValue === '' || cellValue === null || cellValue === undefined) && cellIdx < row.length - 1) {
            // Verificar si hay datos después de esta celda vacía
            const hayDatosDespues = row.slice(cellIdx + 1).some(c =>
              c !== '' && c !== null && c !== undefined
            );
            if (!hayDatosDespues && cellIdx > 3) {
              // Si no hay datos después y estamos más allá de la columna 4, ocultar
              return null;
            }
          }

          const cellStr = String(cellValue).trim();
          const numValue = parseFloat(cellStr);
          const isNumber = !isNaN(numValue) && cellStr !== '' && cellValue !== null;

          // Determinar si es una columna de precio (basado en la cabecera)
          const cabecera = datosTabla[0]?.[cellIdx] || '';
          const cabeceraLower = String(cabecera).toLowerCase();
          const esPrecio = cabeceraLower.includes('precio') || cabeceraLower.includes('total') || cabeceraLower.includes('suma') || cabeceraLower.includes('costo') || cabeceraLower.match(/^\d{2}\/\d{2}\/\d{4}$/);

          // Detectar si es columna de fecha por cabecera
          const esColumnaFecha = cabeceraLower.includes('fecha') || cabeceraLower === 'fech' || cabeceraLower === 'date';

          // Detectar si es una fecha (formato dd/mm/yyyy o similar)
          const esFechaPorContenido = !isNumber && (
            cellStr.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/) || // dd/mm/yyyy o dd-mm-yyyy
            (cellStr.match(/^\d{4}\-\d{2}-\d{2}$/) && !isNaN(Date.parse(cellStr))) // yyyy-mm-dd
          );

          const esFecha = esColumnaFecha || esFechaPorContenido;

          // Log cuando detectamos una fecha
          if (esFecha && rowIdx < 2) {
            console.log(`📅 Celda [${rowIdx},${cellIdx}]: "${cellStr}" → detectada como fecha (cabecera: "${cabecera}", columnaFecha: ${esColumnaFecha}, porContenido: ${esFechaPorContenido})`);
          }

          let displayValue: string | number = cellValue;
          let className = 'text-[#94a3b8]';

          if (esFecha) {
            // Formatear fecha
            const fecha = parsearFecha(cellStr);
            displayValue = formatearFecha(fecha);
            className = 'text-white';
            if (rowIdx < 2) {
              console.log(`📅 Fecha formateada: "${cellStr}" → "${displayValue}"`);
            }
          } else if (isNumber) {
            // Formatear número
            if (esPrecio || cabeceraLower === 'cantidad') {
              displayValue = numValue.toFixed(2).replace('.00', '');
              className = 'text-white font-mono';
            } else {
              displayValue = numValue.toFixed(2).replace('.00', '');
            }
          }

          // Alineación: precios a la derecha, todo lo demás a la izquierda
          const alignClass = esPrecio ? 'text-right' : 'text-left';

          return (
            <td key={cellIdx} className={`px-4 py-3 whitespace-nowrap ${alignClass}`}>
              <span className={className}>
                {displayValue || '-'}
              </span>
            </td>
          );
        })}
      </tr>
    );
  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function parsearFecha(fecha: string | Date): Date {
  if (fecha instanceof Date) return isNaN(fecha.getTime()) ? new Date() : fecha;
  if (!fecha || typeof fecha !== 'string') {
    console.log('⚠️ Fecha inválida (vacía o no string):', fecha);
    return new Date();
  }

  console.log('📅 Parseando fecha:', fecha);

  if (fecha.includes('/')) {
    const partes = fecha.split('/');
    console.log('📅 Partes de fecha:', partes);
    if (partes.length === 3) {
      const [dia, mes, anio] = partes.map(p => parseInt(p.trim(), 10));
      console.log('📅 Día:', dia, 'Mes:', mes, 'Año:', anio);
      if (!isNaN(dia) && !isNaN(mes) && !isNaN(anio)) {
        const date = new Date(anio, mes - 1, dia);
        console.log('✅ Fecha parseada:', date);
        return date;
      }
    }
  }

  const parsed = new Date(fecha);
  console.log('📅 Fecha parseada con Date():', parsed);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function excluirFilaResumen(descripcion: string): boolean {
  if (!descripcion) return true;
  const descripcionLower = descripcion.toLowerCase().trim();

  // Excluir si está vacía después de trim
  if (descripcionLower === '') return true;

  // Excluir palabras clave de resumen
  const exclusiones = ['suma total', 'total general', 'total', 'subtotal', 'sub-total', 'iva', 'vat', 'tax', 'base imponible', 'base', 'recargo', 'equivalencia', 'devolución', 'devolucion', 'devoluc', '-'];

  return exclusiones.some(exclusion => descripcionLower.includes(exclusion));
}
