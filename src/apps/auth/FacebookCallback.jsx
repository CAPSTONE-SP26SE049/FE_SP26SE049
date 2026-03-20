/**
 * Facebook OAuth Callback Page
 * 
 * This page serves as the redirect URI for Facebook OAuth login.
 * When Facebook redirects back to our app after authentication,
 * the access_token is included in the URL hash fragment.
 * 
 * The Login page's popup polling mechanism reads the token from this page's URL
 * and then closes the popup automatically.
 * 
 * This page intentionally shows a simple loading state while the parent window
 * processes the callback.
 */
export default function FacebookCallback() {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontFamily: 'sans-serif',
            color: '#666',
        }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    width: 40,
                    height: 40,
                    border: '4px solid #e5e7eb',
                    borderTop: '4px solid #1877f2',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 16px',
                }} />
                <p>Đang xử lý đăng nhập Facebook...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    )
}
