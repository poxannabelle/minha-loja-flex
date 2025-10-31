import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Clock, CheckCircle, XCircle } from "lucide-react";

const Pedidos = () => {
  const pedidos = [
    { 
      id: "PED-001", 
      cliente: "João Silva", 
      valor: "R$ 450,00", 
      status: "pendente",
      data: "01/11/2025",
      items: 3
    },
    { 
      id: "PED-002", 
      cliente: "Maria Santos", 
      valor: "R$ 320,00", 
      status: "aprovado",
      data: "31/10/2025",
      items: 2
    },
    { 
      id: "PED-003", 
      cliente: "Carlos Oliveira", 
      valor: "R$ 180,00", 
      status: "entregue",
      data: "30/10/2025",
      items: 1
    },
    { 
      id: "PED-004", 
      cliente: "Ana Costa", 
      valor: "R$ 90,00", 
      status: "cancelado",
      data: "29/10/2025",
      items: 1
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pendente</Badge>;
      case "aprovado":
        return <Badge className="gap-1 bg-blue-600"><CheckCircle className="h-3 w-3" />Aprovado</Badge>;
      case "entregue":
        return <Badge className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" />Entregue</Badge>;
      case "cancelado":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Pedidos e Compras</h1>
          <p className="text-muted-foreground">Gerencie todos os pedidos da plataforma</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">156</p>
              <p className="text-sm text-muted-foreground mt-1">este mês</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">12</p>
              <p className="text-sm text-muted-foreground mt-1">aguardando</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aprovados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">28</p>
              <p className="text-sm text-muted-foreground mt-1">em processamento</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Faturamento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">R$ 45.2k</p>
              <p className="text-sm text-muted-foreground mt-1">este mês</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pedidos Recentes</CardTitle>
            <CardDescription>Lista de todos os pedidos realizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pedidos.map((pedido) => (
                <div key={pedido.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent/10 rounded-lg">
                      <ShoppingCart className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium">{pedido.id}</p>
                      <p className="text-sm text-muted-foreground">{pedido.cliente}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div>
                      <p className="text-sm text-muted-foreground">Items</p>
                      <p className="font-medium">{pedido.items}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valor</p>
                      <p className="font-medium text-lg">{pedido.valor}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data</p>
                      <p className="font-medium">{pedido.data}</p>
                    </div>
                    <div className="min-w-[120px]">
                      {getStatusBadge(pedido.status)}
                    </div>
                    <Button variant="outline" size="sm">Ver Detalhes</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Pedidos;
