import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { useMovieLibraryStore } from './store'
import './styles.css'

void useMovieLibraryStore.getState().reload()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
