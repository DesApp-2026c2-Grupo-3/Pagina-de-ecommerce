import { useState } from "react";
import type { ClienteInactivo } from "../../types/reporte.types";

/* =========================================================
   EL BUZÓN DE "TE EXTRAÑAMOS"
   Cada cliente que dejó de pedir es un sobre en una pila.
   El elegido asoma entero, abre la solapa y a la derecha se ve
   la vista previa de la notificación que le llegaría.
   Las notificaciones todavía están en desarrollo: los botones
   quedan listos y, si no se les pasa "onNotificar", solo avisan.
   ========================================================= */

type Props = {
  clientes: ClienteInactivo[];
  dias: number;
  onNotificar?: (usuarioIds: number[]) => void;
};

const SOBRES_A_LA_VISTA = 10;

const nombreCompleto = (cliente: ClienteInactivo) =>
  [cliente.nombre, cliente.apellido].filter(Boolean).join(" ");

/* La estampilla se oscurece cuanto más tiempo lleva sin pedir */
function colorEstampilla(dias: number) {
  if (dias >= 90) return "#b91c1c";
  if (dias >= 60) return "#ea580c";
  return "#f59e0b";
}

export default function BuzonInactivos({ clientes, dias, onNotificar }: Props) {
  const [elegidoId, setElegidoId] = useState<number | null>(null);
  const [verTodos, setVerTodos] = useState(false);
  const [aviso, setAviso] = useState("");

  const visibles = verTodos ? clientes : clientes.slice(0, SOBRES_A_LA_VISTA);
  const ocultos = clientes.length - visibles.length;

  const indiceElegido = Math.max(
    0,
    visibles.findIndex((cliente) => cliente.usuarioId === elegidoId),
  );
  const elegido = visibles[indiceElegido];

  const notificar = (destinatarios: ClienteInactivo[]) => {
    if (onNotificar) {
      onNotificar(destinatarios.map((cliente) => cliente.usuarioId));
      return;
    }

    setAviso(
      destinatarios.length === 1
        ? `Las notificaciones están en desarrollo. Cuando estén listas, este botón le va a enviar la notificación a ${destinatarios[0].nombre}.`
        : `Las notificaciones están en desarrollo. Cuando estén listas, este botón les va a avisar a los ${destinatarios.length} clientes.`,
    );
  };

  return (
    <div className="flex flex-wrap items-start gap-6 p-4 sm:p-6">
      <div className="flex min-w-0 flex-[999_1_420px] flex-col gap-3.5">
        {/* Total + notificar a todos */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <p aria-live="polite" className="text-[15px] text-gray-700">
            <strong className="text-[22px] text-gray-900">{clientes.length}</strong>{" "}
            {clientes.length === 1 ? "cliente no pide" : "clientes no piden"} hace más de{" "}
            <strong>{dias} días</strong>.
          </p>

          <button
            type="button"
            onClick={() => notificar(clientes)}
            className="min-h-10 rounded-xl border border-orange-300 bg-white px-3.5 text-[13px] font-bold text-orange-700 shadow-[0_1px_3px_rgba(17,24,39,0.12)] transition hover:bg-orange-50"
          >
            Notificar a todos ({clientes.length})
          </button>
        </div>

        {/* El buzón con los sobres apilados */}
        <div className="rounded-[18px] bg-gray-800 px-3 pt-3 pb-5 shadow-[inset_0_3px_10px_rgba(0,0,0,0.45),0_4px_0_#111827] sm:px-[18px] sm:pt-[18px] sm:pb-[22px]">
          <div
            aria-hidden="true"
            className="mx-[30%] mb-4 h-2.5 rounded-md bg-gray-900 shadow-[inset_0_2px_3px_rgba(0,0,0,0.6)]"
          />

          <div className="mx-auto flex max-w-[420px] flex-col">
            {visibles.map((cliente, indice) => {
              const abierto = indice === indiceElegido;

              // Cada sobre tapa al anterior y deja ver solo su franja de arriba.
              // El elegido se separa (para que la solapa abierta no tape al de arriba)
              // y el que le sigue se corre para que asome entero.
              const margen = abierto
                ? "mt-11"
                : indice === 0
                  ? "mt-0"
                  : indice === indiceElegido + 1
                    ? "-mt-2"
                    : "-mt-[62px]";

              return (
                <button
                  key={cliente.usuarioId}
                  type="button"
                  aria-pressed={abierto}
                  aria-label={`${nombreCompleto(cliente)}: hace ${cliente.diasSinPedir} días que no pide`}
                  onClick={() => {
                    setElegidoId(cliente.usuarioId);
                    setAviso("");
                  }}
                  className={`rep-sobre relative h-[104px] shrink-0 rounded-md bg-[#fffdf7] text-left shadow-[0_-2px_6px_rgba(0,0,0,0.25),0_3px_8px_rgba(0,0,0,0.35)] ${margen} ${
                    abierto
                      ? "rep-sobre-abierto outline-[3px] outline-offset-[3px] outline-amber-400"
                      : ""
                  }`}
                  style={{
                    zIndex: indice + 1,
                    // El elegido se corre un poco hacia afuera de la pila
                    transform: abierto ? "translateX(14px) rotate(-1deg)" : "none",
                  }}
                >
                  {/* Solapa */}
                  <span
                    aria-hidden="true"
                    className="rep-solapa absolute inset-x-0 top-0 z-[2] h-[54px] bg-[#f3efe4] [clip-path:polygon(0_0,100%_0,50%_100%)]"
                  />

                  {/* Estampilla con los días */}
                  <span
                    aria-hidden="true"
                    className="absolute top-[6px] right-2.5 z-[3] flex h-[34px] w-[30px] rotate-[4deg] items-center justify-center text-[10px] font-black text-white outline-2 -outline-offset-[3px] outline-white outline-dashed"
                    style={{ backgroundColor: colorEstampilla(cliente.diasSinPedir) }}
                  >
                    {cliente.diasSinPedir}
                  </span>

                  {/* Nombre escrito a mano */}
                  <span className="rep-manuscrita absolute top-1 right-14 left-3.5 z-[3] truncate text-[22px] font-bold text-blue-900">
                    {nombreCompleto(cliente)}
                  </span>

                  <span className="absolute inset-x-2 bottom-2 z-[3] truncate text-center text-[11px] font-semibold text-gray-500">
                    Último pedido hace {cliente.diasSinPedir} días
                    {cliente.sucursal && ` · ${cliente.sucursal}`}
                  </span>
                </button>
              );
            })}
          </div>

          {ocultos > 0 && (
            <button
              type="button"
              onClick={() => setVerTodos(true)}
              className="mx-auto mt-4 block min-h-10 rounded-xl px-4 text-sm font-semibold text-gray-200 underline-offset-4 hover:underline"
            >
              Ver {ocultos} {ocultos === 1 ? "sobre más" : "sobres más"}
            </button>
          )}
        </div>

        {/* Referencia de las estampillas */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-600" aria-hidden="true">
          <span className="flex items-center gap-1.5">
            <span className="h-3.5 w-3 bg-amber-500" />
            Menos de 60 días
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3.5 w-3 bg-orange-600" />
            De 60 a 90 días
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3.5 w-3 bg-red-700" />
            Más de 90 días
          </span>
        </div>
      </div>

      {/* Vista previa de la notificación */}
      <aside
        aria-label="Vista previa de la notificación"
        aria-live="polite"
        className="min-w-0 flex-[1_1_300px]"
      >
        <span className="mb-2 block text-xs font-bold tracking-[0.08em] text-gray-500">
          VISTA PREVIA DE LA NOTIFICACIÓN
        </span>

        <div
          key={elegido.usuarioId}
          className="rep-carta relative rounded bg-[#fffdf7] bg-[repeating-linear-gradient(180deg,transparent_0_29px,#dbeafe_29px_30px)] py-5 pr-5 pl-[34px] shadow-[0_2px_4px_rgba(0,0,0,0.08),0_16px_34px_rgba(0,0,0,0.14)]"
        >
          <span aria-hidden="true" className="absolute inset-y-0 left-[22px] w-0.5 bg-red-200" />

          <div className="rep-manuscrita text-[22px] leading-[30px] text-blue-900">
            <p>¡Hola, {elegido.nombre}!</p>
            <p>Hace un tiempito que no te vemos por BurgerFast y te extrañamos.</p>
            {elegido.productoFavorito ? (
              <p>
                ¿Se te antoja tu {elegido.productoFavorito} de siempre? Te esperamos con todo
                recién hecho.
              </p>
            ) : (
              <p>Te esperamos con todo recién hecho.</p>
            )}
            <p className="text-right">¡Volvé cuando quieras!</p>
          </div>

          <button
            type="button"
            onClick={() => notificar([elegido])}
            className="mt-3.5 inline-flex min-h-11 items-center rounded-xl bg-orange-500 px-4 text-sm font-bold text-white shadow-[0_4px_0_#c2410c,0_8px_16px_rgba(234,88,12,0.3)] transition hover:bg-orange-600 active:translate-y-0.5 active:shadow-[0_2px_0_#c2410c]"
          >
            Enviar notificación a {elegido.nombre}
          </button>
        </div>

        {aviso && (
          <p
            role="status"
            className="rep-subir mt-3.5 rounded-xl bg-blue-50 px-3 py-2.5 text-[13px] text-blue-800 ring-1 ring-blue-200"
          >
            {aviso}
          </p>
        )}
      </aside>
    </div>
  );
}