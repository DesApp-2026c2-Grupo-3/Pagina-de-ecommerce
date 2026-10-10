import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/home/ProductCard";
import { getCategories, getProducts } from "../services/productService";
import type { Category, ProductoBackend } from "../types/product";
import { MapPin, Search } from "lucide-react";
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
  }, [selectedCategory, search, zona?.sucursalId]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

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
  }, [products, selectedCategory, search]);

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
          <div className="mt-16 flex flex-col items-center gap-2 text-center">
            <img src="/Otros/notFound.png" alt="" className="h-56" />
            <p className="font-display text-2xl font-extrabold">No encontramos productos con ese criterio.</p>
            <p className="text-brand-muted">Probá con otra categoría o cambiá la búsqueda.</p>
          </div>
        ) : (
          <>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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