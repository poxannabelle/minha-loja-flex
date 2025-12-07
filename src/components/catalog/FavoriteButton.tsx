import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  productId: string;
  className?: string;
}

const FavoriteButton = ({ productId, className }: FavoriteButtonProps) => {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkFavoriteStatus();
    }
  }, [user, productId]);

  const checkFavoriteStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("user_favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .maybeSingle();

    setIsFavorite(!!data);
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast.error("Faça login para favoritar produtos");
      return;
    }

    setLoading(true);

    if (isFavorite) {
      const { error } = await supabase
        .from("user_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);

      if (error) {
        toast.error("Erro ao remover dos favoritos");
      } else {
        setIsFavorite(false);
        toast.success("Removido dos favoritos");
      }
    } else {
      const { error } = await supabase
        .from("user_favorites")
        .insert({
          user_id: user.id,
          product_id: productId,
        });

      if (error) {
        toast.error("Erro ao adicionar aos favoritos");
      } else {
        setIsFavorite(true);
        toast.success("Adicionado aos favoritos");
      }
    }

    setLoading(false);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleFavorite}
      disabled={loading}
      className={cn(
        "rounded-full bg-background/80 backdrop-blur-sm hover:bg-background",
        className
      )}
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-colors",
          isFavorite ? "fill-destructive text-destructive" : "text-muted-foreground"
        )}
      />
    </Button>
  );
};

export default FavoriteButton;
