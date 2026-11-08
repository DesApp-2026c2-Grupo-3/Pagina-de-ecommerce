import type { ReactNode } from "react";

/* =========================================================
   ÍCONOS DE COMIDA PARA LOS REPORTES
   Dibujos SVG livianos que se pueden animar con las clases rep-.
   Por defecto son decorativos (los lectores de pantalla los ignoran).
   Si les pasás "titulo", se anuncian con ese texto.
   ========================================================= */

export type TipoIcono =
  | "hamburguesa"
  | "papas"
  | "bebida"
  | "nugget"
  | "postre"
  | "corona";

type IconoProps = {
  tamanio?: number;
  titulo?: string;
  className?: string;
};

/* Envoltorio común: tamaño, accesibilidad y viewBox iguales para todos */
function Svg({
  tamanio = 28,
  titulo,
  className,
  children,
}: IconoProps & { children: ReactNode }) {
  const accesibilidad = titulo
    ? { role: "img", "aria-label": titulo }
    : { "aria-hidden": true };

  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanio}
      height={tamanio}
      className={className}
      {...accesibilidad}
    >
      {children}
    </svg>
  );
}

export function Hamburguesa(props: IconoProps) {
  return (
    <Svg {...props}>
      {/* pan de arriba */}
      <path d="M3 10a9 6 0 0 1 18 0z" fill="#fbbf24" />
      {/* carne */}
      <rect x="2.5" y="11.2" width="19" height="3.2" rx="1.6" fill="#92400e" />
      {/* lechuga */}
      <rect x="3" y="15.2" width="18" height="1.8" rx="0.9" fill="#22c55e" />
      {/* pan de abajo */}
      <path
        d="M3 18h18v.8a2.2 2.2 0 0 1-2.2 2.2H5.2A2.2 2.2 0 0 1 3 18.8z"
        fill="#fbbf24"
      />
    </Svg>
  );
}

export function Papas(props: IconoProps) {
  return (
    <Svg {...props}>
      <rect x="7" y="3" width="2.4" height="10" rx="1.2" fill="#fcd34d" />
      <rect x="10.8" y="1.6" width="2.4" height="11" rx="1.2" fill="#fcd34d" />
      <rect x="14.6" y="3.4" width="2.4" height="9.6" rx="1.2" fill="#fcd34d" />
      {/* caja */}
      <path d="M5 10h14l-2 11H7z" fill="#f97316" />
    </Svg>
  );
}

export function Bebida(props: IconoProps) {
  return (
    <Svg {...props}>
      {/* sorbete */}
      <path
        d="M14.5 1.5l-1.6 6"
        stroke="#9ca3af"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* vaso */}
      <path d="M6 7.5h12l-1.6 14H7.6z" fill="#f97316" />
      {/* tapa */}
      <rect
        x="5"
        y="6"
        width="14"
        height="2.4"
        rx="1.2"
        fill="#f3f4f6"
        stroke="#d1d5db"
        strokeWidth="0.6"
      />
      {/* etiqueta */}
      <rect x="8.4" y="12" width="7.2" height="3.2" rx="1" fill="#fde68a" />
    </Svg>
  );
}

export function Nugget(props: IconoProps) {
  return (
    <Svg {...props}>
      <path
        d="M4.5 13c0-4.2 3.2-7.5 7.5-7.5s7.5 2.4 7.5 6.3-3.3 7.2-7.5 7.2S4.5 17 4.5 13z"
        fill="#f59e0b"
      />
      <circle cx="9.5" cy="11" r="1.1" fill="#b45309" />
      <circle cx="14.5" cy="14" r="1.1" fill="#b45309" />
      <circle cx="12.5" cy="9" r="0.9" fill="#b45309" />
    </Svg>
  );
}

export function Postre(props: IconoProps) {
  return (
    <Svg {...props}>
      {/* cucurucho */}
      <path d="M8 13h8l-2.5 9h-3z" fill="#f59e0b" />
      {/* helado */}
      <path
        d="M6 13c0-3 2-4.2 3-4.2C9 5.6 11 3.5 12 3.5s3 2.1 3 5.3c1 0 3 1.2 3 4.2z"
        fill="#fef3c7"
        stroke="#fcd34d"
        strokeWidth="0.8"
      />
      {/* dulce de leche */}
      <path
        d="M8.6 10c1.2.9 5.4.9 6.8 0"
        stroke="#92400e"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function Corona(props: IconoProps) {
  return (
    <Svg {...props}>
      <path
        d="M3 18l-1-11 6 4 4-7 4 7 6-4-1 11z"
        fill="#f59e0b"
        stroke="#b45309"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <rect x="3" y="18.5" width="18" height="2.6" rx="1" fill="#d97706" />
      {/* joya */}
      <circle cx="12" cy="13.5" r="1.6" fill="#dc2626" />
    </Svg>
  );
}

/* Para elegir el ícono con un texto: <IconoComida tipo="papas" /> */
const ICONOS: Record<TipoIcono, (props: IconoProps) => ReactNode> = {
  hamburguesa: Hamburguesa,
  papas: Papas,
  bebida: Bebida,
  nugget: Nugget,
  postre: Postre,
  corona: Corona,
};

export function IconoComida({
  tipo,
  ...props
}: IconoProps & { tipo: TipoIcono }) {
  const Icono = ICONOS[tipo];
  return <Icono {...props} />;
}