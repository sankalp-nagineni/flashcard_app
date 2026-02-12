import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { AlertCircle } from 'lucide-react'

// Your Google Client ID - Replace with your own from Google Cloud Console
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID'

function AuthForm() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginWithGoogle } = useAuth()

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.body.appendChild(script)

    script.onload = () => {
      if (window.google && GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID') {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
        })

        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          { 
            theme: 'outline', 
            size: 'large',
            width: 320,
            text: 'continue_with',
            shape: 'rectangular',
          }
        )
      }
    }

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const handleGoogleCallback = async (response) => {
    setError('')
    setLoading(true)

    try {
      await loginWithGoogle(response.credential)
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google')
    } finally {
      setLoading(false)
    }
  }

  const showSetupInstructions = GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID'

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">
            <div className="logo-grid">
              <div className="logo-dot"></div>
              <div className="logo-dot action"></div>
              <div className="logo-dot"></div>
              <div className="logo-dot arrow"></div>
            </div>
          </div>
          <h1>Flashcard Studio</h1>
          <p className="auth-subtitle">
            Sign in to sync your flashcards
          </p>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={14} strokeWidth={1.5} />
            {error}
          </div>
        )}

        {showSetupInstructions ? (
          <div className="setup-instructions">
            <h3>Setup Required</h3>
            <p>To enable Google Sign-In:</p>
            <ol>
              <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
              <li>Create a new project (or select existing)</li>
              <li>Create OAuth 2.0 Client ID</li>
              <li>Add <code>http://localhost:5173</code> to Authorized JavaScript origins</li>
              <li>Copy the Client ID</li>
              <li>Create <code>frontend/.env</code> file with:<br/>
                <code>VITE_GOOGLE_CLIENT_ID=your-client-id</code>
              </li>
              <li>Restart the frontend server</li>
            </ol>
          </div>
        ) : (
          <div className="google-signin-wrapper">
            {loading && <p className="loading-text">Signing in...</p>}
            <div id="google-signin-button"></div>
          </div>
        )}

        <div className="auth-footer">
          <p>Your flashcards sync across all your devices</p>
        </div>
      </div>
    </div>
  )
}

export default AuthForm
