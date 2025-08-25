import React from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  createBrowserRouter, 
  RouterProvider, 
  createRoutesFromElements,
  Route 
} from 'react-router-dom';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

class ErrorBoundary extends React.Component<{ children?: React.ReactNode }, { error?: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Uncaught error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-8">
          <h2 className="text-2xl font-bold text-red-600">An error occurred</h2>
          <p className="mt-2 text-sm text-muted-foreground">The app encountered an unexpected error while rendering.</p>
          <pre className="mt-4 whitespace-pre-wrap bg-gray-100 p-4 rounded">{String(this.state.error?.message)}
{String((this.state.error as any)?.stack)}</pre>
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <TooltipProvider>
        <Toaster />
        <RouterProvider router={createBrowserRouter(
          createRoutesFromElements(
            <>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/doctor" element={<DoctorDashboard />} />
              <Route path="/patient" element={<PatientDashboard />} />
              <Route path="*" element={<NotFound />} />
            </>
          ),
          {
            future: {
              // Enable future flags for React Router v7 compatibility
              // @ts-ignore - These flags are available but not yet in the types
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }
          }
        )} />
      </TooltipProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;