import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Star, Package } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import FavoriteButton from "@/components/catalog/FavoriteButton";
import ProductVariantModal from "@/components/catalog/ProductVariantModal";
import Navbar from "@/components/Navbar";
import StoreBrandingWrapper from "@/components/StoreBrandingWrapper";
import { useStoreContext } from "@/hooks/useStoreContext";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  category_id: string | null;
  store_id: string;
  stock_quantity: number;
}

const Catalogo = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    name: string;
    price: number;
    image: string;
  } | null>(null);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  
  const { selectedStore } = useStoreContext();

  // Fetch products for selected store
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["catalog-products", selectedStore?.id],
    queryFn: async () => {
      if (!selectedStore?.id) return [];

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories(name)
        `)
        .eq("store_id", selectedStore.id)
        .eq("status", "ativo");

      if (error) throw error;
      return data;
    },
    enabled: !!selectedStore?.id,
  });

  const displayProducts = products.map(p => ({
    ...p,
    category: p.categories?.name || "Geral",
    rating: 4.5,
    reviews: Math.floor(Math.random() * 200) + 50,
    discount: p.original_price ? Math.round(((p.original_price - p.price) / p.original_price) * 100) : 0,
    image: p.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
  }));

  const categories = ["all", ...new Set(displayProducts.map(p => p.category))];

  const filteredProducts = displayProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product: typeof displayProducts[0]) => {
    setSelectedProduct({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
    setVariantModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <StoreBrandingWrapper 
        title="Catálogo de Produtos"
        subtitle="Encontre os melhores produtos com as melhores ofertas"
        showSelector={true}
      >
        <div className="container mx-auto px-6 py-8">
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

          {!selectedStore ? (
            <div className="text-center py-12 text-muted-foreground">
              Selecione uma empresa para ver o catálogo
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div 
                className="animate-spin rounded-full h-8 w-8 border-b-2"
                style={{ borderColor: selectedStore?.primary_color || "hsl(var(--primary))" }}
              />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <Card 
                  key={product.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                  style={{
                    borderTopWidth: "3px",
                    borderTopColor: selectedStore?.primary_color || "transparent"
                  }}
                >
                  <CardHeader className="p-0">
                    <div className="relative">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-64 object-cover"
                      />
                      {product.discount > 0 && (
                        <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground">
                          -{product.discount}%
                        </Badge>
                      )}
                      <FavoriteButton 
                        productId={product.id} 
                        className="absolute top-4 right-4"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="mb-2">
                      <Badge 
                        variant="secondary" 
                        className="text-xs"
                        style={{
                          backgroundColor: selectedStore?.primary_color 
                            ? `${selectedStore.primary_color}20` 
                            : undefined,
                          color: selectedStore?.primary_color || undefined
                        }}
                      >
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
                      <span 
                        className="text-2xl font-bold"
                        style={{ color: selectedStore?.primary_color || "hsl(var(--foreground))" }}
                      >
                        R$ {product.price.toFixed(2)}
                      </span>
                      {product.original_price && product.original_price > product.price && (
                        <span className="text-sm text-muted-foreground line-through">
                          R$ {product.original_price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-6 pt-0">
                    <Button 
                      className="w-full gap-2"
                      style={{ 
                        backgroundColor: selectedStore?.primary_color || undefined,
                      }}
                      onClick={() => handleAddToCart(product)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Adicionar ao Carrinho
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </StoreBrandingWrapper>

      <ProductVariantModal
        open={variantModalOpen}
        onOpenChange={setVariantModalOpen}
        product={selectedProduct}
      />
    </div>
  );
};

export default Catalogo;