import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Lightbulb, Snowflake } from "lucide-react";

import { IconoComida } from "./efectos/IconosComida";
import { iconoPorCategoria } from "./efectos/iconoPorCategoria";
import { sugerenciaPorCategoria } from "./efectos/sugerenciaPorCategoria";
import type { FilaRankingAnimado } from "./RankingAnimado";

/* =========================================================
   LA HELADERA (Menos vendidos)
   Cada producto está dentro de un cubito de hielo: cuanto menos
   vende, más grueso es el hielo. Al tocarlo, el hielo se rompe y
   el ticket muestra un "plan de descongelamiento".
   Todo el estado (cuáles se descongelaron) vive acá adentro.
   ========================================================= */

type Props = {
  filas: FilaRankingAnimado[]; // ordenadas de menos a más vendido
  promedio: number;            // unidades promedio por producto
  contexto: string;            // "Todas las sucursales" o el nombre de una
  puedeCrearPromo: boolean;    // solo el MASTER puede ir a crear promociones
  limite?: number;
};

type Id = number | string;

const TEMPERATURA_INICIAL = -18;
const GRADOS_POR_RESCATE = 4;
const DURACION_ROTURA_MS = 720;
const DURACION_FIESTA_MS = 3800;

/* ---------- Niveles de hielo ----------
   3 = congelado (0 ventas), 2 = helado, 1 = frío */
type Nivel = 1 | 2 | 3;

function nivelDeHielo(unidades: number, promedio: number): Nivel {
  if (unidades === 0) return 3;
  if (promedio > 0 && unidades / promedio < 0.15) return 2;
  return 1;
}

const NIVELES: Record<
  Nivel,
  {
    etiqueta: string;
    fondo: string;
    borde: string;
    opacidadIcono: number;
    desenfoque: number;
    escarcha: number;
  }
> = {
  1: { etiqueta: "FRÍO", fondo: "rgb(224 242 254 / 0.55)", borde: "1px solid #bae6fd", opacidadIcono: 0.85, desenfoque: 0, escarcha: 0.15 },
  2: { etiqueta: "HELADO", fondo: "rgb(186 230 253 / 0.7)", borde: "2px solid #7dd3fc", opacidadIcono: 0.6, desenfoque: 0.6, escarcha: 0.45 },
  3: { etiqueta: "CONGELADO", fondo: "rgb(186 230 253 / 0.92)", borde: "3px solid #7dd3fc", opacidadIcono: 0.38, desenfoque: 1.4, escarcha: 0.85 },
};

/* ---------- Decoración fija (se calcula una sola vez) ---------- */

const COPOS = Array.from({ length: 14 }, (_, i) => ({
  izquierda: `${(i * 41 + 3) % 96}%`,
  duracion: 7 + (i % 5) * 1.6,
  retraso: -(i * 1.3), // negativo: arrancan ya "a mitad de camino"
  tamanio: 8 + (i % 4) * 3,
}));

const ESQUIRLAS = [
  { dx: -34, dy: -26, giro: 140, ancho: 9, alto: 6 },
  { dx: 30, dy: -30, giro: -160, ancho: 7, alto: 5 },
  { dx: 38, dy: 14, giro: 200, ancho: 8, alto: 6 },
  { dx: -30, dy: 22, giro: -120, ancho: 6, alto: 5 },
  { dx: 4, dy: -40, giro: 90, ancho: 6, alto: 4 },
  { dx: -8, dy: 36, giro: -200, ancho: 7, alto: 5 },
  { dx: 22, dy: 32, giro: 160, ancho: 5, alto: 4 },
];

const formatearUnidades = (valor: number) =>
  `${valor.toLocaleString("es-AR")} u.`;

/* =========================================================
   COMPONENTE PRINCIPAL
   ========================================================= */

