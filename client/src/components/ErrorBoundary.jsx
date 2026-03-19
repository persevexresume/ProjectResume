import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorCount: 0
        }
    }

    static getDerivedStateFromError() {
        return { hasError: true }
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by ErrorBoundary:', error, errorInfo)
        
        this.setState(state => ({
            error,
            errorInfo,
            errorCount: state.errorCount + 1
        }))

        // Log to external error tracking service (e.g., Sentry, LogRocket)
        // if (window.errorTracker) {
        //   window.errorTracker.captureException(error, { errorInfo })
        // }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        })
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '3rem',
                        maxWidth: '600px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        textAlign: 'center'
                    }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <AlertCircle size={64} style={{ color: '#ef4444', margin: '0 auto' }} />
                        </div>

                        <h1 style={{
                            fontSize: '2rem',
                            fontWeight: 900,
                            color: '#1e293b',
                            marginBottom: '0.5rem'
                        }}>
                            Oops! Something Went Wrong
                        </h1>

                        <p style={{
                            color: '#64748b',
                            marginBottom: '1.5rem',
                            lineHeight: 1.6
                        }}>
                            We encountered an unexpected error. Don't worry, our team has been notified and we're working to fix it.
                        </p>

                        {import.meta.env.DEV && this.state.error && (
                            <details style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                padding: '1rem',
                                marginBottom: '1.5rem',
                                textAlign: 'left',
                                cursor: 'pointer'
                            }}>
                                <summary style={{ fontWeight: 700, color: '#64748b', marginBottom: '0.5rem' }}>
                                    Error Details (Dev Mode)
                                </summary>
                                <pre style={{
                                    background: '#1e293b',
                                    color: '#22c55e',
                                    padding: '1rem',
                                    borderRadius: '4px',
                                    overflow: 'auto',
                                    fontSize: '0.85rem',
                                    lineHeight: 1.4
                                }}>
                                    {this.state.error.toString()}
                                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}

                        <div style={{
                            display: 'flex',
                            gap: '1rem',
                            justifyContent: 'center',
                            flexWrap: 'wrap'
                        }}>
                            <button
                                onClick={this.handleReset}
                                style={{
                                    background: '#667eea',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '1rem'
                                }}
                            >
                                <RefreshCw size={18} /> Try Again
                            </button>
                            <a
                                href="/"
                                style={{
                                    background: '#f0fdf4',
                                    color: '#059669',
                                    border: '2px solid #10b981',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    fontWeight: 800,
                                    textDecoration: 'none',
                                    fontSize: '1rem'
                                }}
                            >
                                Go Home
                            </a>
                        </div>

                        <p style={{
                            color: '#94a3b8',
                            fontSize: '0.85rem',
                            marginTop: '1.5rem'
                        }}>
                            Error Code: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                        </p>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
