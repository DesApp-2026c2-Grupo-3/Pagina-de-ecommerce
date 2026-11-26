import { Check, ChevronDown } from 'lucide-react'
import type { MouseEvent } from 'react'
import { useMenuDesplegable } from '../../hooks/useMenuDesplegable'

export interface OpcionMenu {
  valor: string
  texto: string
  // Contador ya formateado («99+») y el número real para el lector de pantalla
  contador?: { visible: string; real: number }
}

interface Props {
  // Base de los ids (únicos por pantalla)
  id: string
  // Etiqueta accesible: «Filtrar por etapa», «Elegir sucursal»
  etiqueta: string
  opciones: OpcionMenu[]
  valor: string
  onChange: (valor: string) => void
  className?: string
}

function textoBoton(opcion: OpcionMenu | undefined): string {
  if (!opcion) return 'Elegir'
  return opcion.contador ? `${opcion.texto} (${opcion.contador.visible})` : opcion.texto
}

// Desplegable propio de los filtros (plan de filtros v2). Reemplaza la lista nativa del <select>,
// que dibuja el navegador y puede salirse de la pantalla. El panel queda siempre dentro:
// ancho entre el del botón (o 16 rem) y la pantalla menos 2 rem, alto con tope, y abre hacia arriba si hace falta.
export default function MenuFiltro({ id, etiqueta, opciones, valor, onChange, className = '' }: Props) {
  const indiceElegido = opciones.findIndex((o) => o.valor === valor)
  const menu = useMenuDesplegable({
    total: opciones.length,
    indiceElegido,
    onElegir: (indice) => onChange(opciones[indice].valor),
  })
  const idEtiqueta = `${id}-etiqueta`
  const idLista = `${id}-lista`
  const idOpcion = (i: number) => `${id}-opcion-${i}`
  const { haciaArriba, alineadoIzquierda } = menu.ubicacion

  return (
    <div ref={menu.refRaiz} className={`relative ${className}`}>
      <span id={idEtiqueta} className="sr-only">
        {etiqueta}
      </span>
      <button
        ref={menu.refBoton}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={menu.abierto}
        aria-controls={idLista}
        aria-labelledby={idEtiqueta}
        aria-activedescendant={menu.abierto && menu.activo >= 0 ? idOpcion(menu.activo) : undefined}
        onClick={() => (menu.abierto ? menu.cerrar() : menu.abrir())}
        onKeyDown={menu.alPresionar}
        className={`flex h-11 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 text-left ${
          menu.abierto ? 'border-action ring-2 ring-orange-200' : 'border-gray-300'
        }`}
      >
        <span className="min-w-0 truncate">{textoBoton(opciones[indiceElegido])}</span>
        <ChevronDown size={18} aria-hidden="true" className={`shrink-0 transition-transform ${menu.abierto ? 'rotate-180' : ''}`} />
      </button>

      {menu.abierto && (
        // overscroll-contain: al llegar al final de la lista, el scroll no pasa a la página de fondo
        <ul
          ref={menu.refPanel}
          id={idLista}
          role="listbox"
          aria-labelledby={idEtiqueta}
          className={`absolute z-40 max-h-[min(60vh,22rem)] w-[max(100%,16rem)] max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain rounded-lg border border-gray-200 bg-white p-1 shadow-lg ${
            haciaArriba ? 'bottom-full mb-1' : 'top-full mt-1'
          } ${alineadoIzquierda ? 'left-0' : 'right-0'}`}
        >
          {opciones.map((opcion, i) => {
            const elegida = i === indiceElegido
            return (
              <li
                key={opcion.valor}
                id={idOpcion(i)}
                role="option"
                aria-selected={elegida}
                title={opcion.texto}
                // Sin robar el foco del botón (activedescendant)
                onMouseDown={(e: MouseEvent<HTMLLIElement>) => e.preventDefault()}
                onMouseEnter={() => menu.setActivo(i)}
                onClick={() => menu.elegir(i)}
                className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-3 ${
                  elegida ? 'font-semibold text-orange-800' : 'text-gray-800'
                } ${i === menu.activo ? 'bg-orange-50' : ''}`}
              >
                <span className="w-4 shrink-0">{elegida && <Check size={16} aria-hidden="true" />}</span>
                {/* El texto largo baja a otra línea: en pantallas táctiles no hay title para leerlo entero */}
                <span className="min-w-0 flex-1 break-words py-2 leading-snug">{opcion.texto}</span>
                {opcion.contador && (
                  <>
                    <span aria-hidden="true" className="shrink-0 rounded-full bg-gray-100 px-2 text-xs font-semibold text-gray-700">
                      {opcion.contador.visible}
                    </span>
                    <span className="sr-only">({opcion.contador.real})</span>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
