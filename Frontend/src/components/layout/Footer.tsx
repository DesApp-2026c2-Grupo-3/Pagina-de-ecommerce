function Footer() {
  return (
    <footer className="mt-16 bg-brand-dark text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm md:flex-row">
        <span className="font-bold">
          Burger<span className="text-brand-red">Fast</span>
        </span>
        <p className="text-white/70">© {new Date().getFullYear()} BurgerFast. Todos los derechos reservados.</p>
        <ul className="flex gap-4 text-white/70">
          <li>
            <a href="#" className="hover:text-white">Términos</a>
          </li>
          <li>
            <a href="#" className="hover:text-white">Privacidad</a>
          </li>
        </ul>
      </div>
    </footer>
  )
}

export default Footer
