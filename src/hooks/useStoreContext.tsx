import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Store {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  is_food_business: boolean;
}

interface StoreContextType {
  stores: Store[];
  selectedStore: Store | null;
  setSelectedStoreId: (id: string) => void;
  isLoading: boolean;
  isAdmin: boolean;
  allStores: Store[];
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [selectedStoreId, setSelectedStoreIdState] = useState<string>("");

  // Check if current user is admin
  const { data: isAdmin = false } = useQuery({
    queryKey: ["user-is-admin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin role:", error);
        return false;
      }
      return !!data;
    },
  });

  // Fetch stores owned by the user
  const { data: ownStores = [], isLoading: loadingOwn } = useQuery({
    queryKey: ["user-stores-context"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("stores")
        .select("id, name, slug, logo_url, primary_color, secondary_color, is_food_business")
        .eq("owner_id", user.id)
        .order("name");

      if (error) {
        console.error("Error fetching stores:", error);
        return [];
      }

      return data as Store[];
    },
  });

  // Fetch ALL stores if admin
  const { data: allStoresData = [], isLoading: loadingAll } = useQuery({
    queryKey: ["all-stores-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name, slug, logo_url, primary_color, secondary_color, is_food_business")
        .order("name");

      if (error) {
        console.error("Error fetching all stores:", error);
        return [];
      }

      return data as Store[];
    },
    enabled: isAdmin,
  });

  const stores = isAdmin ? allStoresData : ownStores;
  const isLoading = loadingOwn || (isAdmin && loadingAll);

  // Auto-select first store if none selected
  useEffect(() => {
    if (stores.length > 0 && !selectedStoreId) {
      setSelectedStoreIdState(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  const selectedStore = useMemo(() => {
    return stores.find(s => s.id === selectedStoreId) || null;
  }, [stores, selectedStoreId]);

  const setSelectedStoreId = useCallback((id: string) => {
    setSelectedStoreIdState(id);
    // Persist in localStorage for session
    localStorage.setItem("selectedStoreId", id);
  }, []);

  // Restore from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("selectedStoreId");
    if (saved) {
      setSelectedStoreIdState(saved);
    }
  }, []);

  return (
    <StoreContext.Provider value={{ stores, selectedStore, setSelectedStoreId, isLoading, isAdmin, allStores: allStoresData }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStoreContext = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStoreContext must be used within a StoreProvider");
  }
  return context;
};

// Hook to apply store branding to CSS variables
export const useStoreBranding = (store: Store | null) => {
  useEffect(() => {
    if (!store) return;

    const root = document.documentElement;
    
    if (store.primary_color) {
      // Convert hex to HSL for CSS variable
      const primaryHsl = hexToHsl(store.primary_color);
      if (primaryHsl) {
        root.style.setProperty("--store-primary", primaryHsl);
        root.style.setProperty("--store-primary-foreground", getContrastColor(store.primary_color));
      }
    }
    
    if (store.secondary_color) {
      const secondaryHsl = hexToHsl(store.secondary_color);
      if (secondaryHsl) {
        root.style.setProperty("--store-secondary", secondaryHsl);
        root.style.setProperty("--store-secondary-foreground", getContrastColor(store.secondary_color));
      }
    }

    // Cleanup when store changes or component unmounts
    return () => {
      root.style.removeProperty("--store-primary");
      root.style.removeProperty("--store-primary-foreground");
      root.style.removeProperty("--store-secondary");
      root.style.removeProperty("--store-secondary-foreground");
    };
  }, [store]);
};

// Helper function to convert hex to HSL string
function hexToHsl(hex: string): string | null {
  // Remove # if present
  hex = hex.replace(/^#/, "");
  
  // Parse hex values
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Get contrasting text color (black or white)
function getContrastColor(hex: string): string {
  hex = hex.replace(/^#/, "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for light colors, white for dark colors
  return luminance > 0.5 ? "0 0% 0%" : "0 0% 100%";
}
