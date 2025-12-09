import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Building2, Settings, MapPin, FolderTree } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StoreConfigModal } from "@/components/empresas/StoreConfigModal";

const Empresas = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);

  const { data: stores = [], isLoading } = useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select(`
          *,
          store_units:store_units(count),
          categories:categories(count)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredStores = stores.filter((store: any) =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenConfig = (store: any) => {
    setSelectedStore({
      id: store.id,
      nome: store.name,
      slug: store.slug,
      logo_url: store.logo_url,
      primary_color: store.primary_color,
      secondary_color: store.secondary_color,
    });
    setConfigModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Empresas</h1>
            <p className="text-muted-foreground">Gerencie as lojas cadastradas na plataforma</p>
          </div>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
            <Plus className="h-4 w-4" />
            Nova Empresa
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Buscar Empresas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input 
                  placeholder="Buscar por nome ou subdomínio..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Search className="h-4 w-4" />
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : filteredStores.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma empresa encontrada</p>
          ) : (
            filteredStores.map((store: any) => (
              <Card key={store.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {store.logo_url ? (
                        <img 
                          src={store.logo_url} 
                          alt={store.name} 
                          className="h-12 w-12 object-contain rounded-lg border"
                        />
                      ) : (
                        <div 
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: store.primary_color || '#000' }}
                        >
                          <Building2 className="h-6 w-6 text-white" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {store.name}
                          <div 
                            className="h-3 w-3 rounded-full border"
                            style={{ backgroundColor: store.primary_color }}
                            title="Cor primária"
                          />
                          <div 
                            className="h-3 w-3 rounded-full border"
                            style={{ backgroundColor: store.secondary_color }}
                            title="Cor secundária"
                          />
                        </CardTitle>
                        <CardDescription className="mt-1">{store.slug}.plazoo.com</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOpenConfig(store)}
                        className="gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Configurar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-8 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Unidades:</span>
                      <span className="font-medium">{store.store_units?.[0]?.count || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FolderTree className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Categorias:</span>
                      <span className="font-medium">{store.categories?.[0]?.count || 0}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className={`ml-2 font-medium ${
                        store.status === 'ativa' ? 'text-green-600' : 
                        store.status === 'inativa' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {store.status === 'ativa' ? 'Ativa' : 
                         store.status === 'inativa' ? 'Inativa' : 'Em Configuração'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <StoreConfigModal
        store={selectedStore}
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
      />
    </div>
  );
};

export default Empresas;
