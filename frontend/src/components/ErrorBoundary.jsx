import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Exception non interceptée :', error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '32px',
          gap: '16px',
          background: 'var(--color-surface, #fafafa)',
          color: 'var(--color-primary, #050508)',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Une erreur est survenue</h1>
        <p style={{ maxWidth: 420, margin: 0, opacity: 0.8 }}>
          Quelque chose s'est mal passé lors de l'affichage de cette page. Vous
          pouvez réessayer en rechargeant la page.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Recharger la page
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
