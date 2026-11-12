
import { useEffect, useState } from "react";
import { Bike } from "lucide-react";
import MensajeVacio from "../../components/MensajeVacio";
import { obtenerRepartidoresDisponibles } from "../../services/repartidorService";
import type { RepartidorDisponible } from "../../types/repartidor.types";

interface Props {
  viajeId: number;
  onClose: () => void;
  onSeleccionar: (repartidorId: number) => void;
  procesando?: boolean;
}

export default function ModalReasignarRepartidor({viajeId, onClose, onSeleccionar, procesando }: Props) {
  const [repartidores, setRepartidores] = useState<RepartidorDisponible[]>([]);
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;

    obtenerRepartidoresDisponibles(viajeId)
      .then((lista) => {
        if (!cancelado) setRepartidores(lista);
      })
      .catch((error) => {
        if (cancelado) return;

        setError(
          error instanceof Error
            ? error.message
            : "No se pudieron obtener los repartidores disponibles",
        );
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [viajeId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-reasignacion"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4">
          <h2
            id="titulo-reasignacion"
            className="text-xl font-bold text-gray-900"
          >
            Reasignar repartidor
          </h2>

          <p className="mt-1 text-sm text-gray-600">
            Elegí un repartidor disponible para hacerse cargo del viaje #{viajeId}.
          </p>
        </div>

        {cargando ? (
          <p className="py-6 text-center text-sm text-gray-600">
            Buscando repartidores disponibles...
          </p>
        ) : error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : repartidores.length === 0 ? (
          <MensajeVacio mensaje="No hay repartidores disponibles en esta sucursal." />
        ) : (
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {repartidores.map((repartidor) => (
              <button
                key={repartidor.id}
                type="button"
                onClick={() => setSeleccionado(repartidor.id)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
                  seleccionado === repartidor.id
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Bike size={20} className="shrink-0 text-gray-500" />

                <span className="font-medium text-gray-800">
                  {repartidor.nombre} {repartidor.apellido}
                </span>

                {seleccionado === repartidor.id && (
                  <span className="ml-auto text-sm font-semibold text-orange-600">
                    Seleccionado
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cerrar
          </button>

          <button type="button" disabled={seleccionado === null || cargando || !!error || procesando}
            onClick={() => {if (seleccionado !== null) onSeleccionar(seleccionado);}}

            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold 
            text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50">

              {procesando ? "Reasignando..." : "Confirmar reasignación"}
          </button>
        </div>
      </div>
    </div>
  );
}
