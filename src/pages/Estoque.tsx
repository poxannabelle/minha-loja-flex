import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle, ArrowDownCircle, AlertTriangle, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import StoreBrandingWrapper from "@/components/StoreBrandingWrapper";
import { useStoreContext } from "@/hooks/useStoreContext";

const Estoque = () => {
  const { selectedStore } = useStoreContext();

  // Fetch products with stock info for selected store
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["stock-products", selectedStore?.id],
    queryFn: async () => {
      if (!selectedStore?.id) return [];

      const { data, error } = await supabase
        .from("products")
        .select("id, name, stock_quantity, price, image_url")
        .eq("store_id", selectedStore.id)
        .order("stock_quantity", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedStore?.id,
  });

  // Calculate stats
  const totalStock = products.reduce((sum, p) => sum + p.stock_quantity, 0);
  const lowStockProducts = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5);
  const outOfStockProducts = products.filter(p => p.stock_quantity === 0);
  const alertas = [...outOfStockProducts.map(p => ({
    id: p.id,
    produto: p.name,
    mensagem: "Produto sem estoque",
    type: "critical" as const
  })), ...lowStockProducts.map(p => ({
    id: p.id,
    produto: p.name,
    mensagem: `Estoque baixo - apenas ${p.stock_quantity} unidades`,
    type: "warning" as const
  }))];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <StoreBrandingWrapper 
        title="Gerenciamento de Estoque"
        subtitle="Controle de entradas, saídas e alertas de estoque"
        showSelector={true}
      >
        <div className="container mx-auto px-6 py-8">
          {!selectedStore ? (
            <div className="text-center py-12 text-muted-foreground">
              Selecione uma empresa para ver o estoque
            </div>
          ) : isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Carregando estoque...
            </div>
          ) : (
            <>
              {alertas.length > 0 && (
                <Card 
                  className="mb-8 border-l-4"
                  style={{ borderLeftColor: "#ef4444" }}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Alertas de Estoque ({alertas.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {alertas.slice(0, 5).map((alerta) => (
                        <div key={alerta.id} className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg">
                          <div>
                            <p className="font-medium">{alerta.produto}</p>
                            <p className="text-sm text-muted-foreground">{alerta.mensagem}</p>
                          </div>
                          <Button variant="outline" size="sm">Reabastecer</Button>
                        </div>
                      ))}
                      {alertas.length > 5 && (
                        <p className="text-sm text-muted-foreground text-center pt-2">
                          E mais {alertas.length - 5} alertas...
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card
                  className="border-l-4"
                  style={{ borderLeftColor: selectedStore?.primary_color || "hsl(var(--border))" }}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">Total em Estoque</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p 
                      className="text-3xl font-bold"
                      style={{ color: selectedStore?.primary_color || undefined }}
                    >
                      {totalStock.toLocaleString("pt-BR")}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">unidades</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      Estoque Baixo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-yellow-600">{lowStockProducts.length}</p>
                    <p className="text-sm text-muted-foreground mt-1">produtos</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5 text-destructive" />
                      Sem Estoque
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-destructive">{outOfStockProducts.length}</p>
                    <p className="text-sm text-muted-foreground mt-1">produtos</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Produtos em Estoque</CardTitle>
                  <CardDescription>Todos os produtos e suas quantidades</CardDescription>
                </CardHeader>
                <CardContent>
                  {products.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum produto cadastrado ainda
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {products.map((product) => (
                        <div 
                          key={product.id} 
                          className="flex items-center justify-between p-4 border border-border rounded-lg"
                          style={{
                            borderLeftWidth: "4px",
                            borderLeftColor: product.stock_quantity === 0 
                              ? "#ef4444" 
                              : product.stock_quantity <= 5 
                                ? "#eab308" 
                                : selectedStore?.primary_color || "hsl(var(--border))"
                          }}
                        >
                          <div className="flex items-center gap-4">
                            {product.image_url ? (
                              <img 
                                src={product.image_url} 
                                alt={product.name}
                                className="h-12 w-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div 
                                className="h-12 w-12 rounded-lg flex items-center justify-center"
                                style={{ 
                                  backgroundColor: selectedStore?.primary_color 
                                    ? `${selectedStore.primary_color}20` 
                                    : "hsl(var(--muted))" 
                                }}
                              >
                                <Package 
                                  className="h-6 w-6" 
                                  style={{ color: selectedStore?.primary_color || "hsl(var(--muted-foreground))" }}
                                />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(product.price)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-medium">{product.stock_quantity} unidades</p>
                              {product.stock_quantity === 0 && (
                                <Badge variant="destructive">Sem estoque</Badge>
                              )}
                              {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                  Estoque baixo
                                </Badge>
                              )}
                            </div>
                            <Button variant="outline" size="sm">Ajustar</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </StoreBrandingWrapper>
    </div>
  );
};

export default Estoque;