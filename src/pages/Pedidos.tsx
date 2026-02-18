import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import StoreBrandingWrapper from "@/components/StoreBrandingWrapper";
import { useStoreContext } from "@/hooks/useStoreContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Clock, CheckCircle, Store, DollarSign } from "lucide-react";
import InStoreSaleForm from "@/components/pedidos/InStoreSaleForm";
import OrdersList from "@/components/pedidos/OrdersList";

const Pedidos = () => {
  const { selectedStore } = useStoreContext();
  const selectedStoreId = selectedStore?.id || "";

  // Buscar estatísticas de pedidos
  const { data: stats } = useQuery({
    queryKey: ["order-stats", selectedStoreId],
    queryFn: async () => {
      if (!selectedStoreId) return null;

      const { data: orders, error } = await supabase
        .from("orders")
        .select("status, total, order_type")
        .eq("store_id", selectedStoreId);

      if (error) throw error;

      const totalOrders = orders?.length || 0;
      const pendingOrders = orders?.filter(o => o.status === "pendente").length || 0;
      const completedOrders = orders?.filter(o => ["entregue", "finalizado"].includes(o.status)).length || 0;
      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
      const onlineOrders = orders?.filter(o => o.order_type === "online").length || 0;
      const storeOrders = orders?.filter(o => o.order_type === "loja").length || 0;

      return { totalOrders, pendingOrders, completedOrders, totalRevenue, onlineOrders, storeOrders };
    },
    enabled: !!selectedStoreId,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <StoreBrandingWrapper title="Pedidos e Compras" subtitle="Gerencie pedidos online e vendas na loja">
        <div className="container mx-auto px-6 py-8">
          {/* Estatísticas */}
          {stats && (
            <div className="grid md:grid-cols-6 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <ShoppingCart className="h-4 w-4" /> Online
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-600">{stats.onlineOrders}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Store className="h-4 w-4" /> Na Loja
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-purple-600">{stats.storeOrders}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" /> Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> Finalizados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">{stats.completedOrders}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-4 w-4" /> Faturamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {stats.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {selectedStoreId ? (
            <div className="grid lg:grid-cols-2 gap-8">
              <InStoreSaleForm storeId={selectedStoreId} />
              <OrdersList storeId={selectedStoreId} />
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Selecione uma loja para visualizar os pedidos.
              </CardContent>
            </Card>
          )}
        </div>
      </StoreBrandingWrapper>
    </div>
  );
};

export default Pedidos;
