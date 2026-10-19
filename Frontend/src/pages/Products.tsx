import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/home/ProductCard";
import { getCategories, getProducts } from "../services/productService";
import type { Category, ProductoBackend } from "../types/product";
import { MapPin, Search, SearchX } from "lucide-react";
import CategoryFilter from "../components/catalogo/CategoryFilter";
import Pagination from "../components/catalogo/Pagination";
import AvisoCierreSucursal from "../components/sucursal/AvisoCierreSucursal";
import { useZona } from "../context/ZonaContext";
import { useSearchParams } from "react-router-dom";

// Productos por página: 8 entra justo en 2 filas de 4 (o 4 de 2) sin dejar huecos
const POR_PAGINA = 8;

function Products() {
  const [products, setProducts] = useState<ProductoBackend[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  // Si viene del Home con ?categoria=3, arranca filtrado
  const [selectedCategory, setSelectedCategory] = useState<number | null>(() => {
    const id = Number(searchParams.get("categoria"));
    return id > 0 ? id : null;
  });
  function elegirCategoria(id: number | null) {
    setSelectedCategory(id);
    setSearchParams(id ? { categoria: String(id) } : {}, { replace: true });
  }
  const [search, setSearch] = useState("");
  // El buscador filtra cuando dejás de escribir: así las tarjetas no se reaniman con cada letra
  const [busqueda, setBusqueda] = useState("");
  const { zona } = useZona();
  const sucursalCerrada = Boolean(zona && zona.sucursalAbierta === false);

  const [pagina, setPagina] = useState(1);
  // Los productos se vuelven a pedir si el cliente cambia de zona
  useEffect(() => {
    getProducts(zona?.sucursalId).then(setProducts);
  }, [zona?.sucursalId]);

  useEffect(() => {
    getCategories().then((cats) => {
      setCategories(cats);
      // Sin ?categoria en la URL, el catálogo arranca mostrando los combos
      if (!searchParams.get("categoria")) {
        const combos = cats.find((c) => c.nombre.trim().toLowerCase() === "combos");
        if (combos) setSelectedCategory(combos.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Volver a la primera página si cambia cualquier filtro o la zona
  useEffect(() => {
    setPagina(1);
  }, [selectedCategory, busqueda, zona?.sucursalId]);

  useEffect(() => {
    const timer = setTimeout(() => setBusqueda(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const filteredProducts = useMemo(() => {
    const query = busqueda.trim().toLowerCase();

    return products
      .filter((product) => {
        if (
          selectedCategory !== null &&
          product.categoriaId !== selectedCategory
        ) {
          return false;
        }

        if (query && !product.nombre.toLowerCase().includes(query)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => Number(b.disponible) - Number(a.disponible));
  }, [products, selectedCategory, busqueda]);

  const totalPaginas = Math.ceil(filteredProducts.length / POR_PAGINA);
  const desde = (pagina - 1) * POR_PAGINA;
  const mostrados = filteredProducts.slice(desde, desde + POR_PAGINA);

  function cambiarPagina(nueva: number) {
    setPagina(nueva);
    window.scrollTo(0, 0);
  }

  return (
    <div className="min-h-screen bg-brand-cream text-brand-dark">
      {/* Banda oscura con título y buscador */}
      <section className="bg-brand-dark px-4 pb-20 pt-10 text-brand-cream">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
              El <span className="text-brand-red">menú</span>
            </h1>
            <p className="mt-2 text-brand-cream/70">
              {zona ? (
                <>
                  <MapPin className="mr-1.5 inline h-4 w-4 align-[-2px] text-brand-mustard" />
                  Mostrando lo disponible en{" "}
                  <b className="text-brand-cream">{zona.sucursalNombre}</b>
                </>
              ) : (
                "Elegí una categoría o buscá tu producto favorito."
              )}
            </p>
          </div>

          <label className="flex min-h-12 w-full items-center gap-2 rounded-full bg-brand-cream px-5 text-brand-dark sm:max-w-sm">
            <Search className="h-5 w-5 shrink-0" />
            <span className="sr-only">Buscar producto</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="¿Qué te pinta? Buscá…"
              className="min-w-0 flex-1 bg-transparent text-base placeholder:text-brand-muted focus:outline-none"
            />
          </label>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-16">
        {/* Categorías: barra blanca montada sobre la banda */}
        <div className="-mt-9">
          <CategoryFilter categorias={categories} seleccionada={selectedCategory} onSeleccionar={elegirCategoria} />
        </div>

        {sucursalCerrada && (
          <AvisoCierreSucursal
            sucursal={zona?.sucursalNombre}
            className="mt-6"
          />
        )}

        {filteredProducts.length === 0 ? (
          <div className="mx-auto mt-10 flex max-w-xl flex-col items-center gap-4 rounded-3xl border-2 border-brand-dark bg-white px-6 py-12 text-center">
            <span className="grid h-16 w-16 -rotate-6 place-items-center rounded-2xl bg-brand-mustard">
              <SearchX className="h-8 w-8" />
            </span>
            <p className="font-display text-3xl font-extrabold tracking-tight">
              No encontramos productos
            </p>
            <p className="text-brand-muted">
              Probá con otra categoría o cambiá la búsqueda.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                elegirCategoria(null);
              }}
              className="inline-flex min-h-12 items-center rounded-full bg-brand-red px-6 font-bold text-white transition-transform hover:-translate-y-0.5"
            >
              Ver todo el menú
            </button>
          </div>
        ) : (
          <>
            {/* La key cambia con cada filtro o página: la grilla se vuelve a armar */}
            <div
              key={`${selectedCategory}-${busqueda}-${pagina}`}
              className="bf-escalonado mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {mostrados.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <Pagination paginaActual={pagina} totalPaginas={totalPaginas} onCambiar={cambiarPagina} />
            <p role="status" className="mt-4 text-center text-sm text-brand-muted">
              Mostrando {desde + 1}–{desde + mostrados.length} de {filteredProducts.length} productos
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default Products;