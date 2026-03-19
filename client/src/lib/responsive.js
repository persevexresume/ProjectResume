/**
 * Responsive Design System & Breakpoints
 * Ensures consistent responsive behavior across all pages
 */

// Declare breakpoints
export const breakpoints = {
  xs: 320,      // Mobile
  sm: 640,      // Mobile landscape
  md: 768,      // Tablet
  lg: 1024,     // Desktop
  xl: 1280,     // Wide desktop
  '2xl': 1536,  // Ultra-wide
};

// Hook to use breakpoints
export const useResponsive = (windowWidth) => {
  return {
    isXs: windowWidth < breakpoints.sm,
    isSm: windowWidth >= breakpoints.sm && windowWidth < breakpoints.md,
    isMd: windowWidth >= breakpoints.md && windowWidth < breakpoints.lg,
    isLg: windowWidth >= breakpoints.lg && windowWidth < breakpoints.xl,
    isXl: windowWidth >= breakpoints.xl && windowWidth < breakpoints['2xl'],
    is2xl: windowWidth >= breakpoints['2xl'],
    isMobile: windowWidth < breakpoints.md,
    isTablet: windowWidth >= breakpoints.md && windowWidth < breakpoints.lg,
    isDesktop: windowWidth >= breakpoints.lg,
  };
};

// Responsive layout utility
export const getResponsiveLayout = (windowWidth) => {
  if (windowWidth < breakpoints.sm) {
    return {
      name: 'mobile',
      padding: '1rem',
      gap: '0.5rem',
      columns: 1,
      fontSize: 'small',
    };
  }
  if (windowWidth < breakpoints.md) {
    return {
      name: 'mobile-landscape',
      padding: '1rem',
      gap: '0.75rem',
      columns: 1,
      fontSize: 'small',
    };
  }
  if (windowWidth < breakpoints.lg) {
    return {
      name: 'tablet',
      padding: '1.5rem',
      gap: '1rem',
      columns: 2,
      fontSize: 'medium',
    };
  }
  if (windowWidth < breakpoints.xl) {
    return {
      name: 'desktop',
      padding: '2rem',
      gap: '1.5rem',
      columns: 3,
      fontSize: 'medium',
    };
  }
  return {
    name: 'wide-desktop',
    padding: '2.5rem',
    gap: '2rem',
    columns: 4,
    fontSize: 'large',
  };
};

// Responsive font sizes
export const responsiveFontSize = (windowWidth, baseSize) => {
  if (windowWidth < breakpoints.md) return baseSize * 0.85;
  if (windowWidth < breakpoints.lg) return baseSize * 0.9;
  if (windowWidth < breakpoints.xl) return baseSize;
  return baseSize * 1.1;
};

// Responsive spacing
export const responsiveSpacing = (windowWidth, baseSpacing) => {
  if (windowWidth < breakpoints.md) return baseSpacing * 0.75;
  if (windowWidth < breakpoints.lg) return baseSpacing * 0.9;
  return baseSpacing;
};

// Mobile-safe touch targets (minimum 44px)
export const getTouchTargetStyle = (windowWidth) => {
  const minSize = windowWidth < breakpoints.md ? '44px' : '40px';
  return {
    minWidth: minSize,
    minHeight: minSize,
    padding: windowWidth < breakpoints.md ? '0.875rem' : '0.75rem',
  };
};

// Prevent overflow on mobile
export const getMobileOverflowStyle = (windowWidth) => {
  if (windowWidth < breakpoints.md) {
    return {
      maxWidth: '100vw',
      overflowX: 'hidden',
      paddingLeft: '0.5rem',
      paddingRight: '0.5rem',
    };
  }
  return {};
};

// Grid layouts for different screen sizes
export const getResponsiveGridClass = (windowWidth) => {
  if (windowWidth < breakpoints.sm) return 'grid-cols-1';
  if (windowWidth < breakpoints.md) return 'grid-cols-1';
  if (windowWidth < breakpoints.lg) return 'grid-cols-2';
  if (windowWidth < breakpoints.xl) return 'grid-cols-3';
  return 'grid-cols-4';
};

// Stack vs Side-by-side layout
export const shouldStack = (windowWidth, mobileBreakpoint = breakpoints.md) => {
  return windowWidth < mobileBreakpoint;
};

// Hide/show elements responsively
export const getResponsiveDisplay = (windowWidth) => {
  return {
    showOnMobile: windowWidth < breakpoints.md,
    showOnTablet: windowWidth >= breakpoints.md && windowWidth < breakpoints.lg,
    showOnDesktop: windowWidth >= breakpoints.lg,
    hideOnMobile: windowWidth >= breakpoints.md,
    hideOnTablet: windowWidth < breakpoints.md || windowWidth >= breakpoints.lg,
    hideOnDesktop: windowWidth < breakpoints.lg,
  };
};
