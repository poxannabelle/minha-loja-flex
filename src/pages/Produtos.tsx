import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Package } from "lucide-react";

const Produtos = () => {
  const produtos = [
    { id: 1, nome: "Produto A", categoria: "Eletrônicos", preco: "R$ 299,90", estoque: 45, status: "Disponível" },
    { id: 2, nome: "Produto B", categoria: "Vestuário", preco: "R$ 89,90", estoque: 120, status: "Disponível" },
    { id: 3, nome: "Produto C", categoria: "Alimentos", preco: "R$ 15,90", estoque: 5, status: "Estoque Baixo" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Catálogo de Produtos</h1>
            <p className="text-muted-foreground">Gerencie todos os produtos disponíveis</p>
          </div>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
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
                <Input placeholder="Buscar por nome ou categoria..." />
              </div>
              <Button variant="outline" className="gap-2">
                <Search className="h-4 w-4" />
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {produtos.map((produto) => (
            <Card key={produto.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-accent/10 rounded-lg">
                      <Package className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <CardTitle>{produto.nome}</CardTitle>
                      <CardDescription className="mt-1">{produto.categoria}</CardDescription>
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
                    <span className="ml-2 font-medium text-lg">{produto.preco}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Estoque:</span>
                    <span className="ml-2 font-medium">{produto.estoque} unidades</span>
                  </div>
                  <div>
                    <Badge variant={produto.status === "Disponível" ? "default" : "destructive"}>
                      {produto.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Produtos;
