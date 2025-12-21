import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex min-h-[400px] items-center justify-center p-6">
                    <Card className="w-full max-w-md border-red-200">
                        <CardHeader className="text-center">
                            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
                            <CardTitle className="text-red-600">Đã xảy ra lỗi</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="mb-4 text-gray-600">
                                Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.
                            </p>
                            {this.state.error && (
                                <p className="mb-4 text-sm text-gray-400 font-mono">
                                    {this.state.error.message}
                                </p>
                            )}
                            <Button onClick={this.handleRetry} className="gap-2">
                                <RefreshCw className="h-4 w-4" />
                                Thử lại
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
