import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Building2 } from "lucide-react";

const Empresas = () => {
  const empresas = [
    { id: 1, nome: "Loja Exemplo 1", subdominio: "loja1.plazoo.com", plano: "Professional", status: "Ativa" },
    { id: 2, nome: "Loja Exemplo 2", subdominio: "loja2.plazoo.com", plano: "Starter", status: "Ativa" },
  ];

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
                <Input placeholder="Buscar por nome ou subdomínio..." />
              </div>
              <Button variant="outline" className="gap-2">
                <Search className="h-4 w-4" />
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {empresas.map((empresa) => (
            <Card key={empresa.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-accent/10 rounded-lg">
                      <Building2 className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <CardTitle>{empresa.nome}</CardTitle>
                      <CardDescription className="mt-1">{empresa.subdominio}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Ver Detalhes</Button>
                    <Button variant="outline" size="sm">Editar</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-8 text-sm">
                  <div>
                    <span className="text-muted-foreground">Plano:</span>
                    <span className="ml-2 font-medium">{empresa.plano}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <span className="ml-2 font-medium text-green-600">{empresa.status}</span>
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

export default Empresas;
