import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  componentStack: string | null;
}

/**
 * Catches render errors anywhere below it and shows the message in place.
 *
 * Without this, any uncaught render error unmounts the entire tree and the
 * window goes completely blank — the failure is invisible because release builds
 * are windowed and have no console. A visible message is the difference
 * between a reportable bug and a mystery.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, componentStack: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ componentStack: info.componentStack ?? null });
    // Also surface it to the Rust log sink when running inside the app.
    console.error('AuraOS render error:', error);
  }

  private reset = () => {
    this.setState({ error: null, componentStack: null });
  };

  render() {
    const { error, componentStack } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="h-full w-full flex items-center justify-center bg-background p-8">
        <div className="max-w-lg w-full rounded-xl border border-border/60 bg-surface/60 p-6">
          <div className="flex items-center gap-2 text-danger">
            <TriangleAlert className="w-4 h-4" />
            <span className="text-sm font-medium">AuraOS hit an error</span>
          </div>

          <p className="mt-3 text-xs text-muted leading-relaxed break-words">
            {error.message || 'Unknown error'}
          </p>

          {componentStack && (
            <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-black/30 p-3 text-[10px] leading-relaxed text-muted whitespace-pre-wrap">
              {componentStack.trim().split('\n').slice(0, 8).join('\n')}
            </pre>
          )}

          <button
            onClick={this.reset}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            <RefreshCw className="w-3 h-3" />
            Try again
          </button>
        </div>
      </div>
    );
  }
}