export default function HeladeraMenosVendidos({
  filas,
  promedio,
  contexto,
  puedeCrearPromo,
  limite = 5,
}: Props) {
  const navigate = useNavigate();
  const visibles = filas.slice(0, limite);

  const [seleccionadoId, setSeleccionadoId] = useState<Id | null>(null);
  const [descongelados, setDescongelados] = useState<Record<string, true>>({});
  const [rompiendoId, setRompiendoId] = useState<Id | null>(null);
  const [fiestaId, setFiestaId] = useState(0);
  const [impresion, setImpresion] = useState(0); // cambia para "reimprimir" el ticket

  const temporizadores = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Copia de "descongelados" para leer el valor actual dentro de los temporizadores
  const descongeladosRef = useRef<Record<string, true>>({});

  const guardarDescongelados = (nuevos: Record<string, true>) => {
    descongeladosRef.current = nuevos;
    setDescongelados(nuevos);
  };

  // Si el usuario se va en plena animación, limpiamos los temporizadores
  useEffect(() => {
    const lista = temporizadores.current;
    return () => lista.forEach(clearTimeout);
  }, []);

  const despues = (fn: () => void, ms: number) => {
    temporizadores.current.push(setTimeout(fn, ms));
  };

  const estaDescongelado = (id: Id) => Boolean(descongelados[String(id)]);
  const cantidadDescongelados = visibles.filter((fila) =>
    estaDescongelado(fila.id),
  ).length;

  // El elegido por defecto es el primero (el que menos vende)
  const elegido =
    visibles.find((fila) => fila.id === seleccionadoId) ?? visibles[0];

  /* ---------- Eventos ---------- */

  const tocarFila = (fila: FilaRankingAnimado) => {
    setSeleccionadoId(fila.id);
    setImpresion((n) => n + 1);

    // Si ya estaba descongelado (o hay otro rompiéndose), solo lo elegimos
    if (estaDescongelado(fila.id) || rompiendoId !== null) return;

    setRompiendoId(fila.id);

    // Cuando termina la rotura, queda descongelado
    despues(() => {
      const nuevos: Record<string, true> = {
        ...descongeladosRef.current,
        [String(fila.id)]: true,
      };
      guardarDescongelados(nuevos);
      setRompiendoId(null);
      setImpresion((n) => n + 1);

      // ¿Se rescataron todos? ¡Fiesta!
      if (visibles.every((f) => nuevos[String(f.id)])) {
        const id = Date.now();
        setFiestaId(id);
        despues(
          () => setFiestaId((actual) => (actual === id ? 0 : actual)),
          DURACION_FIESTA_MS,
        );
      }
    }, DURACION_ROTURA_MS);
  };

  const volverACongelar = (id: Id) => {
    const nuevos = { ...descongeladosRef.current };
    delete nuevos[String(id)];
    guardarDescongelados(nuevos);
    setImpresion((n) => n + 1);
  };

  /* ---------- Termómetro ---------- */

  const temperatura = TEMPERATURA_INICIAL + cantidadDescongelados * GRADOS_POR_RESCATE;
  const colorTemperatura =
    temperatura < -6 ? "text-sky-300" : temperatura < 0 ? "text-amber-200" : "text-orange-300";

  if (!elegido) return null;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      {/* ===================== EL FREEZER ===================== */}
      <div className="relative min-w-0 overflow-hidden rounded-xl bg-sky-50 p-2 shadow-[inset_0_2px_10px_rgb(3_105_161/0.08)] ring-1 ring-sky-200 sm:p-3">
        {/* Nieve de fondo */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {COPOS.map((copo, i) => (
            <span
              key={i}
              className="rep-copo"
              style={{
                left: copo.izquierda,
                animationDuration: `${copo.duracion}s`,
                animationDelay: `${copo.retraso}s`,
              }}
            >
              <Snowflake size={copo.tamanio} className="text-sky-300" strokeWidth={2.4} />
            </span>
          ))}
        </div>

        {/* Cartel cuando se rescatan todos */}
        {fiestaId !== 0 && (
          <div
            key={fiestaId}
            role="status"
            className="rep-cartel flex items-center gap-2 rounded-full border border-orange-300 bg-white px-4 py-2 text-sm font-bold text-gray-900 shadow-md"
          >
            <Flame size={18} className="text-orange-600" aria-hidden="true" />
            ¡Freezer vacío! Todos tienen un plan de rescate
          </div>
        )}

        {/* Leyenda + termómetro */}
        <div className="relative mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="text-xs text-sky-800">
            Cuanto más grueso el hielo, menos se vende.
          </p>

          <span
            aria-live="polite"
            className="inline-flex items-center gap-2 rounded-lg bg-sky-900 px-3 py-1.5 font-mono text-xs text-sky-100 shadow-[0_2px_6px_rgb(12_74_110/0.35)]"
          >
            <span className="text-[11px] text-sky-300">FREEZER</span>
            <strong className={`text-sm transition-colors duration-500 ${colorTemperatura}`}>
              {temperatura < 0 ? "−" : ""}
              {Math.abs(temperatura)} °C
            </strong>
            <span className="text-sky-300">·</span>
            <span>{visibles.length - cantidadDescongelados} congelados</span>
          </span>
        </div>

        {/* Las filas */}
        <ol className="relative space-y-2">
          {visibles.map((fila, indice) => {
            const descongelado = estaDescongelado(fila.id);
            const rompiendo = rompiendoId === fila.id;
            const elegida = fila.id === elegido.id;
            const nivel = NIVELES[nivelDeHielo(fila.valor, promedio)];
            const tipo = iconoPorCategoria(fila.categoria);

            const estiloFila = descongelado
              ? `bg-orange-50/60 ${elegida ? "border-orange-300 ring-2 ring-orange-200" : "border-orange-200"}`
              : `bg-white ${elegida ? "border-sky-400 ring-2 ring-sky-200" : "border-sky-200"}`;

            return (
              <li
                key={fila.id}
                className="rep-subir"
                style={{ animationDelay: `${indice * 0.07}s` }}
              >
                <button
                  type="button"
                  onClick={() => tocarFila(fila)}
                  aria-pressed={elegida}
                  aria-label={`${fila.nombre}, ${formatearUnidades(fila.valor)} vendidas. ${
                    descongelado ? "Descongelado." : "Tocá para descongelar."
                  }`}
                  className={`rep-fila-hielo flex w-full items-center gap-2 rounded-xl border px-2 py-2.5 text-left shadow-[0_1px_3px_rgb(3_105_161/0.08)] sm:gap-3 ${estiloFila}`}
                >
                  {/* Posición */}
                  <span
                    className={`w-6 shrink-0 text-center text-sm font-bold ${
                      descongelado ? "text-orange-700" : "text-sky-700"
                    }`}
                  >
                    {indice + 1}
                  </span>

                  {/* El cubito (o el producto ya liberado) */}
                  <span className="relative h-12 w-12 shrink-0 sm:h-14 sm:w-14">
                    {descongelado ? (
                      <span className="absolute inset-0 flex items-center justify-center rounded-xl border border-orange-200 bg-orange-50">
                        <span className="rep-liberado">
                          <IconoComida tipo={tipo} tamanio={30} />
                        </span>
                        <span aria-hidden="true" className="rep-gota-agua bottom-1 left-3 h-[7px] w-[5px]" />
                        <span
                          aria-hidden="true"
                          className="rep-gota-agua bottom-1.5 right-3 h-1.5 w-1"
                          style={{ animationDelay: "0.5s" }}
                        />
                      </span>
                    ) : (
                      <>
                        <span
                          className={`rep-cubo-congelado absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl ${
                            rompiendo ? "rep-sacudon" : ""
                          }`}
                          style={{
                            background: nivel.fondo,
                            border: nivel.borde,
                            boxShadow: "inset 0 0 0 3px rgb(255 255 255 / 0.6), 0 2px 6px rgb(3 105 161 / 0.18)",
                          }}
                        >
                          {/* El producto atrapado */}
                          <span
                            className="inline-flex"
                            style={{
                              opacity: nivel.opacidadIcono,
                              filter: `blur(${nivel.desenfoque}px)`,
                            }}
                          >
                            <IconoComida tipo={tipo} tamanio={28} />
                          </span>

                          {/* Escarcha */}
                          <span
                            aria-hidden="true"
                            className="absolute inset-0 bg-[radial-gradient(circle,rgb(255_255_255/0.95)_1px,transparent_1.6px)] bg-[length:7px_7px]"
                            style={{ opacity: nivel.escarcha }}
                          />

                          {/* Rayitas de luz del hielo */}
                          <svg aria-hidden="true" viewBox="0 0 56 56" className="absolute inset-0 h-full w-full">
                            <path d="M10 14 L18 8" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M10 22 L26 10" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                          </svg>

                          <span aria-hidden="true" className="rep-brillo-hielo" />

                          {/* Grietas mientras se rompe */}
                          {rompiendo && (
                            <svg aria-hidden="true" viewBox="0 0 56 56" className="absolute inset-0 h-full w-full">
                              <path className="rep-grieta" d="M28 4 L24 18 L32 26 L22 38 L28 52" fill="none" stroke="#0369a1" strokeWidth="1.6" />
                              <path className="rep-grieta" d="M32 26 L46 22 L52 30" fill="none" stroke="#0369a1" strokeWidth="1.4" style={{ animationDelay: "0.08s" }} />
                              <path className="rep-grieta" d="M24 18 L8 14" fill="none" stroke="#0369a1" strokeWidth="1.4" style={{ animationDelay: "0.14s" }} />
                            </svg>
                          )}
                        </span>

                        {/* Esquirlas que salen volando */}
                        {rompiendo &&
                          ESQUIRLAS.map((esquirla, i) => (
                            <span
                              key={i}
                              aria-hidden="true"
                              className="rep-esquirla"
                              style={
                                {
                                  width: esquirla.ancho,
                                  height: esquirla.alto,
                                  "--dx": `${esquirla.dx}px`,
                                  "--dy": `${esquirla.dy}px`,
                                  "--giro": `${esquirla.giro}deg`,
                                } as CSSProperties
                              }
                            />
                          ))}
                      </>
                    )}
                  </span>

                  {/* Nombre + estado */}
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="min-w-0 truncate text-sm font-semibold text-gray-800"
                        title={fila.nombre}
                      >
                        {fila.nombre}
                      </span>
                      {fila.categoria && (
                        <span className="hidden shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 ring-1 ring-gray-200 md:inline">
                          {fila.categoria}
                        </span>
                      )}
                    </span>

                    <span className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide ring-1 transition-colors duration-500 ${
                          descongelado
                            ? "bg-orange-100 text-orange-800 ring-orange-300"
                            : "bg-sky-100 text-sky-800 ring-sky-200"
                        }`}
                      >
                        {descongelado ? "EN RESCATE" : nivel.etiqueta}
                      </span>
                      {fila.valor === 0 && !descongelado && (
                        <span className="text-[11px] font-extrabold tracking-wide text-sky-900">
                          NADIE LO PIDIÓ
                        </span>
                      )}
                    </span>
                  </span>

                  {/* Unidades */}
                  <span
                    className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ring-1 transition-colors duration-500 ${
                      descongelado
                        ? "bg-orange-50 text-orange-700 ring-orange-200"
                        : "bg-white text-sky-800 ring-sky-200"
                    }`}
                  >
                    {formatearUnidades(fila.valor)}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* ===================== EL TICKET ===================== */}
      <aside
        aria-label="Plan de descongelamiento"
        className="mx-auto w-full max-w-sm py-2.5 lg:max-w-none"
      >
        <TicketDescongelamiento
          key={`${elegido.id}-${impresion}`}
          fila={elegido}
          puesto={visibles.indexOf(elegido) + 1}
          promedio={promedio}
          contexto={contexto}
          descongelado={estaDescongelado(elegido.id)}
          puedeCrearPromo={puedeCrearPromo}
          onDescongelar={() => tocarFila(elegido)}
          onVolverACongelar={() => volverACongelar(elegido.id)}
          onCrearPromo={() => navigate("/admin/promociones/nueva")}
        />
      </aside>
    </div>
  );
}

/* =========================================================
   TICKET: PLAN DE DESCONGELAMIENTO
   ========================================================= */

type TicketProps = {
  fila: FilaRankingAnimado;
  puesto: number;
  promedio: number;
  contexto: string;
  descongelado: boolean;
  puedeCrearPromo: boolean;
  onDescongelar: () => void;
  onVolverACongelar: () => void;
  onCrearPromo: () => void;
};

function Renglon({ concepto, valor }: { concepto: string; valor: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="min-w-0">{concepto}</span>
      <span className="min-w-3 flex-1 border-b border-dotted border-sky-300" />
      <strong className="shrink-0 whitespace-nowrap text-gray-900">{valor}</strong>
    </div>
  );
}

function TicketDescongelamiento({
  fila,
  puesto,
  promedio,
  contexto,
  descongelado,
  puedeCrearPromo,
  onDescongelar,
  onVolverACongelar,
  onCrearPromo,
}: TicketProps) {
  const faltan = Math.max(0, Math.round(promedio - fila.valor));
  const porcentaje = promedio > 0 ? Math.min(100, (fila.valor / promedio) * 100) : 0;

  return (
    <div
      aria-live="polite"
      className="rep-ticket-frio min-h-[440px] border-x border-sky-300 px-5 py-6 font-mono text-gray-700 shadow-[0_2px_4px_rgb(3_105_161/0.12),0_14px_32px_rgb(3_105_161/0.18)]"
    >
      <div className="rep-imprimir flex flex-col gap-3">
        {/* Encabezado */}
        <div className="text-center">
          <p className="text-xs font-bold tracking-[0.2em] text-sky-800">BURGERFAST</p>
          <p className="text-[11px] tracking-[0.12em] text-sky-800">
            PLAN DE DESCONGELAMIENTO
          </p>
          <p className="text-[11px] text-gray-500">{contexto} · Pedidos entregados</p>
        </div>

        <div className="border-t-2 border-dashed border-sky-300" />

        {/* Producto */}
        <div>
          <p className="font-sans text-xl font-extrabold leading-tight text-gray-900">
            {fila.nombre}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {fila.categoria ?? "Sin categoría"} · {puesto}.º desde el fondo
          </p>
        </div>

        {/* Números */}
        <div className="flex flex-col gap-1.5 text-[13px]">
          <Renglon concepto="Unidades vendidas" valor={formatearUnidades(fila.valor)} />
          <Renglon concepto="Promedio por producto" valor={formatearUnidades(Math.round(promedio))} />
          <Renglon concepto="Falta para el promedio" valor={formatearUnidades(faltan)} />
        </div>

        {/* Barra: camino al promedio */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span>Camino al promedio</span>
            <strong className="text-gray-900">{Math.round(porcentaje)}%</strong>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-sky-100 ring-1 ring-sky-200">
            <div
              className={`rep-barra h-full min-w-1 rounded-full ${descongelado ? "bg-orange-500" : "bg-sky-400"}`}
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>

        <div className="border-t-2 border-dashed border-sky-300" />

        {descongelado ? (
          /* ----- Ya descongelado: sello + sugerencia + acciones ----- */
          <div className="flex flex-col gap-3">
            <span className="rep-sello self-start border-2 border-orange-600 px-2 py-0.5 text-xs font-bold tracking-wider text-orange-700">
              EN RESCATE
            </span>

            <div
              className="rep-subir flex gap-2.5 rounded-lg bg-orange-50 px-3 py-2.5 font-sans ring-1 ring-orange-200"
              style={{ animationDelay: "0.35s" }}
            >
              <Lightbulb size={20} className="mt-0.5 shrink-0 text-orange-600" aria-hidden="true" />
              <span className="flex flex-col gap-0.5">
                <strong className="text-[13px] text-orange-900">Sugerencia</strong>
                <span className="text-[13px] text-gray-700">
                  {sugerenciaPorCategoria(fila.categoria, fila.valor)}
                </span>
              </span>
            </div>

            <div className="flex flex-wrap gap-2 font-sans">
              {puedeCrearPromo && (
                <button
                  type="button"
                  onClick={onCrearPromo}
                  className="min-h-11 flex-[1_1_140px] whitespace-nowrap rounded-lg bg-orange-500 px-3 text-sm font-bold text-white shadow-[0_2px_6px_rgb(249_115_22/0.35)] transition hover:bg-orange-600"
                >
                  Crear promoción
                </button>
              )}
              <button
                type="button"
                onClick={onVolverACongelar}
                className="min-h-11 flex-[1_1_120px] whitespace-nowrap rounded-lg border border-sky-300 bg-white px-3 text-sm font-semibold text-sky-800 transition hover:bg-sky-50"
              >
                Volver a congelar
              </button>
            </div>
          </div>
        ) : (
          /* ----- Todavía congelado: sello + botón ----- */
          <div className="flex flex-col gap-3">
            <span className="rep-sello self-start border-2 border-sky-700 px-2 py-0.5 text-xs font-bold tracking-wider text-sky-800">
              CONGELADO
            </span>
            <p className="text-xs text-gray-700">
              Tocá el cubito para descongelarlo y ver qué hacer con este producto.
            </p>
            <button
              type="button"
              onClick={onDescongelar}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sky-600 px-3 font-sans text-sm font-bold text-white shadow-[0_2px_6px_rgb(2_132_199/0.35)] transition hover:bg-sky-700"
            >
              <Flame size={18} aria-hidden="true" />
              Descongelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}