import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCategories, getProducts } from "../services/productService";
import type { ProductoBackend } from "../types/product";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";

function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductoBackend | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('')
  const { addItem } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
  setLoading(true)

  Promise.all([getProducts(), getCategories()])
    .then(([products, categories]) => {
      const foundProduct = products.find(
        (item) => item.id === Number(id)
      )

      setProduct(foundProduct)

      if (foundProduct) {
        const category = categories.find(
          (item) => item.id === foundProduct.categoriaId
        )

        setCategoryName(category?.nombre ?? '')
      }
    })
    .finally(() => setLoading(false))
}, [id])

  function handleAddToCart() {
    if (!product?.disponible) return 
    addItem(product, 1);
    showToast(`${product!.nombre} se agregó al carrito`);
  }

  function handleBuyNow() {
    if (!product?.disponible) return;
    addItem(product, 1);
    navigate("/carrito");
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
        to="/"
        className="inline-block font-semibold text-brand-red hover:underline"
      >
        ← Volver al catálogo
      </Link>
      
      <div className="mt-6 grid grid-cols-1 gap-10 md:grid-cols-2">

        <img
          src={product.imagen}
          alt={product.nombre}
          className="h-72 w-full rounded-2xl bg-brand-cream object-cover md:h-96"
        />

        <div className="flex flex-col">
          {categoryName && (
            <span className="mr-auto rounded-full bg-brand-red px-3 py-1 text-sm font-bold text-white">
              {categoryName}
            </span>
          )}

          <h1 className="mt-3 text-3xl font-extrabold text-brand-dark sm:text-4xl">
            {product.nombre}
          </h1>
          <p className="mt-4 text-gray-600">{product.descripcion}</p>

          <div className="mt-6">
            <span className="text-3xl font-extrabold text-brand-red">
              ${Number(product.precio).toLocaleString("es-AR")}
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
              {product.disponible ? 'Agregar al carrito' : 'No disponible'}
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
  );
}

export default ProductDetail;
