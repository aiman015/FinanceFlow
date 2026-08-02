import { Component } from 'react'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Kept out of the UI, but logged for debugging — never lets the app
    // just go blank without a trace.
    console.error('FinanceFlow crashed:', error, info)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4">
          <div
            role="alert"
            className="max-w-sm w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 text-center"
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
              <AlertTriangle size={22} className="text-red-500 dark:text-red-400" aria-hidden="true" />
            </div>
            <h1 className="font-bold text-slate-900 dark:text-slate-100 mb-1">Something went wrong</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              FinanceFlow ran into an unexpected error. Your saved data is safe — try reloading the page.
            </p>
            <div className="flex gap-2">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 rounded-lg"
              >
                <RotateCcw size={15} /> Reload
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold py-2.5 rounded-lg"
              >
                <Home size={15} /> Dashboard
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
