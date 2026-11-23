import { useEffect, useMemo, useRef, useState } from "react";
import ProductCard from "../components/home/ProductCard";
import { getCategories, getProducts } from "../services/productService";
import type { Category, ProductoBackend } from "../types/product";
import { MapPin, Search, SearchX } from "lucide-react";
import CategoryFilter from "../components/catalogo/CategoryFilter";
import SubcategoriaFilter from "../components/catalogo/SubcategoriaFilter";
import Pagination from "../components/catalogo/Pagination";
import AvisoCierreSucursal from "../components/sucursal/AvisoCierreSucursal";
import CategoryIcon from "../components/icons/CategoryIcon";
import { estiloDeCategoria } from "../config/categorias";
import { armarGrupos, perteneceAlGrupo, ubicarCategoria } from "../config/gruposCatalogo";
import { useZona } from "../context/ZonaContext";
import { useSearchParams } from "react-router-dom";

// Productos por página: 8 entra justo en 2 filas de 4 (o 4 de 2) sin dejar huecos
const POR_PAGINA = 8;

// Los disponibles primero
const disponiblesPrimero = (a: ProductoBackend, b: ProductoBackend) =>
  Number(b.disponible) - Number(a.disponible);

// Ícono y color de una sección: los de su subcategoría o, si no tiene propios, los de su grupo
function estiloDeSeccion(hija: Category, padre: Category) {
  const propio = estiloDeCategoria(hija);
  return propio.icono === "generico" ? estiloDeCategoria(padre) : propio;
}


// En el submenú, "Hamburguesas Carne" dentro de Hamburguesas se muestra "Carne": se saca el nombre del padre
function nombreCorto(hija: string, padre: string) {
  const resto = hija.replace(new RegExp(`^${padre}\\s+(de\\s+)?`, "i"), "").trim();
  return resto ? resto.charAt(0).toUpperCase() + resto.slice(1) : hija;
}

