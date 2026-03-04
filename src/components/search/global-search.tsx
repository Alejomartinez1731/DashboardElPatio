'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, FileText, Store, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSheetData } from '@/hooks/useSheetData';
import { searchSimple, getUniqueTiendas } from '@/lib/search';
import { SearchResult } from '@/lib/search';
import { cn } from '@/lib/utils';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const { compras } = useSheetData(
    [{ id: 'base_datos', sheetName: 'base_datos' as const, dataKey: 'base_de_datos' }]
  );
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input cuando se abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  // Buscar cuando cambia el query
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const searchResults = searchSimple(query, compras);
    setResults(searchResults);
    setSelectedIndex(-1);
  }, [query, compras]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, results, selectedIndex, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleResultClick = (result: SearchResult) => {
    onClose();
    // Navegar a la ubicación apropiada según el tipo
    if (result.type === 'compra' || result.type === 'producto') {
      router.push('/dashboard');
    } else if (result.type === 'tienda') {
      router.push('/proveedores');
    }
  };

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'compra':
      case 'producto':
        return Package;
      case 'tienda':
        return Store;
      default:
        return FileText;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'compra':
        return 'Compra';
      case 'producto':
        return 'Producto';
      case 'tienda':
        return 'Tienda';
      default:
        return 'Otro';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Search Container */}
      <div
        ref={containerRef}
        className="relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar productos, tiendas..."
            className="flex-1 bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-muted rounded-md transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <div className="text-xs text-muted-foreground">
            ESC para cerrar
          </div>
        </div>

        {/* Results */}
        {query.trim().length >= 2 && (
          <div className="max-h-[60vh] overflow-y-auto">
            {results.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No se encontraron resultados para "{query}"
              </div>
            ) : (
              <div className="p-2">
                {results.map((result, index) => {
                  const Icon = getIcon(result.type);
                  const isSelected = index === selectedIndex;

                  return (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className={cn(
                        'w-full flex items-start gap-3 px-3 py-2 rounded-lg transition-colors',
                        isSelected
                          ? 'bg-primary/20 text-primary'
                          : 'hover:bg-muted/50 text-foreground'
                      )}
                    >
                      <div className={cn(
                        'p-2 rounded-md mt-0.5',
                        isSelected
                          ? 'bg-primary/30 text-primary'
                          : 'bg-muted text-muted-foreground'
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{result.titulo}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {getTypeLabel(result.type)}
                          </span>
                        </div>
                        {result.descripcion && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {result.descripcion}
                          </p>
                        )}
                        {result.metadata?.fecha && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(result.metadata.fecha).toLocaleDateString('es-ES')}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {results.length} resultado{results.length !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              ↑↓ para navegar · Enter para seleccionar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Trigger button para abrir la búsqueda global
 */
export function GlobalSearchTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border border-border rounded-lg hover:border-primary/50 transition-all duration-200 text-foreground"
      >
        <Search className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Buscar...
        </span>
        <kbd className="px-1.5 py-0.5 text-xs bg-background border border-border rounded text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <GlobalSearch isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
