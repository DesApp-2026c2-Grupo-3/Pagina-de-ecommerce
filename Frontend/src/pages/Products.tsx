import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/home/ProductCard";
import { getCategories, getProducts } from "../services/productService";
import type { Category, ProductoBackend } from "../types/product";
import { Search,SkipBack, SkipForward, ArrowBigLeftDash, ArrowBigRightDash } from "lucide-react";
import { useZona } from "../context/ZonaContext";

function Products() {
  const [products, setProducts] = useState<ProductoBackend[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
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

  // Ventana de hasta 3 números, centrada en la página actual
  const maxButtons = 3;
  const windowSize = Math.min(maxButtons, totalPages);
  const windowStart = Math.max(
    1,
    Math.min(currentPage - 1, totalPages - maxButtons + 1)
  );
  const visiblePages = Array.from(
    { length: windowSize },
    (_, index) => windowStart + index
  );

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className="mx-auto px-10 py-10 min-h-screen
    bg-gradient-to-b from-orange-200 via-yellow-800 to-red-800"
    >
      <h1
        className="text-3xl font-extrabold sm:text-4xl
      bg-gradient-to-r from-stone-900 via-gray-800 to-red-700 bg-clip-text text-transparent w-fit"
      >
        Nuestro catálogo
      </h1>
      <p className="mt-2 text-gray-800">
        Elegí una categoría o buscá tu producto favorito.
      </p>
      {zona && (
        <p className="mt-1 text-sm font-semibold text-gray-800">
          📍 Mostrando lo disponible en {zona.sucursalNombre}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-wrap md:px-0 md:pb-0">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            aria-pressed={selectedCategory === null}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
              selectedCategory === null
                ? "border-brand-red bg-brand-red text-white"
                : "border-brand-dark/20 bg-white text-brand-dark hover:border-brand-red hover:text-brand-red"
            }`}
          >
            Todos
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(category.id)}
              aria-pressed={selectedCategory === category.id}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                selectedCategory === category.id
                  ? "border-brand-red bg-brand-red text-white"
                  : "border-brand-dark/20 bg-white text-brand-dark hover:border-brand-red hover:text-brand-red"
              }`}
            >
              {category.nombre}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar producto..."
            aria-label="Buscar producto"
            className="w-full rounded-full border border-brand-dark/20 bg-white py-2 pl-10 pr-4 text-brand-dark placeholder:text-gray-400 focus:border-brand-red focus:outline-none"
          />
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div
          className="mt-16 flex flex-col items-center gap-2 text-center
        text-[2rem]"
        >
          <img src="/Otros/notFound.png" alt="Buscado cosas" className="h-64" />
          <p className="font-semibold text-white">
            No encontramos productos con ese criterio.
          </p>
          <p className="text-[1rem] text-gray-100">
            Probá con otra categoría o cambiá la búsqueda.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {currentProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
  <div className="mt-8 flex items-center justify-center gap-2">
    <button
      type="button"
      onClick={() => goToPage(1)}
      disabled={currentPage === 1}
      aria-label="Primera página"
      className="rounded-full bg-white px-4 py-2 font-bold text-brand-dark
      transition-colors hover:text-white
      hover:bg-gradient-to-t hover:from-red-800 hover:to-red-400 border
      disabled:cursor-not-allowed disabled:opacity-40 " 
    >
      <SkipBack size={20}/>
    </button>

    <button
      type="button"
      onClick={() => goToPage(currentPage - 1)}
      disabled={currentPage === 1}
      aria-label="Página anterior"
      className="rounded-full bg-white px-4 py-2 font-bold text-brand-dark
      transition-colors hover:text-white
      hover:bg-gradient-to-t hover:from-red-800 hover:to-red-400 border
      disabled:cursor-not-allowed disabled:opacity-40"
    >
      <ArrowBigLeftDash size={20}/>
    </button>

    {visiblePages.map((page) => (
      <button
        key={page}
        type="button"
        onClick={() => goToPage(page)}
        aria-current={currentPage === page ? "page" : undefined}
        className={`h-10 w-10 rounded-full font-bold transition-colors hidden sm:block border ${
          currentPage === page
            ? "bg-gradient-to-t from-red-800 to-red-400 text-white"
            : "bg-white text-brand-dark hover:text-white hover:bg-gradient-to-t hover:from-red-800 hover:to-red-400 "
        }`}
      >
        {page}
      </button>
    ))}

    <button
      type="button"
      onClick={() => goToPage(currentPage + 1)}
      disabled={currentPage === totalPages}
      aria-label="Página siguiente"
      className="rounded-full bg-white px-4 py-2 font-bold text-brand-dark
      transition-colors hover:text-white
      hover:bg-gradient-to-t hover:from-red-800 hover:to-red-400 border
      disabled:cursor-not-allowed disabled:opacity-40"
    >
      <ArrowBigRightDash size={20}/>
    </button>

    <button
      type="button"
      onClick={() => goToPage(totalPages)}
      disabled={currentPage === totalPages}
      aria-label="Última página"
      className="rounded-full bg-white px-4 py-2 font-bold text-brand-dark
      transition-colors  hover:text-white
      hover:bg-gradient-to-t hover:from-red-800 hover:to-red-400 border
      disabled:cursor-not-allowed disabled:opacity-40"
    >
      <SkipForward size={20} />
    </button>
  </div>
)}
        </>
      )}
    </div>
  );
}

export default Products;