import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { MotivoCancelacion } from "../../types/reporte.types";

/* =========================================================
   ¿POR QUÉ SE CANCELAN?
   Ranking de los motivos que escribe el admin al cancelar.
   Cada motivo conocido trae una acción para mejorarlo
   (reponer stock, revisar el radio de entrega, ver dónde se atrasa...).
   Los motivos escritos a mano que no encajan se juntan en "Otros".
   ========================================================= */

type Props = {
  motivos: MotivoCancelacion[];
  // Sucursal que se está mirando (la elegida o la del admin); undefined = todas
  sucursalId?: number;
  esMaster: boolean;
  // Lleva a la pestaña "Estados", donde se ve en qué etapa se atrasan los pedidos
  onVerAtrasos: () => void;
};

type Accion = { texto: string; a?: string; onClick?: () => void };

type MotivoConocido = {
  // Palabras que lo identifican (sin tildes ni mayúsculas)
  claves: string[];
  nombre: string;
  consejo: string;
  accion: (p: Props) => Accion | null;
};

const MOTIVOS_CONOCIDOS: MotivoConocido[] = [
  {
    claves: ["stock"],
    nombre: "Sin stock",
    consejo: "Reponer antes de que se agote.",
    accion: ({ sucursalId }) => ({
      texto: "Ver stock",
      a: sucursalId ? `/admin/sucursales/${sucursalId}/stock` : "/admin/sucursales",
    }),
  },
  {
    claves: ["cocina", "demora"],
    nombre: "Demora en la cocina",
    consejo: "Revisar en qué etapa se traban los pedidos.",
    accion: ({ onVerAtrasos }) => ({ texto: "Ver dónde se atrasa", onClick: onVerAtrasos }),
  },
  {
    claves: ["direccion", "zona", "entregar"],
    nombre: "Fuera de zona",
    consejo: "Revisar el radio de entrega.",
    accion: ({ esMaster }) => (esMaster ? { texto: "Revisar radio de entrega", a: "/admin/parametros" } : null),
  },
  {
    claves: ["repartidor"],
    nombre: "Sin repartidor",
    consejo: "Sumar repartidores en los horarios pico.",
    accion: () => ({ texto: "Ver repartidores", a: "/admin/repartidores" }),
  },
  {
    claves: ["cerrar", "cerrado", "cerro"],
    nombre: "Local cerrado",
    consejo: "Revisar los horarios de la sucursal.",
    accion: ({ sucursalId }) =>
      sucursalId ? { texto: "Revisar horarios", a: `/admin/sucursales/editar/${sucursalId}` } : null,
  },
];

const MAXIMO_FILAS = 5;

const normalizar = (texto: string) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const conocidoDe = (motivo: string) =>
  MOTIVOS_CONOCIDOS.find((m) => m.claves.some((clave) => normalizar(motivo).includes(clave))) ?? null;

type Fila = { nombre: string; detalle: string | null; cantidad: number; conocido: MotivoConocido | null };

// Junta los motivos que significan lo mismo (ej. dos textos distintos de "sin stock")
function armarFilas(motivos: MotivoCancelacion[]): Fila[] {
  const filas = new Map<string, Fila>();
  for (const m of motivos) {
    const conocido = conocidoDe(m.motivo);
    const clave = conocido?.nombre ?? m.motivo;
    const fila = filas.get(clave) ?? { nombre: clave, detalle: conocido ? null : m.motivo, cantidad: 0, conocido };
    fila.cantidad += m.cantidad;
    filas.set(clave, fila);
  }
  const ordenadas = [...filas.values()].sort((a, b) => b.cantidad - a.cantidad);
  if (ordenadas.length <= MAXIMO_FILAS) return ordenadas;

  // Lo que no entra se junta en "Otros"
  const otros = ordenadas.slice(MAXIMO_FILAS - 1).reduce((total, f) => total + f.cantidad, 0);
  return [...ordenadas.slice(0, MAXIMO_FILAS - 1), { nombre: "Otros", detalle: null, cantidad: otros, conocido: null }];
}

export default function MotivosCancelacion(props: Props) {
  const filas = armarFilas(props.motivos);
  const total = filas.reduce((suma, f) => suma + f.cantidad, 0);

  if (total === 0) {
    return (
      <p className="m-4 rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 sm:m-5">
        Todavía no hay cancelaciones con motivo en este período.
      </p>
    );
  }

  const primero = filas[0];
  const porcentaje = (cantidad: number) => Math.round((cantidad / total) * 100);

  return (
    <div className="space-y-4 p-4 sm:p-5">
      {/* La conclusión, en una línea */}
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
        El <strong>{porcentaje(primero.cantidad)} %</strong> de las cancelaciones es por{" "}
        <strong>{primero.nombre.toLowerCase()}</strong>.{" "}
        {primero.conocido && <span>{primero.conocido.consejo}</span>}
      </p>

      <ol className="space-y-3">
        {filas.map((fila, i) => {
          const accion = fila.conocido?.accion(props) ?? null;
          const pct = porcentaje(fila.cantidad);
          return (
            <li key={fila.nombre} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <div className="min-w-0 sm:w-48">
                <p className="font-semibold text-gray-900">
                  <span className="mr-1.5 text-red-700">{i + 1}.</span>
                  {fila.nombre}
                </p>
                {fila.detalle && (
                  <p className="truncate text-xs text-gray-500" title={fila.detalle}>
                    {fila.detalle}
                  </p>
                )}
              </div>

              {/* Barra proporcional */}
              <div className="flex flex-1 items-center gap-3">
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-red-500 transition-[width] duration-700"
                    style={{ width: `${Math.max(pct, 3)}%` }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right text-sm text-gray-700">
                  <strong>{pct} %</strong> · {fila.cantidad.toLocaleString("es-AR")}
                </span>
              </div>

              <div className="sm:w-52 sm:text-right">
                {accion?.a && (
                  <Link to={accion.a} className="inline-flex items-center gap-1 text-sm font-semibold text-orange-700 hover:underline">
                    {accion.texto} <ArrowRight size={14} />
                  </Link>
                )}
                {accion?.onClick && (
                  <button
                    type="button"
                    onClick={accion.onClick}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-orange-700 hover:underline"
                  >
                    {accion.texto} <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
