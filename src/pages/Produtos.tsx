import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ProductModal from "@/components/produtos/ProductModal";

const Produtos = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>();

  // Get user's store
  const { data: userStore } = useQuery({
    queryKey: ["user-store"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      return data;
    },
  });

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", userStore?.id],
    queryFn: async () => {
      if (!userStore?.id) return [];

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories(name)
        `)
        .eq("store_id", userStore.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userStore?.id,
  });

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.categories?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNewProduct = () => {
    setSelectedStoreId(userStore?.id);
    setProductModalOpen(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const getStatusBadge = (status: string, stockQuantity: number) => {
    if (stockQuantity <= 5 && stockQuantity > 0) {
      return <Badge variant="destructive">Estoque Baixo</Badge>;
    }
    if (stockQuantity === 0) {
      return <Badge variant="destructive">Sem Estoque</Badge>;
    }
    if (status === "ativo") {
      return <Badge variant="default">Disponível</Badge>;
    }
    if (status === "inativo") {
      return <Badge variant="secondary">Inativo</Badge>;
    }
    return <Badge variant="outline">Rascunho</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Catálogo de Produtos</h1>
            <p className="text-muted-foreground">Gerencie todos os produtos disponíveis</p>
          </div>
          <Button 
            className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
            onClick={handleNewProduct}
          >
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Buscar Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input 
                  placeholder="Buscar por nome ou categoria..." 
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

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Carregando produtos...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm
                ? "Tente ajustar sua busca"
                : "Comece cadastrando seu primeiro produto"}
            </p>
            {!searchTerm && (
              <Button onClick={handleNewProduct}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Produto
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredProducts.map((produto) => (
              <Card key={produto.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {produto.image_url ? (
                        <img 
                          src={produto.image_url} 
                          alt={produto.name}
                          className="h-16 w-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="p-3 bg-accent/10 rounded-lg">
                          <Package className="h-6 w-6 text-accent" />
                        </div>
                      )}
                      <div>
                        <CardTitle>{produto.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {produto.categories?.name || "Sem categoria"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Ver Detalhes</Button>
                      <Button variant="outline" size="sm">Editar</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-8 items-center text-sm">
                    <div>
                      <span className="text-muted-foreground">Preço:</span>
                      <span className="ml-2 font-medium text-lg">{formatPrice(produto.price)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Estoque:</span>
                      <span className="ml-2 font-medium">{produto.stock_quantity} unidades</span>
                    </div>
                    <div>
                      {getStatusBadge(produto.status, produto.stock_quantity)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ProductModal
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        storeId={selectedStoreId}
      />
    </div>
  );
};

export default Produtos;
