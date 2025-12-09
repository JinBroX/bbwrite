import '../styles/globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { Toaster } from 'sonner'

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
      <Toaster position="bottom-right" />
    </AuthProvider>
  )
}

export default MyApp
