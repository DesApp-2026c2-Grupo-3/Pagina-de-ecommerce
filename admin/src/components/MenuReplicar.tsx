import { useState, useRef, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import { DIAS_SEMANA, type DiaSemana } from "../types/sucursal.types";
import { ETIQUETA_DIA } from "../utils/horario";

interface MenuReplicarProps {
  diaActual: DiaSemana;
  onReplicar: (diasDestino: DiaSemana[]) => void;
}

export default function MenuReplicar({
  diaActual,
  onReplicar,
}: MenuReplicarProps) {
  const [abierto, setAbierto] = useState(false);

  // Estado inicial: todos los días en falso (sin chequear por defecto)
  const [seleccionados, setSeleccionados] = useState<
    Record<DiaSemana, boolean>
  >(() => {
    const inicial: Record<string, boolean> = {};
    DIAS_SEMANA.forEach((d) => {
      inicial[d] = false;
    });
    return inicial as Record<DiaSemana, boolean>;
  });

  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera (clickaway)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setAbierto(false);
      }
    }
    if (abierto) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [abierto]);

  const toggleDia = (dia: DiaSemana) => {
    setSeleccionados((prev) => ({ ...prev, [dia]: !prev[dia] }));
  };

  const seleccionarTodos = (marcar: boolean) => {
    const nuevo: Record<string, boolean> = {};
    DIAS_SEMANA.forEach((d) => {
      if (d !== diaActual) nuevo[d] = marcar;
    });
    setSeleccionados(nuevo as Record<DiaSemana, boolean>);
  };

  const handleConfirmar = () => {
    const destinos = DIAS_SEMANA.filter((d) => seleccionados[d]);
    if (destinos.length > 0) {
      onReplicar(destinos);
      setAbierto(false);
    }
  };

  // Validar si hay al menos un día seleccionado para habilitar el botón de aplicar
  const haySeleccionados = Object.values(seleccionados).some(Boolean);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="inline-flex items-center gap-1.5 rounded border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-action transition-colors shadow-sm"
        title="Replicar horario en otros días"
      >
        <Copy size={13} />
        <span>Replicar...</span>
      </button>

      {abierto && (
        <div className="absolute right-0 bottom-full mb-2 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="mb-2 flex items-center justify-between border-b pb-2">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Replicar {ETIQUETA_DIA[diaActual]} a:
            </span>
            <div className="flex gap-2 text-[10px]">
              <button
                type="button"
                onClick={() => seleccionarTodos(true)}
                className="text-action hover:underline font-semibold"
              >
                Todos
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={() => seleccionarTodos(false)}
                className="text-gray-500 hover:underline"
              >
                Ninguno
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto py-1">
            {DIAS_SEMANA.filter((d) => d !== diaActual).map((dia) => (
              <label
                key={dia}
                className="flex cursor-pointer items-center justify-between rounded p-1.5 text-xs hover:bg-gray-50 text-gray-700"
              >
                <span>{ETIQUETA_DIA[dia]}</span>
                <input
                  type="checkbox"
                  checked={seleccionados[dia]}
                  onChange={() => toggleDia(dia)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 h-4 w-4"
                />
              </label>
            ))}
          </div>

          <div className="mt-3 border-t pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="rounded px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmar}
              disabled={!haySeleccionados}
              className="inline-flex items-center gap-1 rounded bg-action px-3 py-1 text-xs font-semibold text-white hover:bg-orange-600 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={12} />
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
