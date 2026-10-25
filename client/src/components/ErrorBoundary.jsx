import { Component } from 'react'
import { RefreshCw, TriangleAlert } from 'lucide-react'

/**
 * Catches render-time crashes so a single broken view cannot blank the app.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unknown error' }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[YogAI] Render error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container-x flex min-h-[60vh] items-center justify-center">
          <div className="card max-w-lg p-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-200">
              <TriangleAlert size={24} aria-hidden="true" />
            </span>
            <h1 className="mt-4 text-xl font-semibold text-ink">Something went wrong on this page</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              An unexpected error occurred while rendering this view. Reloading usually fixes it.
            </p>
            {this.state.message && (
              <p className="mt-3 rounded-xl bg-sage-50 px-3 py-2 text-xs text-muted dark:bg-sage-900/60">
                {this.state.message}
              </p>
            )}
            <button type="button" onClick={() => window.location.reload()} className="btn-primary mt-5">
              <RefreshCw size={15} aria-hidden="true" />
              Reload the page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
