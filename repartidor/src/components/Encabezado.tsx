
function Encabezado() {
  return (
    <header className="encabezado">
      <div>
        <p className="subtitulo">PANEL DE REPARTO</p>
        <h1>Mis pedidos</h1>
        <p className="descripcion">
          Organizá tus entregas y seguí el estado de cada pedido.
        </p>
      </div>

      <div className="perfil">
        <div className="avatar">R</div>
        <div>
          <strong>Repartidor</strong>
          <p>Turno activo</p>
        </div>
      </div>
    </header>
  )
}

export default Encabezado
