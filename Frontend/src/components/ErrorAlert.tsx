interface ErrorAlertProps {
  message: string
}

function ErrorAlert({ message }: ErrorAlertProps) {
  if (!message) return null

  return (
    <div className="flex items-center gap-3 rounded-lg border border-brand-red/20 bg-brand-red/10 px-4 py-3">
      <span className="text-lg leading-none">⚠️</span>
      <p className="text-sm font-semibold text-brand-red">{message}</p>
    </div>
  )
}

export default ErrorAlert