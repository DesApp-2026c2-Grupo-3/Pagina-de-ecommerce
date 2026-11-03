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
import { getMenu } from "../services/menuService";
import { armarGrupos } from "../config/menuDinamico";
import type { MenuApi } from "../types/menu";
import {
  GRUPO_INICIAL_SLUG,
  GRUPOS_CATALOGO,
  grupoDeCategoria,
  subgrupoDeCategoria,
  ubicarEnGrupo,
  type GrupoCatalogo,
  type SubgrupoCatalogo,
} from "../config/gruposCatalogo";
import { useZona } from "../context/ZonaContext";
import { useSearchParams } from "react-router-dom";

// Productos por página: 8 entra justo en 2 filas de 4 (o 4 de 2) sin dejar huecos
const POR_PAGINA = 8;

// Los disponibles primero
const disponiblesPrimero = (a: ProductoBackend, b: ProductoBackend) =>
  Number(b.disponible) - Number(a.disponible);

function Products() {
  const [products, setProducts] = useState<ProductoBackend[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();

  // ?grupo=cafeteria&sub=pasteleria → ese grupo y esa subcategoría. Sin nada → Combos.
  // (?categoria=3, que usa el Home, se traduce a su grupo cuando llegan las categorías)
  // El grupo se guarda por su slug (lo mismo en el menú fijo de respaldo y en el que arma el master)
  const [grupoSlug, setGrupoSlug] = useState<string | null>(() => {
    const slug = searchParams.get("grupo");
    if (slug === "todos") return null;
    return slug ?? GRUPO_INICIAL_SLUG;
  });
  const [subSlug, setSubSlug] = useState<string | null>(() => searchParams.get("sub"));

  // El menú lo arma el master desde el panel; si no se puede cargar, se usa el menú fijo de respaldo
  const [menu, setMenu] = useState<MenuApi | null>(null);

  // Los grupos del catálogo: los del master (cuando ya llegaron el menú, las categorías y los productos) o el menú fijo de respaldo
  const grupos = useMemo(
    () => (menu && categories.length > 0 ? armarGrupos(menu, categories, products) : GRUPOS_CATALOGO),
    [menu, categories, products],
  );

  function elegirGrupo(id: number | null, sub: string | null = null) {
    const slug = id === null ? null : grupos.find((g) => g.id === id)?.slug ?? null;
    setGrupoSlug(slug);
    setSubSlug(sub);
    const params: Record<string, string> = {};
    params.grupo = slug ?? "todos";
    if (sub) params.sub = sub;
    setSearchParams(params, { replace: true });
  }

  function elegirSub(sub: string | null) {
    setSubSlug(sub);
    const slug = grupoSlug;
    const params: Record<string, string> = {};
    if (slug) params.grupo = slug;
    if (sub) params.sub = sub;
    setSearchParams(params, { replace: true });
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
    getMenu().then(setMenu).catch(() => setMenu(null));
  }, []);

  // Viene del Home con ?categoria=3: se abre el grupo que la contiene (y su botón, si tiene uno propio).
  // Se resuelve una sola vez, cuando ya llegaron las categorías.
  const categoriaDelHomeResuelta = useRef(false);
  useEffect(() => {
    if (categoriaDelHomeResuelta.current || categories.length === 0) return;
    categoriaDelHomeResuelta.current = true;
    const categoriaId = Number(searchParams.get("categoria"));
    const categoria = categories.find((c) => c.id === categoriaId);
    const grupoDeLaCategoria = categoria && grupoDeCategoria(categoria.nombre, grupos);
    if (categoria && grupoDeLaCategoria) {
      elegirGrupo(grupoDeLaCategoria.id, subgrupoDeCategoria(grupoDeLaCategoria, categoria.nombre)?.slug ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, grupos]);

  // Volver a la primera página si cambia cualquier filtro o la zona
  useEffect(() => {
    setPagina(1);
  }, [grupoSlug, subSlug, busqueda, zona?.sucursalId]);

  useEffect(() => {
    const timer = setTimeout(() => setBusqueda(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const grupo: GrupoCatalogo | null = grupos.find((g) => g.slug === grupoSlug) ?? null;
  const grupoId = grupo?.id ?? null;
  const sub: SubgrupoCatalogo | null = grupo?.subgrupos?.find((s) => s.slug === subSlug) ?? null;
  const query = busqueda.trim().toLowerCase();
  // Buscando, se busca en TODO el menú: no importa el grupo ni el botón en el que estés parado
  const buscando = query !== "";

  // Id de categoría del backend → nombre
  const nombrePorId = useMemo(() => new Map(categories.map((c) => [c.id, c.nombre])), [categories]);
  const categoriasListas = categories.length > 0;

  // Todo el catálogo se ve en el menú (salsas incluidas, al final); hasta tener las categorías no se muestra nada
  const visibles = useMemo(() => (categoriasListas ? products : []), [products, categoriasListas]);

  // Cada producto con el subgrupo en el que cae dentro del grupo elegido
  const delGrupo = useMemo(() => {
    if (!grupo) return visibles.map((product) => ({ product, subgrupo: undefined as SubgrupoCatalogo | undefined }));
    return visibles.flatMap((product) => {
      const ubicacion = ubicarEnGrupo(grupo, product.nombre, nombrePorId.get(product.categoriaId) ?? "");
      return ubicacion.pertenece ? [{ product, subgrupo: ubicacion.subgrupo }] : [];
    });
  }, [visibles, grupo, nombrePorId]);

  const filteredProducts = useMemo(() => {
    const lista = buscando
      ? visibles.filter((p) => p.nombre.toLowerCase().includes(query))
      : delGrupo.filter((e) => !sub || e.subgrupo?.slug === sub.slug).map((e) => e.product);
    return [...lista].sort(disponiblesPrimero);
  }, [buscando, visibles, delGrupo, sub, query]);

  // Los grupos con subcategorías muestran "Todo" en secciones (sin paginación), salvo que se esté buscando
  const enSecciones = Boolean(grupo?.porSecciones && grupo.subgrupos && !sub && !buscando);
  const secciones = enSecciones
    ? grupo!.subgrupos!
        .map((s) => ({
          ...s,
          productos: delGrupo
            .filter((e) => e.subgrupo?.slug === s.slug)
            .map((e) => e.product)
            .sort(disponiblesPrimero),
        }))
        .filter((s) => s.productos.length > 0)
    : [];

  const totalPaginas = Math.ceil(filteredProducts.length / POR_PAGINA);
  const desde = (pagina - 1) * POR_PAGINA;
  const mostrados = filteredProducts.slice(desde, desde + POR_PAGINA);

  function cambiarPagina(nueva: number) {
    setPagina(nueva);
    window.scrollTo(0, 0);
  }

  // Los grupos, con la forma que espera el filtro de chips
  const gruposVisibles = useMemo(
  () =>
    grupos.filter((g) =>
      visibles.some((product) => {
        const categoria = nombrePorId.get(product.categoriaId) ?? "";
        return ubicarEnGrupo(g, product.nombre, categoria).pertenece;
      })
    ),
    [grupos, visibles, nombrePorId],
  );

  const opcionesFiltro = gruposVisibles.map((g) => ({
    id: g.id,
    nombre: g.nombre,
  }));

  useEffect(() => {
    if (grupoId !== null && !gruposVisibles.some((g) => g.id === grupoId)) {
      elegirGrupo(gruposVisibles[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gruposVisibles, grupoId]);

  // Elegir un grupo con una búsqueda en curso la cierra y abre ese grupo
  function elegirGrupoDesdeChips(id: number | null) {
    setSearch("");
    setBusqueda("");
    elegirGrupo(id);
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
            categorias={opcionesFiltro}
            seleccionada={buscando ? -1 : grupoId}
            onSeleccionar={elegirGrupoDesdeChips}
          />
        </div>

        {/* Subcategorías del grupo elegido */}
        {!buscando && grupo?.subgrupos && (
          <SubcategoriaFilter subgrupos={grupo.subgrupos} seleccionado={sub?.slug ?? null} onSeleccionar={elegirSub} />
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
          <div key={`${grupoId}`} className="mt-10 flex flex-col gap-12">
            {secciones.map((seccion) => {
              const estilo = estiloDeCategoria({ nombre: seccion.estilo, icono: seccion.icono, fondo: seccion.fondo });
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
          // ---------- Grilla con paginación: Hamburguesas, Combos, Todos, una subcategoría o una búsqueda ----------
          <>
            {/* La key cambia con cada filtro o página: la grilla se vuelve a armar */}
            <div
              key={`${grupoId}-${subSlug}-${busqueda}-${pagina}`}
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
