import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface ProductVariant {
  id: string;
  variant_type: string;
  variant_value: string;
  price_adjustment: number;
  stock_quantity: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface ProductVariantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

const ProductVariantModal = ({ open, onOpenChange, product }: ProductVariantModalProps) => {
  const { user } = useAuth();
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (open && product) {
      fetchVariants();
    }
  }, [open, product]);

  const fetchVariants = async () => {
    if (!product) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", product.id);

    if (error) {
      console.error("Error fetching variants:", error);
    } else {
      setVariants(data || []);
      // Reset selections
      setSelectedVariants({});
    }
    setLoading(false);
  };

  const variantsByType = variants.reduce((acc, variant) => {
    if (!acc[variant.variant_type]) {
      acc[variant.variant_type] = [];
    }
    acc[variant.variant_type].push(variant);
    return acc;
  }, {} as Record<string, ProductVariant[]>);

  const variantTypeLabels: Record<string, string> = {
    cor: "Cor",
    tamanho: "Tamanho",
    modelo: "Modelo",
  };

  const calculateFinalPrice = () => {
    if (!product) return 0;
    let price = product.price;
    
    Object.values(selectedVariants).forEach(variantId => {
      const variant = variants.find(v => v.id === variantId);
      if (variant) {
        price += Number(variant.price_adjustment);
      }
    });
    
    return price;
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Faça login para adicionar ao carrinho");
      return;
    }

    if (!product) return;

    // Check if all variant types are selected
    const requiredTypes = Object.keys(variantsByType);
    const missingTypes = requiredTypes.filter(type => !selectedVariants[type]);
    
    if (missingTypes.length > 0) {
      toast.error(`Selecione: ${missingTypes.map(t => variantTypeLabels[t] || t).join(", ")}`);
      return;
    }

    setAddingToCart(true);

    // Build selected variants object for storage
    const variantsData: Record<string, string> = {};
    Object.entries(selectedVariants).forEach(([type, variantId]) => {
      const variant = variants.find(v => v.id === variantId);
      if (variant) {
        variantsData[type] = variant.variant_value;
      }
    });

    // Check if item already exists in cart with same variants
    const { data: existingItem } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .eq("selected_variants", variantsData)
      .maybeSingle();

    if (existingItem) {
      // Update quantity
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: existingItem.quantity + 1 })
        .eq("id", existingItem.id);

      if (error) {
        toast.error("Erro ao atualizar carrinho");
      } else {
        toast.success("Quantidade atualizada no carrinho!");
        onOpenChange(false);
      }
    } else {
      // Insert new item
      const { error } = await supabase
        .from("cart_items")
        .insert({
          user_id: user.id,
          product_id: product.id,
          quantity: 1,
          selected_variants: variantsData,
        });

      if (error) {
        toast.error("Erro ao adicionar ao carrinho");
      } else {
        toast.success("Produto adicionado ao carrinho!");
        onOpenChange(false);
      }
    }

    setAddingToCart(false);
  };

  const handleAddToCartSimple = async () => {
    if (!user) {
      toast.error("Faça login para adicionar ao carrinho");
      return;
    }

    if (!product) return;

    setAddingToCart(true);

    // Check if item already exists
    const { data: existingItem } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .maybeSingle();

    if (existingItem) {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: existingItem.quantity + 1 })
        .eq("id", existingItem.id);

      if (error) {
        toast.error("Erro ao atualizar carrinho");
      } else {
        toast.success("Quantidade atualizada!");
        onOpenChange(false);
      }
    } else {
      const { error } = await supabase
        .from("cart_items")
        .insert({
          user_id: user.id,
          product_id: product.id,
          quantity: 1,
          selected_variants: {},
        });

      if (error) {
        toast.error("Erro ao adicionar ao carrinho");
      } else {
        toast.success("Produto adicionado ao carrinho!");
        onOpenChange(false);
      }
    }

    setAddingToCart(false);
  };

  if (!product) return null;

  const hasVariants = Object.keys(variantsByType).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <img
              src={product.image}
              alt={product.name}
              className="h-12 w-12 rounded-lg object-cover"
            />
            <span className="line-clamp-2">{product.name}</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : hasVariants ? (
          <div className="space-y-6 py-4">
            {Object.entries(variantsByType).map(([type, typeVariants]) => (
              <div key={type} className="space-y-3">
                <Label className="text-base font-medium">
                  {variantTypeLabels[type] || type}
                </Label>
                <RadioGroup
                  value={selectedVariants[type] || ""}
                  onValueChange={(value) =>
                    setSelectedVariants((prev) => ({ ...prev, [type]: value }))
                  }
                  className="flex flex-wrap gap-2"
                >
                  {typeVariants.map((variant) => (
                    <div key={variant.id}>
                      <RadioGroupItem
                        value={variant.id}
                        id={variant.id}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={variant.id}
                        className="flex cursor-pointer items-center justify-center rounded-md border-2 border-muted bg-popover px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground"
                      >
                        {variant.variant_value}
                        {variant.price_adjustment > 0 && (
                          <span className="ml-1 text-xs opacity-70">
                            (+R$ {variant.price_adjustment.toFixed(2)})
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Preço final:</span>
                <span className="text-2xl font-bold text-foreground">
                  R$ {calculateFinalPrice().toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-muted-foreground">
            <p>Este produto não possui variantes.</p>
            <p className="text-2xl font-bold text-foreground mt-2">
              R$ {product.price.toFixed(2)}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={hasVariants ? handleAddToCart : handleAddToCartSimple}
            disabled={addingToCart}
            className="w-full gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            {addingToCart ? "Adicionando..." : "Adicionar ao Carrinho"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductVariantModal;
