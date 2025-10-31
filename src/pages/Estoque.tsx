import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle, ArrowDownCircle, AlertTriangle } from "lucide-react";

const Estoque = () => {
  const movimentacoes = [
    { id: 1, produto: "Produto A", tipo: "entrada", quantidade: 50, data: "01/11/2025", usuario: "Admin" },
    { id: 2, produto: "Produto B", tipo: "saida", quantidade: 10, data: "31/10/2025", usuario: "Vendedor 1" },
    { id: 3, produto: "Produto C", tipo: "entrada", quantidade: 20, data: "30/10/2025", usuario: "Admin" },
  ];

  const alertas = [
    { id: 1, produto: "Produto C", mensagem: "Estoque baixo - apenas 5 unidades" },
    { id: 2, produto: "Produto D", mensagem: "Produto sem estoque" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Gerenciamento de Estoque</h1>
          <p className="text-muted-foreground">Controle de entradas, saídas e alertas de estoque</p>
        </div>

        {alertas.length > 0 && (
          <Card className="mb-8 border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Alertas de Estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alertas.map((alerta) => (
                  <div key={alerta.id} className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg">
                    <div>
                      <p className="font-medium">{alerta.produto}</p>
                      <p className="text-sm text-muted-foreground">{alerta.mensagem}</p>
                    </div>
                    <Button variant="outline" size="sm">Reabastecer</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total em Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">1.245</p>
              <p className="text-sm text-muted-foreground mt-1">unidades</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5 text-green-600" />
                Entradas (30d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">+320</p>
              <p className="text-sm text-muted-foreground mt-1">unidades</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowDownCircle className="h-5 w-5 text-destructive" />
                Saídas (30d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-destructive">-180</p>
              <p className="text-sm text-muted-foreground mt-1">unidades</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Movimentações Recentes</CardTitle>
            <CardDescription>Histórico de entradas e saídas de produtos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {movimentacoes.map((mov) => (
                <div key={mov.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-4">
                    {mov.tipo === "entrada" ? (
                      <ArrowUpCircle className="h-8 w-8 text-green-600" />
                    ) : (
                      <ArrowDownCircle className="h-8 w-8 text-destructive" />
                    )}
                    <div>
                      <p className="font-medium">{mov.produto}</p>
                      <p className="text-sm text-muted-foreground">
                        {mov.tipo === "entrada" ? "Entrada" : "Saída"} - {mov.usuario}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {mov.tipo === "entrada" ? "+" : "-"}{mov.quantidade} unidades
                    </p>
                    <p className="text-sm text-muted-foreground">{mov.data}</p>
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

export default Estoque;
