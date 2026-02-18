import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStoreContext } from "@/hooks/useStoreContext";
import { Store, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StoreSelectorProps {
  className?: string;
}

const StoreSelector = ({ className }: StoreSelectorProps) => {
  const { stores, selectedStore, setSelectedStoreId, isLoading, isAdmin } = useStoreContext();

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (stores.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {selectedStore?.logo_url ? (
        <img 
          src={selectedStore.logo_url} 
          alt={selectedStore.name}
          className="h-10 w-10 rounded-lg object-cover border border-border"
        />
      ) : (
        <div 
          className="h-10 w-10 rounded-lg flex items-center justify-center border border-border"
          style={{ 
            backgroundColor: selectedStore?.primary_color || "hsl(var(--muted))" 
          }}
        >
          <Store className="h-5 w-5 text-white" />
        </div>
      )}
      
      {/* Admin badge + selector for all stores */}
      {isAdmin ? (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 border-amber-500/50 text-amber-600 bg-amber-500/10">
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
          <Select value={selectedStore?.id || ""} onValueChange={setSelectedStoreId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Selecione uma loja" />
            </SelectTrigger>
            <SelectContent>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  <div className="flex items-center gap-2">
                    {store.logo_url ? (
                      <img 
                        src={store.logo_url} 
                        alt={store.name}
                        className="h-5 w-5 rounded object-cover"
                      />
                    ) : (
                      <div 
                        className="h-5 w-5 rounded flex items-center justify-center"
                        style={{ backgroundColor: store.primary_color || "#888" }}
                      >
                        <Store className="h-3 w-3 text-white" />
                      </div>
                    )}
                    {store.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : stores.length > 1 ? (
        <Select value={selectedStore?.id || ""} onValueChange={setSelectedStoreId}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Selecione a empresa" />
          </SelectTrigger>
          <SelectContent>
            {stores.map((store) => (
              <SelectItem key={store.id} value={store.id}>
                <div className="flex items-center gap-2">
                  {store.logo_url ? (
                    <img 
                      src={store.logo_url} 
                      alt={store.name}
                      className="h-5 w-5 rounded object-cover"
                    />
                  ) : (
                    <div 
                      className="h-5 w-5 rounded flex items-center justify-center"
                      style={{ backgroundColor: store.primary_color || "#888" }}
                    >
                      <Store className="h-3 w-3 text-white" />
                    </div>
                  )}
                  {store.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="font-semibold text-foreground">
          {selectedStore?.name}
        </div>
      )}
    </div>
  );
};

export default StoreSelector;
