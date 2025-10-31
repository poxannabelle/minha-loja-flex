import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Star } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Catalogo = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const products = [
    {
      id: 1,
      name: "Tênis Esportivo Premium",
      category: "Calçados",
      price: 299.90,
      originalPrice: 399.90,
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
      rating: 4.5,
      reviews: 128,
      discount: 25
    },
    {
      id: 2,
      name: "Notebook Gamer Pro",
      category: "Eletrônicos",
      price: 4299.00,
      originalPrice: 5499.00,
      image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=400&fit=crop",
      rating: 4.8,
      reviews: 89,
      discount: 22
    },
    {
      id: 3,
      name: "Cafeteira Expresso Automática",
      category: "Eletrodomésticos",
      price: 899.00,
      originalPrice: 1299.00,
      image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400&h=400&fit=crop",
      rating: 4.6,
      reviews: 234,
      discount: 31
    },
    {
      id: 4,
      name: "Smart Watch Fitness",
      category: "Eletrônicos",
      price: 599.00,
      originalPrice: 799.00,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
      rating: 4.4,
      reviews: 167,
      discount: 25
    },
    {
      id: 5,
      name: "Cadeira Gamer Ergonômica",
      category: "Móveis",
      price: 1299.00,
      originalPrice: 1799.00,
      image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=400&fit=crop",
      rating: 4.7,
      reviews: 93,
      discount: 28
    },
    {
      id: 6,
      name: "Fone Bluetooth Cancelamento",
      category: "Eletrônicos",
      price: 449.00,
      originalPrice: 699.00,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
      rating: 4.9,
      reviews: 312,
      discount: 36
    }
  ];

  const categories = ["all", "Eletrônicos", "Calçados", "Eletrodomésticos", "Móveis"];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Catálogo de Produtos</h1>
          <p className="text-muted-foreground">Encontre os melhores produtos com as melhores ofertas</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              {categories.slice(1).map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="p-0">
                <div className="relative">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-64 object-cover"
                  />
                  {product.discount > 0 && (
                    <Badge className="absolute top-4 right-4 bg-destructive text-destructive-foreground">
                      -{product.discount}%
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {product.category}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{product.name}</h3>
                
                <div className="flex items-center gap-1 mb-3">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{product.rating}</span>
                  <span className="text-sm text-muted-foreground">({product.reviews})</span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">
                    R$ {product.price.toFixed(2)}
                  </span>
                  {product.originalPrice > product.price && (
                    <span className="text-sm text-muted-foreground line-through">
                      R$ {product.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Button className="w-full gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Adicionar ao Carrinho
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Nenhum produto encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Catalogo;
