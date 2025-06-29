export default function Home() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontFamily: 'monospace, sans-serif',
      backgroundColor: '#f5f5f5',
      color: '#333',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{
        padding: '2rem 4rem',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Gemini Discord Bot - Backend</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>The backend service is running.</p>
        <p style={{ color: '#666' }}>There is no user interface here. Please interact with the bot via Discord.</p>
      </div>
    </div>
  );
}
