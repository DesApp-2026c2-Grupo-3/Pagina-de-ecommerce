import { useState } from 'react'
import AppRoutes from './routes/AppRoutes'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  return (
  <div>
    
      <AppRoutes 
      isAuthenticated={isAuthenticated}
      setIsAuthenticated={setIsAuthenticated}/>
    
  </div>)
  
}

export default App