function Products() {
  const [products, setProducts] = useState<ProductoBackend[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();

  // ?grupo=hamburguesas&sub=hamburguesas-de-pollo → ese grupo y esa subcategoría. ?grupo=todos → todo el menú.
  // (?categoria=3, que usa el Home, se traduce a su grupo cuando llegan las categorías)
  // null = "Todos"; undefined = sin elegir: se abre el primer grupo (el que el admin puso primero)
  const [grupoSlug, setGrupoSlug] = useState<string | null | undefined>(() => {
    const slug = searchParams.get("grupo");
    if (slug === "todos") return null;
    return slug ?? undefined;
  });
  const [subSlug, setSubSlug] = useState<string | null>(() => searchParams.get("sub"));

  // El menú sale del árbol de categorías: las principales son los botones y sus hijas, el submenú
  const grupos = useMemo(() => armarGrupos(categories), [categories]);

  function elegirGrupo(slug: string | null, sub: string | null = null) {
    setGrupoSlug(slug);
    setSubSlug(sub);
    const params: Record<string, string> = { grupo: slug ?? "todos" };
    if (sub) params.sub = sub;
    setSearchParams(params, { replace: true });
  }

  function elegirSub(sub: string | null) {
    elegirGrupo(grupo?.slug ?? null, sub);
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
    getCategories().then(setCategories);
  }, []);

  // Viene del Home con ?categoria=3: se abre su grupo (y su subcategoría, si es una hija).
  // El parámetro se guarda al abrir la página (después otros efectos reescriben la dirección y lo pierden)
  // y se resuelve una sola vez, cuando ya llegaron las categorías.
  const categoriaDelHome = useRef(searchParams.get("categoria"));
  const categoriaDelHomeResuelta = useRef(false);
  useEffect(() => {
    if (categoriaDelHomeResuelta.current || grupos.length === 0) return;
    categoriaDelHomeResuelta.current = true;
    if (!categoriaDelHome.current) return;
    const ubicacion = ubicarCategoria(grupos, Number(categoriaDelHome.current));
    if (ubicacion) elegirGrupo(ubicacion.grupo.slug, ubicacion.subgrupo?.slug ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grupos]);

  // Volver a la primera página si cambia cualquier filtro o la zona
  useEffect(() => {
    setPagina(1);
  }, [grupoSlug, subSlug, busqueda, zona?.sucursalId]);

  useEffect(() => {
    const timer = setTimeout(() => setBusqueda(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const categoriasListas = categories.length > 0;
  // Hasta tener las categorías no se muestra nada
  const visibles = useMemo(() => (categoriasListas ? products : []), [products, categoriasListas]);

  // Solo los grupos que tienen algún producto
  const gruposVisibles = useMemo(
    () => grupos.filter((g) => visibles.some((p) => perteneceAlGrupo(g, p))),
    [grupos, visibles],
  );

  const grupo =
    (grupoSlug === undefined ? gruposVisibles[0] : gruposVisibles.find((g) => g.slug === grupoSlug)) ?? null;
  // Solo las subcategorías que tienen algún producto
  const subgrupos = grupo ? grupo.subgrupos.filter((s) => visibles.some((p) => p.categoriaId === s.categoria.id)) : [];
  const sub = subgrupos.find((s) => s.slug === subSlug) ?? null;

  const query = busqueda.trim().toLowerCase();
  // Buscando, se busca en TODO el menú: no importa el grupo ni el botón en el que estés parado
  const buscando = query !== "";

  // Los productos del grupo elegido (en "Todos", todos)
  const delGrupo = useMemo(
    () => (grupo ? visibles.filter((p) => perteneceAlGrupo(grupo, p)) : visibles),
    [visibles, grupo],
  );

  const filteredProducts = useMemo(() => {
    const lista = buscando
      ? visibles.filter((p) => p.nombre.toLowerCase().includes(query))
      : sub
        ? delGrupo.filter((p) => p.categoriaId === sub.categoria.id)
        : delGrupo;
    return [...lista].sort(disponiblesPrimero);
  }, [buscando, visibles, delGrupo, sub, query]);

  // Un grupo con submenú, en "Todos", se muestra dividido en secciones (una por subcategoría), sin paginación
  const enSecciones = Boolean(grupo && subgrupos.length > 0 && !sub && !buscando);
  const secciones = enSecciones
    ? subgrupos.map((s) => ({
        slug: s.slug,
        nombre: nombreCorto(s.categoria.nombre, grupo!.categoria.nombre),        
        estilo: estiloDeSeccion(s.categoria, grupo!.categoria),
        productos: delGrupo.filter((p) => p.categoriaId === s.categoria.id).sort(disponiblesPrimero),
      }))
    : [];

  const totalPaginas = Math.ceil(filteredProducts.length / POR_PAGINA);
  const desde = (pagina - 1) * POR_PAGINA;
  const mostrados = filteredProducts.slice(desde, desde + POR_PAGINA);

  function cambiarPagina(nueva: number) {
    setPagina(nueva);
    window.scrollTo(0, 0);
  }

  // Si el grupo de la dirección no existe (o no tiene productos en la zona), se abre el primero
  useEffect(() => {
    // Hasta que no llegan los productos no se corrige nada (ni se toca la dirección)
    if (visibles.length === 0) return;
    if (grupoSlug && !gruposVisibles.some((g) => g.slug === grupoSlug)) {
      elegirGrupo(gruposVisibles[0]?.slug ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gruposVisibles, grupoSlug]);

  // Elegir un grupo con una búsqueda en curso la cierra y abre ese grupo
  function elegirGrupoDesdeChips(id: number | null) {
    setSearch("");
    setBusqueda("");
    elegirGrupo(gruposVisibles.find((g) => g.categoria.id === id)?.slug ?? null);
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
        {/* Grupos: barra blanca montada sobre la banda. Con una búsqueda en curso ninguno queda marcado (-1) */}
        <div className="-mt-9">
          <CategoryFilter
            categorias={gruposVisibles.map((g) => g.categoria)}
            seleccionada={buscando ? -1 : grupo?.categoria.id ?? null}
            onSeleccionar={elegirGrupoDesdeChips}
          />
        </div>

        {/* Subcategorías del grupo elegido */}
        {!buscando && subgrupos.length > 0 && (
          <SubcategoriaFilter
            subgrupos={subgrupos.map((s) => ({ slug: s.slug, nombre: nombreCorto(s.categoria.nombre, grupo?.categoria.nombre ?? "") }))}            
            seleccionado={sub?.slug ?? null}
            onSeleccionar={elegirSub}
          />
        )}

        {buscando && (
          <p role="status" className="mt-4 text-sm font-semibold text-brand-muted">
            Buscando “{busqueda.trim()}” en todo el menú
          </p>
        )}

        {sucursalCerrada && (
          <AvisoCierreSucursal sucursal={zona?.sucursalNombre} className="mt-6" />
        )}

        {filteredProducts.length === 0 ? (
          categoriasListas && (
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
                  setBusqueda("");
                  elegirGrupo(null);
                }}
                className="inline-flex min-h-12 items-center rounded-full bg-brand-red px-6 font-bold text-white transition-transform hover:-translate-y-0.5"
              >
                Ver todo el menú
              </button>
            </div>
          )
        ) : enSecciones ? (
          // ---------- Todo el grupo, en secciones: una por subcategoría ----------
          <div key={grupo?.slug} className="mt-10 flex flex-col gap-12">
            {secciones.map((seccion) => {
              const estilo = seccion.estilo;
              return (
                <section key={seccion.slug} aria-labelledby={`seccion-${seccion.slug}`}>
                  <h2
                    id={`seccion-${seccion.slug}`}
                    className="scroll-mt-28 mb-5 flex items-center gap-3 font-display text-3xl font-extrabold tracking-tight"
                  >
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 border-brand-dark ${estilo.fondo}`}>
                      <CategoryIcon icono={estilo.icono} className="h-6 w-6" />
                    </span>
                    {seccion.nombre}
                    <span className="text-base font-bold text-brand-muted">({seccion.productos.length})</span>
                  </h2>
                  <div className="bf-escalonado grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {seccion.productos.map((product, i) => (
                      <ProductCard key={product.id} product={product} indice={i} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          // ---------- Grilla con paginación: un grupo sin submenú, una subcategoría, Todos o una búsqueda ----------
          <>
            {/* La key cambia con cada filtro o página: la grilla se vuelve a armar */}
            <div
              key={`${grupo?.slug}-${subSlug}-${busqueda}-${pagina}`}
              className="bf-escalonado mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {mostrados.map((product, i) => (
                <ProductCard key={product.id} product={product} indice={i} />
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
