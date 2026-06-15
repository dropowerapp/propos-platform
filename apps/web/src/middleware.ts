import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/overview(.*)',
  '/analytics(.*)',
  '/accounts(.*)',
  '/challenges(.*)',
  '/trades(.*)',
  '/journal(.*)',
  '/payouts(.*)',
  '/alerts(.*)',
  '/firms(.*)',
  '/ai-coach(.*)',
  '/recommendations(.*)',
  '/onboarding(.*)',
]);

// Public routes — sign-in, sign-up, marketing
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Redirect unauthenticated users trying to access protected routes
  if (isProtectedRoute(req) && !isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
