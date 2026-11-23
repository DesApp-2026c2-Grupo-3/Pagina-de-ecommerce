import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Después de cada test, se borra lo que se dibujó
afterEach(() => {
  cleanup()
})