/**
 * Admin Mode Context
 *
 * Provides application-wide admin mode state. When admin mode is disabled (default),
 * the app is in read-only mode where configuration (PVs, PV metadata, tags, tag groups)
 * cannot be edited, but snapshots can still be saved.
 *
 * When admin mode is enabled, configuration editing is allowed.
 */

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface AdminModeContextValue {
  /** Whether admin mode is currently enabled */
  isAdminMode: boolean;
  /** Toggle admin mode on/off */
  toggleAdminMode: () => void;
  /** Explicitly set admin mode state */
  setAdminMode: (enabled: boolean) => void;
}

const AdminModeContext = createContext<AdminModeContextValue>({
  isAdminMode: false,
  toggleAdminMode: () => {},
  setAdminMode: () => {},
});

interface AdminModeProviderProps {
  children: ReactNode;
}

export function AdminModeProvider({ children }: AdminModeProviderProps) {
  // Default to read-only mode (admin mode disabled)
  const [isAdminMode, setIsAdminMode] = useState(false);

  const toggleAdminMode = useCallback(() => {
    setIsAdminMode((prev) => !prev);
  }, []);

  const setAdminMode = useCallback((enabled: boolean) => {
    setIsAdminMode(enabled);
  }, []);

  return (
    <AdminModeContext.Provider value={{ isAdminMode, toggleAdminMode, setAdminMode }}>
      {children}
    </AdminModeContext.Provider>
  );
}

/**
 * Hook to access admin mode state and controls.
 *
 * @example
 * const { isAdminMode, toggleAdminMode } = useAdminMode();
 * if (!isAdminMode) {
 *   // Disable edit buttons
 * }
 */
export function useAdminMode(): AdminModeContextValue {
  return useContext(AdminModeContext);
}

export default AdminModeContext;
