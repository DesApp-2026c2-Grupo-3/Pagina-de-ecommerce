import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCategories, getProductoDetalle } from "../services/productService";
import type { ProductIngredient, ProductoBackend } from "../types/product";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";

// Cuánto por encima de lo incluido en la receta se puede pedir de un insumo agregable
// (ej. cantidadBase 1 feta de queso -> se puede llegar hasta 1 + 3 = 4 fetas).
const EXTRA_MAX_INCREMENTO = 3;

function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductoBackend | undefined>(undefined);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  // Personalización basada en la receta: insumoId -> cantidad final elegida.
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [isPersonalizeOpen, setPersonalizeOpen] = useState(false);
  const { addItem } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setCantidades({});
    setPersonalizeOpen(false);

    Promise.all([getProductoDetalle(Number(id)), getCategories()])
      .then(([producto, categorias]) => {
        setProduct(producto);

        const categoria = categorias.find((c) => c.id === producto.categoriaId);
        setCategoryName(categoria?.nombre ?? "");

        const iniciales: Record<number, number> = {};
        for (const ing of producto.ingredientes ?? []) {
          iniciales[ing.insumoId] = ing.cantidadBase;
        }
        setCantidades(iniciales);
      })
      // Si el producto no existe, el backend responde 404 y se muestra "Producto no encontrado"
      .catch(() => setProduct(undefined))
      .finally(() => setLoading(false));
  }, [id]);

  const ingredients = product?.ingredientes ?? [];
  const structuralIngredients = ingredients.filter(
    (i) => !i.esRemovible && !i.esAgregable,
  );
  const controllableIngredients = ingredients.filter(
    (i) => i.esRemovible || i.esAgregable,
  );

  function cantidadDe(ing: ProductIngredient) {
    return cantidades[ing.insumoId] ?? ing.cantidadBase;
  }

  function stepDe(ing: ProductIngredient) {
    // Cantidades no enteras (ej. 0.5 kg de papas) se tratan como on/off en un solo paso.
    return Number.isInteger(ing.cantidadBase) ? 1 : ing.cantidadBase;
  }

  function minDe(ing: ProductIngredient) {
    return ing.esRemovible ? 0 : ing.cantidadBase;
  }

  function maxDe(ing: ProductIngredient) {
    return ing.esAgregable ? ing.cantidadBase + EXTRA_MAX_INCREMENTO : ing.cantidadBase;
  }

  function updateCantidad(ing: ProductIngredient, next: number) {
    const clamped = Math.min(maxDe(ing), Math.max(minDe(ing), next));
    setCantidades((prev) => ({ ...prev, [ing.insumoId]: clamped }));
  }

  const extraPrice = ingredients.reduce((sum, ing) => {
    const extra = Math.max(0, cantidadDe(ing) - ing.cantidadBase);
    return sum + extra * ing.precioComercial;
  }, 0);
  const unitPrice = Number(product?.precio ?? 0) + extraPrice;

  const touchedIngredients = ingredients.filter(
    (ing) => cantidadDe(ing) !== ing.cantidadBase,
  );

  // Texto para mostrar la personalización, ej: ["Sin Cebolla", "Extra Queso x1 (+$500)"]
  function buildSelectedOptions(): string[] {
    return touchedIngredients.map((ing) => {
      const cantidad = cantidadDe(ing);
      if (cantidad === 0) return `Sin ${ing.nombre}`;
      if (cantidad < ing.cantidadBase) return `${ing.nombre} x${cantidad}`;
      const extra = cantidad - ing.cantidadBase;
      const costoExtra = extra * ing.precioComercial;
      return `Extra ${ing.nombre} x${extra}${
        costoExtra > 0 ? ` (+$${costoExtra.toLocaleString("es-AR")})` : ""
      }`;
    });
  }

  function buildPersonalizaciones() {
    return touchedIngredients.map((ing) => ({
      insumoId: ing.insumoId,
      cantidad: cantidadDe(ing),
    }));
  }

  function agregarAlCarrito() {
    if (!product?.disponible) return false;
    addItem(product, 1, buildSelectedOptions(), {
      unitPrice,
      personalizaciones: buildPersonalizaciones(),
    });
    return true;
  }

  function handleAddToCart() {
    if (agregarAlCarrito()) {
      showToast(`${product!.nombre} se agregó al carrito`);
    }
  }

  function handleBuyNow() {
    if (agregarAlCarrito()) {
      navigate("/carrito");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-24 text-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-24 text-center">
        <h1 className="text-3xl font-extrabold text-brand-dark">
          Producto no encontrado
        </h1>
        <p className="text-gray-600">
          El producto que buscás no existe o ya no está disponible.
        </p>
        <Link
          to="/"
          className="rounded-full bg-brand-red px-6 py-3 font-bold text-white transition-opacity hover:opacity-90"
        >
          Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Link
        to="/catalogo"
        className="inline-block font-semibold text-brand-red hover:underline"
      >
        ← Volver al catálogo
      </Link>
      <div className="mt-6 flex min-h-[70vh] items-center">
      <div className="grid grid-cols-1 items-center justify-items-center gap-10 md:grid-cols-2">
        

      <div className="mt-6 grid grid-cols-1 gap-10 md:grid-cols-2">
        <img
          src={product.imagen}
          alt={product.nombre}
          className="h-72 w-full rounded-2xl bg-brand-cream object-contain md:h-96"
        />
        

        <div className="flex flex-col items-center">
          {categoryName && (
            <span className="mr-auto rounded-full bg-brand-red px-3 py-1 text-sm font-bold text-white">
              {categoryName}
            </span>
          )}

          <h1 className="mt-3 text-3xl font-extrabold text-brand-dark sm:text-4xl">
            {product.nombre}
          </h1>
          <p className="mt-4 text-gray-600">{product.descripcion}</p>

          {product.disponible && controllableIngredients.length > 0 && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setPersonalizeOpen(true)}
                className="rounded-full border border-brand-red px-4 py-2 text-sm font-bold text-brand-red transition-colors hover:bg-brand-red hover:text-white"
              >
                Personalizar ingredientes ✏️
              </button>
              {touchedIngredients.length > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  {buildSelectedOptions().join(" · ")}
                </p>
              )}
            </div>
          )}

          <div className="mt-6">
            <span className="text-3xl font-extrabold text-brand-red">
              ${unitPrice.toLocaleString("es-AR")}
            </span>
          </div>
          {!product.disponible && (
            <p className="mt-2 font-semibold text-gray-500">
              No disponible por el momento
            </p>
          )}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!product.disponible}
              className="rounded-full bg-brand-red px-6 py-3 font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:opacity-100"
            >
              {product.disponible ? "Agregar al carrito" : "No disponible"}
            </button>
            {product.disponible && (
              <button
                type="button"
                onClick={handleBuyNow}
                className="rounded-full bg-brand-dark px-6 py-3 font-bold text-white transition-opacity hover:opacity-90"
              >
                Comprar ahora
              </button>
            )}
          </div>
        </div>
        </div>
      </div>

      <Modal
        isOpen={isPersonalizeOpen}
        onClose={() => setPersonalizeOpen(false)}
        title="Personalizar ingredientes"
        subtitle="Ajustá la cantidad de cada ingrediente a tu gusto."
      >
        <div className="flex flex-col gap-5">
          {structuralIngredients.length > 0 && (
            <div>
              <p className="text-sm font-bold text-brand-dark">Incluye</p>
              <p className="mt-1 text-sm text-gray-600">
                {structuralIngredients.map((i) => i.nombre).join(", ")}
              </p>
            </div>
          )}

          <div className="flex flex-col divide-y divide-brand-dark/10">
            {controllableIngredients.map((ing) => {
              const cantidad = cantidadDe(ing);
              const step = stepDe(ing);
              const min = minDe(ing);
              const max = maxDe(ing);
              const extra = Math.max(0, cantidad - ing.cantidadBase);
              return (
                <div
                  key={ing.insumoId}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-semibold text-brand-dark">{ing.nombre}</p>
                    {ing.esAgregable && ing.precioComercial > 0 && (
                      <p className="text-xs text-gray-500">
                        +${ing.precioComercial.toLocaleString("es-AR")} c/u extra
                        {extra > 0
                          ? ` · +$${(extra * ing.precioComercial).toLocaleString("es-AR")}`
                          : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label={`Sacar ${ing.nombre}`}
                      onClick={() => updateCantidad(ing, cantidad - step)}
                      disabled={cantidad <= min}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-dark/20 font-bold text-brand-dark transition-colors hover:border-brand-red hover:text-brand-red disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-bold text-brand-dark">
                      {cantidad}
                    </span>
                    <button
                      type="button"
                      aria-label={`Agregar ${ing.nombre}`}
                      onClick={() => updateCantidad(ing, cantidad + step)}
                      disabled={cantidad >= max}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-dark/20 font-bold text-brand-dark transition-colors hover:border-brand-red hover:text-brand-red disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setPersonalizeOpen(false)}
            className="mt-2 rounded-full bg-brand-red px-6 py-3 font-bold text-white transition-opacity hover:opacity-90"
          >
            Listo
          </button>
        </div>
      </Modal>
    </div>
    </div>
  );
}

export default ProductDetail;