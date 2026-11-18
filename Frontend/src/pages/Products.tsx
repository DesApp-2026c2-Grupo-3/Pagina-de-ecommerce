import { useEffect, useMemo, useRef, useState } from "react";
import ProductCard from "../components/home/ProductCard";
import { getCategories, getProducts } from "../services/productService";
import type { Category, ProductoBackend } from "../types/product";
import { MapPin, Search, SearchX, Grid2X2, LayoutGrid, List } from "lucide-react";
import CategoryFilter from "../components/catalogo/CategoryFilter";
import SubcategoriaFilter from "../components/catalogo/SubcategoriaFilter";
import Pagination from "../components/catalogo/Pagination";
import AvisoCierreSucursal from "../components/sucursal/AvisoCierreSucursal";
import CategoryIcon from "../components/icons/CategoryIcon";
import { estiloDeCategoria } from "../config/categorias";
import { armarGrupos, perteneceAlGrupo, ubicarCategoria } from "../config/gruposCatalogo";
import { useZona } from "../context/ZonaContext";
import { useSearchParams } from "react-router-dom";
import { type VistaProducto } from "../components/home/ProductCard";


// Productos por página: 8 entra justo en 2 filas de 4 (o 4 de 2) sin dejar huecos
const POR_PAGINA = 8;

