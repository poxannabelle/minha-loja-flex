import { ReactNode } from "react";
import { useStoreContext, useStoreBranding } from "@/hooks/useStoreContext";
import StoreSelector from "./StoreSelector";

interface StoreBrandingWrapperProps {
  children: ReactNode;
  showSelector?: boolean;
  title: string;
  subtitle?: string;
}

const StoreBrandingWrapper = ({ 
  children, 
  showSelector = true,
  title,
  subtitle 
}: StoreBrandingWrapperProps) => {
  const { selectedStore, isLoading } = useStoreContext();
  
  // Apply branding CSS variables
  useStoreBranding(selectedStore);

  return (
    <div className="min-h-screen bg-background">
      {/* Header with store branding */}
      <div 
        className="border-b transition-colors duration-300"
        style={{
          backgroundColor: selectedStore?.primary_color 
            ? `${selectedStore.primary_color}10` 
            : undefined
        }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {showSelector && <StoreSelector />}
            
            <div className={showSelector ? "md:text-right" : ""}>
              <h1 
                className="text-2xl md:text-3xl font-bold transition-colors duration-300"
                style={{ 
                  color: selectedStore?.primary_color || "hsl(var(--foreground))" 
                }}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div 
        className="transition-colors duration-300"
        style={{
          // Apply subtle accent from store color
          "--accent": selectedStore?.primary_color 
            ? `hsl(${hexToHslValues(selectedStore.primary_color)})` 
            : undefined,
        } as React.CSSProperties}
      >
        {children}
      </div>
    </div>
  );
};

// Simple hex to HSL values helper
function hexToHslValues(hex: string): string {
  hex = hex.replace(/^#/, "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

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

  return `${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
}

export default StoreBrandingWrapper;
