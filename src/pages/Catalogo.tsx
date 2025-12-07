import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Star } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import FavoriteButton from "@/components/catalog/FavoriteButton";
import ProductVariantModal from "@/components/catalog/ProductVariantModal";
import Navbar from "@/components/Navbar";

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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    name: string;
    price: number;
    image: string;
  } | null>(null);
  const [variantModalOpen, setVariantModalOpen] = useState(false);

  // Mock data for demo (when no real products in DB)
  const mockProducts = [
    {
      id: "mock-1",
      name: "Tênis Esportivo Premium",
      description: "Tênis de alta performance",
      price: 299.90,
      original_price: 399.90,
      image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
      category_id: null,
      store_id: "mock",
      stock_quantity: 10,
      category: "Calçados",
      rating: 4.5,
      reviews: 128,
    },
    {
      id: "mock-2",
      name: "Notebook Gamer Pro",
      description: "Notebook para jogos",
      price: 4299.00,
      original_price: 5499.00,
      image_url: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=400&fit=crop",
      category_id: null,
      store_id: "mock",
      stock_quantity: 5,
      category: "Eletrônicos",
      rating: 4.8,
      reviews: 89,
    },
    {
      id: "mock-3",
      name: "Cafeteira Expresso Automática",
      description: "Café profissional em casa",
      price: 899.00,
      original_price: 1299.00,
      image_url: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400&h=400&fit=crop",
      category_id: null,
      store_id: "mock",
      stock_quantity: 8,
      category: "Eletrodomésticos",
      rating: 4.6,
      reviews: 234,
    },
    {
      id: "mock-4",
      name: "Smart Watch Fitness",
      description: "Relógio inteligente",
      price: 599.00,
      original_price: 799.00,
      image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
      category_id: null,
      store_id: "mock",
      stock_quantity: 15,
      category: "Eletrônicos",
      rating: 4.4,
      reviews: 167,
    },
    {
      id: "mock-5",
      name: "Cadeira Gamer Ergonômica",
      description: "Conforto para longas sessões",
      price: 1299.00,
      original_price: 1799.00,
      image_url: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=400&fit=crop",
      category_id: null,
      store_id: "mock",
      stock_quantity: 3,
      category: "Móveis",
      rating: 4.7,
      reviews: 93,
    },
    {
      id: "mock-6",
      name: "Fone Bluetooth Cancelamento",
      description: "Som premium sem fios",
      price: 449.00,
      original_price: 699.00,
      image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
      category_id: null,
      store_id: "mock",
      stock_quantity: 20,
      category: "Eletrônicos",
      rating: 4.9,
      reviews: 312,
    },
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("status", "ativo");

    if (error) {
      console.error("Error fetching products:", error);
    }
    
    // Use real products if available, otherwise mock data
    setProducts(data && data.length > 0 ? data : []);
    setLoading(false);
  };

  const displayProducts = products.length > 0 ? products.map(p => ({
    ...p,
    category: "Geral",
    rating: 4.5,
    reviews: Math.floor(Math.random() * 200) + 50,
    discount: p.original_price ? Math.round(((p.original_price - p.price) / p.original_price) * 100) : 0,
    image: p.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
  })) : mockProducts.map(p => ({
    ...p,
    discount: p.original_price ? Math.round(((p.original_price - p.price) / p.original_price) * 100) : 0,
    image: p.image_url || "",
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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
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

        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Nenhum produto encontrado</p>
          </div>
        )}
      </div>

      <ProductVariantModal
        open={variantModalOpen}
        onOpenChange={setVariantModalOpen}
        product={selectedProduct}
      />
    </div>
  );
};

export default Catalogo;
