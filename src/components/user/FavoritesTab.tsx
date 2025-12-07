import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Trash2, Heart, ShoppingCart } from "lucide-react";

interface Favorite {
  id: string;
  product_id: string;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    original_price: number | null;
  } | null;
}

const FavoritesTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from("user_favorites")
        .select(`
          id,
          product_id,
          product:products(id, name, price, image_url, original_price)
        `)
        .eq("user_id", user?.id);

      if (error) throw error;
      setFavorites((data as unknown as Favorite[]) || []);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (id: string) => {
    try {
      const { error } = await supabase.from("user_favorites").delete().eq("id", id);
      if (error) throw error;

      toast({
        title: "Favorito removido",
        description: "O produto foi removido dos favoritos.",
      });
      fetchFavorites();
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o favorito.",
        variant: "destructive",
      });
    }
  };

  const addToCart = async (productId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("cart_items").upsert(
        {
          user_id: user.id,
          product_id: productId,
          quantity: 1,
        },
        { onConflict: "user_id,product_id" }
      );

      if (error) throw error;

      toast({
        title: "Adicionado ao carrinho",
        description: "O produto foi adicionado ao carrinho.",
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar ao carrinho.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meus Favoritos</CardTitle>
        <CardDescription>
          {favorites.length} {favorites.length === 1 ? "produto" : "produtos"} favoritos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {favorites.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum produto favoritado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((fav) => (
              <div key={fav.id} className="border rounded-lg overflow-hidden">
                <img
                  src={fav.product?.image_url || "https://via.placeholder.com/200"}
                  alt={fav.product?.name || "Produto"}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4">
                  <h4 className="font-medium mb-2">{fav.product?.name || "Produto indisponível"}</h4>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-lg font-bold">
                      R$ {fav.product?.price.toFixed(2)}
                    </span>
                    {fav.product?.original_price && fav.product.original_price > fav.product.price && (
                      <span className="text-sm text-muted-foreground line-through">
                        R$ {fav.product.original_price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => fav.product && addToCart(fav.product.id)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Carrinho
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFavorite(fav.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FavoritesTab;
