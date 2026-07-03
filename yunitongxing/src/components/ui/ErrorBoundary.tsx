import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-dvh p-6 text-center bg-warm-bg">
          <div className="text-5xl mb-4">🧸</div>
          <h2 className="text-lg font-bold text-text-primary mb-2">出了点小问题</h2>
          <p className="text-xs text-text-muted mb-4">{this.state.error?.message || '未知错误'}</p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
            className="px-4 py-2 bg-warm-yellow text-white rounded-xl text-sm font-medium active:scale-95"
          >
            重新加载
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
