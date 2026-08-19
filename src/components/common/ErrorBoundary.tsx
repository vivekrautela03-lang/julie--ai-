import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Julie Uncaught Error]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center p-4 select-none">
          <div className="max-w-md w-full liquid-glass rounded-3xl p-6 text-center space-y-4 border border-rose-500/30 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Julie Recovered from an Error</h2>
              <p className="text-xs text-slate-400 mt-1">
                {this.state.error?.message || 'A temporary display issue occurred.'}
              </p>
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full liquid-glass-button py-2.5 rounded-full text-xs font-semibold text-white flex items-center justify-center gap-2 shadow-glass-button"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Julie Assistant</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
