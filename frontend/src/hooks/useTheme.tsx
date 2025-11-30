import { useEffect, useMemo } from 'react';
import { useAppStore } from '@/store';

// Get system theme preference
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Apply theme to document
function applyTheme(theme: 'light' | 'dark' | 'system') {
  const root = document.documentElement;
  const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;

  // Remove previous theme attributes
  root.removeAttribute('data-theme');
  root.classList.remove('light', 'dark', 'system');

  // Apply current theme
  if (theme === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
  root.classList.add(theme);

  // Apply effective theme class for CSS
  root.classList.add(effectiveTheme);
}

export function useTheme() {
  const { theme, setTheme } = useAppStore();

  // Get effective theme (resolved system theme)
  const effectiveTheme = useMemo(() => {
    return theme === 'system' ? getSystemTheme() : theme;
  }, [theme]);

  // Apply theme to document when it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen to system theme changes when in system mode
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      applyTheme('system');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Apply theme on mount (store already has correct theme from localStorage)
  useEffect(() => {
    applyTheme(theme);
  }, []); // Run only once on mount

  // Cycle through themes function
  const cycleTheme = () => {
    if (theme === 'system') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('system');
    }
  };

  return {
    theme,
    effectiveTheme,
    setTheme,
    cycleTheme,
  };
}
