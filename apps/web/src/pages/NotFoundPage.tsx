import { Link } from 'react-router-dom'
import { AppLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft, Search } from 'lucide-react'

export const NotFoundPage = () => {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="space-y-6">
          {/* 404 Illustration */}
          <div className="relative">
            <h1 className="text-[120px] font-bold text-muted-foreground/20">404</h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <Search className="h-16 w-16 text-muted-foreground" />
            </div>
          </div>

          {/* Error Message */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Page Not Found</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              The page you're looking for doesn't exist or has been moved.
              Please check the URL or navigate back to the dashboard.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button asChild>
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          </div>

          {/* Helpful Links */}
          <div className="pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-4">Here are some helpful links:</p>
            <div className="flex items-center justify-center gap-6 text-sm">
              <Link to="/" className="text-primary hover:underline">Dashboard</Link>
              <Link to="/incidents" className="text-primary hover:underline">Incidents</Link>
              <Link to="/settings" className="text-primary hover:underline">Settings</Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}