const STYLES = {
  page: "min-h-screen bg-brand-cream text-brand-dark",
  heroBand: "bg-brand-dark px-4 pb-20 pt-10 text-brand-cream",
  heroContainer: "mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-6",
  heroTitle: "font-display text-5xl font-extrabold tracking-tight sm:text-6xl",
  heroHighlight: "text-brand-red",
  heroSubtitle: "mt-2 text-brand-cream/70",
  heroPinIcon: "mr-1.5 inline h-4 w-4 align-[-2px] text-brand-mustard",
  searchLabel: "flex min-h-12 w-full items-center gap-2 rounded-full bg-brand-cream px-5 text-brand-dark sm:max-w-sm",
  searchIcon: "h-5 w-5 shrink-0",
  searchInput: "min-w-0 flex-1 bg-transparent text-base placeholder:text-brand-muted focus:outline-none",

  bodyContainer: "mx-auto max-w-7xl px-4 pb-16",
  categoryFilterWrapper: "-mt-9",
  subcategoriaWrapper: "flex w-full justify-center",
  searchStatus: "mt-4 text-sm font-semibold text-brand-muted",

  emptyCard:
    "mx-auto mt-10 flex max-w-xl flex-col items-center gap-4 rounded-3xl border-2 border-brand-dark bg-white px-6 py-12 text-center",
  emptyBadge: "grid h-16 w-16 -rotate-6 place-items-center rounded-2xl bg-brand-mustard",
  emptyTitle: "font-display text-3xl font-extrabold tracking-tight",
  emptyText: "text-brand-muted",
  emptyBtn:
    "inline-flex min-h-12 items-center rounded-full bg-brand-red px-6 font-bold text-white transition-transform hover:-translate-y-0.5",

  seccionesList: "mt-5 flex flex-col gap-10",

  seccionTitle: "scroll-mt-28 mb-5 flex items-center gap-3 font-display text-3xl font-extrabold tracking-tight",
  seccionIconBadge: "grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 border-brand-dark",
  seccionCount: "text-base font-bold text-brand-muted",
  gridSeccion: "bf-escalonado grid grid-cols-1 gap-3 min-[580px]:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4",
  gridPaginado: "bf-escalonado mt-10 grid grid-cols-1 gap-3 min-[580px]:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4",
  paginationStatus: "mt-4 text-center text-sm text-brand-muted",
} as const;

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


  const [vista, setVista] = useState<VistaProducto>(() =>
    typeof window !== "undefined" && window.innerWidth < 580 ? "lista" : "cuadricula",
  );

  const gridClass =
    vista === "lista"
      ? "bf-escalonado mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4"
      : vista === "mosaico"
        ? "bf-escalonado mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5"
        : "bf-escalonado mt-6 grid grid-cols-1 gap-4 min-[580px]:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4";


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
    // Hasta que no llegan los productos no hay grupos con contenido: no se corrige nada (ni se toca la dirección)
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
    <div className={STYLES.page}>
      {/* Banda oscura con título y buscador */}
      <section className={STYLES.heroBand}>
        <div className={STYLES.heroContainer}>
          <div>
            <h1 className={STYLES.heroTitle}>
              El <span className={STYLES.heroHighlight}>menú</span>
            </h1>
            <p className={STYLES.heroSubtitle}>
              {zona ? (
                <>
                  <MapPin className={STYLES.heroPinIcon} />
                  Mostrando lo disponible en <b className="text-brand-cream">{zona.sucursalNombre}</b>
                </>
              ) : (
                "Elegí una categoría o buscá tu producto favorito."
              )}
            </p>
          </div>

          <div className="flex w-full flex-col items-end gap-2 min-[840px]:max-w-sm">
            <label className="flex min-h-12 w-full items-center gap-2 rounded-full bg-brand-cream px-5 text-brand-dark">
              <Search className={STYLES.searchIcon} />
              <span className="sr-only">Buscar producto</span>
              <input
                type="search"
                value={search}  
                onChange={(event) => setSearch(event.target.value)}
                placeholder="¿Qué te pinta? Buscá…"
                className={STYLES.searchInput}
              />
            </label>


            <div
              role="group"
              aria-label="Tipo de vista"
              className="flex items-center gap-1.5 pr-2 text-xs font-bold text-brand-cream/70"
            >
              <span>Vista:</span>
              {(
                [
                  { id: "lista", label: "Vista lista", Icono: List },
                  { id: "cuadricula", label: "Vista tarjetas", Icono: LayoutGrid },
                  { id: "mosaico", label: "Vista mosaico compacto", Icono: Grid2X2 },
                ] as const
              ).map(({ id, label, Icono }) => {
                const activa = vista === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setVista(id)}
                    aria-pressed={activa}
                    aria-label={label}
                    title={label}
                    className={`p-1 transition-colors ${activa ? "text-brand-mustard" : "text-brand-cream/50 hover:text-brand-cream"
                      }`}
                  >
                    <Icono className="h-4 w-4" strokeWidth={activa ? 2.6 : 2} />
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      <div className={STYLES.bodyContainer}>
        {/* Grupos: barra blanca montada sobre la banda. Con una búsqueda en curso ninguno queda marcado (-1) */}
        <div className={STYLES.categoryFilterWrapper}>
          <CategoryFilter
            categorias={gruposVisibles.map((g) => g.categoria)}
            seleccionada={buscando ? -1 : grupo?.categoria.id ?? null}
            onSeleccionar={elegirGrupoDesdeChips}
          />
        </div>

        {/* Subcategorías centradas + selector minimalista "Vista: [icono] [icono] [icono]" a la derecha */}
        <div className="mt-4 flex flex-col gap-2 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div className="hidden md:block" aria-hidden="true" />

          {!buscando && subgrupos.length > 0 && (
            <div className="mt-2 flex w-full justify-center">
              <SubcategoriaFilter
                subgrupos={subgrupos.map((s) => ({
                  slug: s.slug,
                  nombre: nombreCorto(s.categoria.nombre, grupo?.categoria.nombre ?? ""),
                }))}
                seleccionado={sub?.slug ?? null}
                onSeleccionar={elegirSub}
              />
            </div>
          )}

        </div>



        {buscando && (
          <p role="status" className={STYLES.searchStatus}>
            Buscando “{busqueda.trim()}” en todo el menú
          </p>
        )}

        {sucursalCerrada && <AvisoCierreSucursal sucursal={zona?.sucursalNombre} className="mt-6" />}

        {filteredProducts.length === 0 ? (
          categoriasListas && (
            <div className={STYLES.emptyCard}>
              <span className={STYLES.emptyBadge}>
                <SearchX className="h-8 w-8" />
              </span>
              <p className={STYLES.emptyTitle}>No encontramos productos</p>
              <p className={STYLES.emptyText}>Probá con otra categoría o cambiá la búsqueda.</p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setBusqueda("");
                  elegirGrupo(null);
                }}
                className={STYLES.emptyBtn}
              >
                Ver todo el menú
              </button>
            </div>
          )
        ) : enSecciones ? (
          // ---------- Todo el grupo, en secciones: una por subcategoría ----------
          <div key={grupo?.slug} className={STYLES.seccionesList}>
            {secciones.map((seccion) => {
              const estilo = seccion.estilo;
              return (
                <section key={seccion.slug} aria-labelledby={`seccion-${seccion.slug}`}>
                  <h2 id={`seccion-${seccion.slug}`} className={STYLES.seccionTitle}>
                    <span className={`${STYLES.seccionIconBadge} ${estilo.fondo}`}>
                      <CategoryIcon icono={estilo.icono} className="h-6 w-6" />
                    </span>
                    {seccion.nombre}
                    <span className={STYLES.seccionCount}>({seccion.productos.length})</span>
                  </h2>
                  <div className={gridClass}>
                    {seccion.productos.map((product, i) => (
                      <ProductCard key={product.id} product={product} indice={i} vista={vista} />
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
            <div key={`${grupo?.slug}-${subSlug}-${busqueda}-${pagina}`} className={gridClass}>
              {mostrados.map((product, i) => (
                <ProductCard key={product.id} product={product} indice={i} vista={vista} />
              ))}
            </div>


            <Pagination paginaActual={pagina} totalPaginas={totalPaginas} onCambiar={cambiarPagina} />
            <p role="status" className={STYLES.paginationStatus}>
              Mostrando {desde + 1}–{desde + mostrados.length} de {filteredProducts.length} productos
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default Products;

