import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { NextRequestWithAuth } from 'next-auth/middleware';
import { withAuth } from 'next-auth/middleware';
import { getToken } from 'next-auth/jwt';

// Types for role-based access and auth
type Role = 'admin' | 'doctor' | 'nurse' | 'staff';
type AuthToken = {
  role?: Role;
  hipaaTrainingValid?: boolean;
  sub?: string;
};

// Define route permissions based on roles
const routePermissions: Record<string, Role[]> = {
  // Doctor routes
  '/doctor/dashboard': ['doctor'],
  '/doctor/patients': ['doctor'],
  '/doctor/appointments': ['doctor'],
  
  // Nurse/Staff routes
  '/triage': ['nurse', 'doctor'],
  '/check-in': ['nurse', 'staff'],
  '/patient-records': ['nurse', 'doctor', 'staff'],
  
  // Admin routes
  '/admin': ['admin'],
  '/admin/users': ['admin'],
  '/admin/audit-logs': ['admin'],
  '/admin/settings': ['admin'],
  
  // Analytics routes
  '/analytics/triage': ['admin', 'doctor'],
  '/analytics/performance': ['admin', 'doctor'],
  
  // API routes
  '/api/patients': ['doctor', 'nurse', 'staff'],
  '/api/triage': ['doctor', 'nurse'],
  '/api/admin': ['admin']
} as const;

// Middleware configuration
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)']
} as const;

export default withAuth(
  async function middleware(request: NextRequestWithAuth) {
    const token = await getToken({ req: request }) as AuthToken | null;
    const path = request.nextUrl.pathname;
    
    // If not authenticated, only allow public routes
    if (!token) {
      const isPublicRoute = ['/login', '/register', '/'].includes(path);
      if (!isPublicRoute) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      return NextResponse.next();
    }

    // Get user role from token
    const userRole = token.role;
    if (!userRole) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check HIPAA compliance requirements
    const hasValidHIPAATraining = token.hipaaTrainingValid;
    const isHIPAARestrictedRoute = path.includes('/patients') || path.includes('/triage');
    
    if (isHIPAARestrictedRoute && !hasValidHIPAATraining) {
      return NextResponse.redirect(
        new URL('/training/hipaa-required', request.url)
      );
    }

    // Check role-based permissions
    const requiredRoles = routePermissions[path as keyof typeof routePermissions];
    if (requiredRoles && !requiredRoles.includes(userRole)) {
      return NextResponse.redirect(
        new URL('/unauthorized', request.url)
      );
    }

    // Rate limiting for API routes
    if (path.startsWith('/api/')) {
      const rateLimitResult = await checkRateLimit(request);
      if (!rateLimitResult.allowed) {
        return new NextResponse('Rate limit exceeded', { status: 429 });
      }
    }

    // Add security headers
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    );

    // Add audit logging
    await logAccess({
      userId: token.sub || 'unknown',
      role: userRole,
      path,
      method: request.method,
      timestamp: new Date().toISOString(),
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 
                 request.headers.get('x-real-ip') || 
                 'unknown'
    });

    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => token?.role !== undefined
    }
  }
);

// Rate limiting implementation
async function checkRateLimit(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
        request.headers.get('x-real-ip') || 
        'unknown';
  const path = request.nextUrl.pathname;
  
  // Different limits for different endpoints
  const limits = {
    '/api/triage': 100,  // 100 requests per minute for triage
    '/api/patients': 300, // 300 requests per minute for patient data
    default: 500         // 500 requests per minute for other endpoints
  } as const;

  const limit = limits[path as keyof typeof limits] || limits.default;
  
  try {
    // Implementation would use Redis or similar for distributed rate limiting
    // This is a placeholder that always returns allowed
    return { allowed: true, remaining: limit };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // If rate limiting fails, allow the request but log the error
    return { allowed: true, remaining: 0 };
  }
}

// Access logging implementation
async function logAccess(data: {
  userId: string;
  role: Role;
  path: string;
  method: string;
  timestamp: string;
  ipAddress: string;
}) {
  try {
    // Log to audit system
    await fetch('/api/audit/access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (error) {
    // Log locally if audit API fails
    console.error('Failed to log access:', error);
  }
}
