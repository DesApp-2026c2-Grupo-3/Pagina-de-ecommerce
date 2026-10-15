import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/home/ProductCard";
import { getCategories, getProducts } from "../services/productService";
import type { Category, ProductoBackend } from "../types/product";
import { MapPin, Search, SearchX } from "lucide-react";
import CategoryFilter from "../components/catalogo/CategoryFilter";
import Pagination from "../components/catalogo/Pagination";
import { useZona } from "../context/ZonaContext";
import { useSearchParams } from "react-router-dom";

function Products() {
  const [products, setProducts] = useState<ProductoBackend[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchParams] = useSearchParams();
  // Si viene del Home con ?categoria=3, arranca filtrado
  const [selectedCategory, setSelectedCategory] = useState<number | null>(() => {
  const id = Number(searchParams.get("categoria"));
    return id > 0 ? id : null;
  });  
  const [search, setSearch] = useState("");
    // El buscador filtra cuando dejás de escribir: así las tarjetas no se reaniman con cada letra
  const [busqueda, setBusqueda] = useState("");
  const { zona } = useZona();

  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;

  // Los productos se vuelven a pedir si el cliente cambia de zona
  useEffect(() => {
    getProducts(zona?.sucursalId).then(setProducts);
  }, [zona?.sucursalId]);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  // Volver a la página 1 si cambia cualquier filtro o la zona
  useEffect(() => {
    setCurrentPage(1);
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

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const startIndex = (currentPage - 1) * productsPerPage;
  const currentProducts = filteredProducts.slice(
    startIndex,
    startIndex + productsPerPage
  );

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
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
                  Mostrando lo disponible en <b className="text-brand-cream">{zona.sucursalNombre}</b>
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
          <CategoryFilter categorias={categories} seleccionada={selectedCategory} onSeleccionar={setSelectedCategory} />
        </div>

        {filteredProducts.length === 0 ? (
          <div className="mx-auto mt-10 flex max-w-xl flex-col items-center gap-4 rounded-3xl border-2 border-brand-dark bg-white px-6 py-12 text-center">
            <span className="grid h-16 w-16 -rotate-6 place-items-center rounded-2xl bg-brand-mustard">
              <SearchX className="h-8 w-8" />
            </span>
            <p className="font-display text-3xl font-extrabold tracking-tight">No encontramos productos</p>
            <p className="text-brand-muted">Probá con otra categoría o cambiá la búsqueda.</p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCategory(null);
              }}
              className="inline-flex min-h-12 items-center rounded-full bg-brand-red px-6 font-bold text-white transition-transform hover:-translate-y-0.5"
            >
              Ver todo el menú
            </button>
          </div>
        ) : (
          <>
            {/* La key cambia con cada filtro: la grilla se vuelve a armar y las tarjetas entran de nuevo */}
            <div
              key={`${selectedCategory}-${busqueda}-${currentPage}`}
              className="bf-escalonado mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {currentProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <Pagination paginaActual={currentPage} totalPaginas={totalPages} onCambiar={goToPage} />
          </>
        )}
      </div>
    </div>
  );
}

   export default Products;