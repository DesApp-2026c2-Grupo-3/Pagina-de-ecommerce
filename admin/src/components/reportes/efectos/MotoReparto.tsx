/* =========================================================
   MOTO DE REPARTO
   Scooter naranja con la caja roja atrás (sin repartidor).
   Por defecto es decorativa. Si le pasás "titulo", se anuncia.
   ========================================================= */

type MotoRepartoProps = {
  ancho?: number;
  titulo?: string;
  className?: string;
};

export default function MotoReparto({
  ancho = 46,
  titulo,
  className,
}: MotoRepartoProps) {
  return (
    <svg
      viewBox="0 0 64 48"
      width={ancho}
      height={Math.round((ancho * 48) / 64)}
      className={className}
      role={titulo ? "img" : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      {/* Caja de reparto */}
      <rect x="3" y="6" width="17" height="15" rx="2.5" fill="#dc2626" stroke="#991b1b" strokeWidth="1.2" />
      <path d="M4 11.5h15" stroke="#fca5a5" strokeWidth="1.6" />

      {/* Carrocería, asiento y piso */}
      <path d="M5 34c0-8 6-12 15-12h13c2 0 3 1.5 3 3.5V34z" fill="#f97316" stroke="#c2410c" strokeWidth="1.2" />
      <path d="M15 21.5c4-3 11-3 17-1.5v2H15z" fill="#1f2937" />
      <rect x="33" y="31" width="12" height="4" rx="1" fill="#ea580c" />

      {/* Columna, guardabarros, manubrio y faro */}
      <path d="M42 34l4-20h4l-2 20z" fill="#f97316" stroke="#c2410c" strokeWidth="1.2" />
      <path d="M43 35c3-6 12-6 15 0z" fill="#fb923c" stroke="#c2410c" strokeWidth="1" />
      <path d="M44 13l9-2" stroke="#374151" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="52" cy="17" r="2.2" fill="#fde68a" stroke="#b45309" strokeWidth="0.8" />

      {/* Ruedas */}
      <circle cx="14" cy="38" r="8" fill="#374151" />
      <circle cx="14" cy="38" r="3.4" fill="#d1d5db" />
      <circle cx="51" cy="38" r="8" fill="#374151" />
      <circle cx="51" cy="38" r="3.4" fill="#d1d5db" />
    </svg>
  );
}