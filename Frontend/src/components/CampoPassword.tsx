import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

type CampoPasswordProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

function CampoPassword({ className = '', ...props }: CampoPasswordProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative mt-1">
      <input {...props} type={visible ? 'text' : 'password'} className={`${className} pr-10`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 transition-colors hover:text-brand-red"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}

export default CampoPassword