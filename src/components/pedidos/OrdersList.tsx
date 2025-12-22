import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Store, Clock, CheckCircle, XCircle, Package, Truck } from "lucide-react";

interface OrdersListProps {
  storeId: string;
}

const OrdersList = ({ storeId }: OrdersListProps) => {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            products (name, image_url),
            product_variants (variant_type, variant_value)
          )
        `)
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!storeId,
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
      pendente: { icon: <Clock className="h-3 w-3" />, label: "Pendente", className: "bg-yellow-600" },
      aprovado: { icon: <CheckCircle className="h-3 w-3" />, label: "Aprovado", className: "bg-blue-600" },
      em_preparacao: { icon: <Package className="h-3 w-3" />, label: "Em Preparação", className: "bg-purple-600" },
      enviado: { icon: <Truck className="h-3 w-3" />, label: "Enviado", className: "bg-indigo-600" },
      entregue: { icon: <CheckCircle className="h-3 w-3" />, label: "Entregue", className: "bg-green-600" },
      finalizado: { icon: <CheckCircle className="h-3 w-3" />, label: "Finalizado", className: "bg-green-600" },
      cancelado: { icon: <XCircle className="h-3 w-3" />, label: "Cancelado", className: "bg-destructive" },
    };

    const config = statusConfig[status] || { icon: null, label: status, className: "" };
    
    return (
      <Badge className={`gap-1 ${config.className}`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const onlineOrders = orders?.filter(o => o.order_type === "online") || [];
  const storeOrders = orders?.filter(o => o.order_type === "loja") || [];

  const renderOrdersList = (ordersList: typeof orders) => {
    if (!ordersList || ordersList.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum pedido encontrado
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {ordersList.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent/10 rounded-lg">
                {order.order_type === "online" ? (
                  <ShoppingCart className="h-6 w-6 text-accent" />
                ) : (
                  <Store className="h-6 w-6 text-accent" />
                )}
              </div>
              <div>
                <p className="font-medium">#{order.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-sm text-muted-foreground">
                  {order.customer_name || "Cliente não identificado"}
                </p>
                {order.customer_phone && (
                  <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div>
                <p className="text-sm text-muted-foreground">Itens</p>
                <p className="font-medium">{order.order_items?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor</p>
                <p className="font-medium text-lg">R$ {Number(order.total).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="font-medium text-sm">{formatDate(order.created_at)}</p>
              </div>
              <div className="min-w-[120px]">
                {getStatusBadge(order.status)}
              </div>
              <Button variant="outline" size="sm">
                Ver Detalhes
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Carregando pedidos...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pedidos e Compras</CardTitle>
        <CardDescription>Gerencie pedidos online e vendas na loja</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="online">
          <TabsList className="mb-4">
            <TabsTrigger value="online" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Pedidos Online ({onlineOrders.length})
            </TabsTrigger>
            <TabsTrigger value="loja" className="gap-2">
              <Store className="h-4 w-4" />
              Vendas na Loja ({storeOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="online">
            {renderOrdersList(onlineOrders)}
          </TabsContent>

          <TabsContent value="loja">
            {renderOrdersList(storeOrders)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default OrdersList;
