import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { CLASE_INPUT, CLASE_LABEL } from "../ui/formulario";
import { Check, Save } from 'lucide-react';

const MAX_CARACTERES = 100;

const BOTON =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 border-brand-dark px-5 text-sm font-bold shadow-sticker transition-transform hover:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";
const BOTON_ICONO =
  "grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-brand-dark bg-white transition-transform hover:translate-y-0.5";

interface NotaCocinaProps {
  /** La nota ya guardada ('' si no hay). Solo esta viaja con el pedido. */
  guardada: string;
  onGuardar: (nota: string) => void;
}

// Nota para la cocina: oculta hasta que se pide, con Guardar/Descartar y, ya guardada, ver / editar / quitar
export default function NotaCocina({ guardada, onGuardar }: NotaCocinaProps) {
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState("");
  const [verCompleta, setVerCompleta] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const botonRef = useRef<HTMLButtonElement>(null);
  const eraEdicion = useRef(false);

  // Al abrir, el cursor va directo al texto
  useEffect(() => {
    if (editando) areaRef.current?.focus();
    else if (eraEdicion.current) botonRef.current?.focus();
    eraEdicion.current = editando;
  }, [editando]);

  function abrir() {
    setBorrador(guardada);
    setEditando(true);
  }

  // Descartar vuelve a lo último guardado (o a nada, si no había nota)
  function descartar() {
    setEditando(false);
    setBorrador("");
  }

  function guardar() {
    const nota = borrador.trim();
    if (!nota) return;
    onGuardar(nota);
    setVerCompleta(false);
    setEditando(false);
  }

  function quitar() {
    onGuardar("");
    setVerCompleta(false);
  }

  const contenedor = "w-full rounded-2xl border-2 border-brand-dark bg-white p-3";

  if (editando) {
    const sinGuardar = borrador.trim() !== "" && borrador.trim() !== guardada;
    return (
      <div className={contenedor}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
          <label htmlFor="nota-cocina" className={CLASE_LABEL}>
            Notas para la cocina
          </label>
          <span className="shrink-0 text-xs text-brand-muted">
            {borrador.length}/{MAX_CARACTERES}
          </span>
        </div>

        <textarea
          id="nota-cocina"
          ref={areaRef}
          value={borrador}
          onChange={(e) => setBorrador(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") descartar();
          }}
          maxLength={MAX_CARACTERES}
          placeholder="Ej.: sin cebolla, bien cocida..."
          rows={3}
          className={`${CLASE_INPUT} w-full resize-none`}
        />

        {sinGuardar && (
          <p className="mt-1 text-xs text-brand-muted">Todavía no está guardada: sin guardar no se envía con el pedido.</p>
        )}

        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={descartar}
            className={`${BOTON} bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-full transition-colors`}
            title="Descartar"
          >
            <Trash2 className="w-4 h-4" />Descartar
          </button>
          <button
            type="button"
            onClick={guardar} 
            className={`${BOTON} bg-green-50 text-green-600 hover:bg-green-100 p-2 rounded-full transition-colors`}
            title="Aceptar"
          >
            <Check className="w-4 h-4" />Guardar
          </button>


        </div>
      </div>
    );
  }

  if (guardada) {
    return (
      <div className={contenedor}>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1 self-center">
            <p className={CLASE_LABEL}>Notas para la cocina</p>
            <p
              className={`mt-1 text-sm ${verCompleta ? "break-words" : "truncate"}`}
              title={verCompleta ? undefined : guardada}
            >
              {guardada}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setVerCompleta((v) => !v)}
            aria-label={verCompleta ? "Ocultar la nota completa" : "Ver la nota completa"}
            aria-pressed={verCompleta}
            title={verCompleta ? "Ocultar la nota completa" : "Ver la nota completa"}
            className={BOTON_ICONO}
          >
            {verCompleta ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            type="button"
            ref={botonRef}
            onClick={abrir}
            aria-label="Editar la nota para la cocina"
            title="Editar nota"
            className={BOTON_ICONO}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={quitar}
            aria-label="Quitar la nota para la cocina"
            title="Quitar nota"
            className={`${BOTON_ICONO} text-red-600`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      ref={botonRef}
      onClick={abrir}
      className={`${BOTON} w-full justify-start bg-white`}
    >
      <Plus className="h-4 w-4" /> Notas para la cocina (opcional)
    </button>
  );
}
