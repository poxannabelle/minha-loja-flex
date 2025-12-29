import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus } from "lucide-react";

interface MenuItemSize {
  id: string;
  name: string;
  price_adjustment: number;
  is_default: boolean;
}

interface MenuItemExtra {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
  max_quantity: number | null;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  image_url: string | null;
  is_available: boolean;
  preparation_time_minutes: number | null;
  sizes?: MenuItemSize[];
  extras?: MenuItemExtra[];
}

interface MenuItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem;
  onAddToCart: (
    item: MenuItem,
    quantity: number,
    selectedSize?: MenuItemSize,
    selectedExtras?: { extra: MenuItemExtra; quantity: number }[],
    notes?: string
  ) => void;
}

const MenuItemModal = ({ open, onOpenChange, item, onAddToCart }: MenuItemModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<MenuItemSize | undefined>(
    item.sizes?.find(s => s.is_default) || item.sizes?.[0]
  );
  const [selectedExtras, setSelectedExtras] = useState<Map<string, number>>(new Map());
  const [notes, setNotes] = useState("");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const calculateTotal = () => {
    let total = item.base_price;
    
    if (selectedSize) {
      total += selectedSize.price_adjustment;
    }
    
    selectedExtras.forEach((qty, extraId) => {
      const extra = item.extras?.find(e => e.id === extraId);
      if (extra) {
        total += extra.price * qty;
      }
    });
    
    return total * quantity;
  };

  const handleExtraToggle = (extra: MenuItemExtra) => {
    setSelectedExtras(prev => {
      const newMap = new Map(prev);
      if (newMap.has(extra.id)) {
        newMap.delete(extra.id);
      } else {
        newMap.set(extra.id, 1);
      }
      return newMap;
    });
  };

  const updateExtraQuantity = (extraId: string, delta: number) => {
    setSelectedExtras(prev => {
      const newMap = new Map(prev);
      const currentQty = newMap.get(extraId) || 0;
      const newQty = currentQty + delta;
      
      const extra = item.extras?.find(e => e.id === extraId);
      const maxQty = extra?.max_quantity || 10;
      
      if (newQty <= 0) {
        newMap.delete(extraId);
      } else if (newQty <= maxQty) {
        newMap.set(extraId, newQty);
      }
      
      return newMap;
    });
  };

  const handleAddToCart = () => {
    const extras: { extra: MenuItemExtra; quantity: number }[] = [];
    selectedExtras.forEach((qty, extraId) => {
      const extra = item.extras?.find(e => e.id === extraId);
      if (extra) {
        extras.push({ extra, quantity: qty });
      }
    });

    onAddToCart(item, quantity, selectedSize, extras, notes || undefined);
    
    // Reset state
    setQuantity(1);
    setSelectedSize(item.sizes?.find(s => s.is_default) || item.sizes?.[0]);
    setSelectedExtras(new Map());
    setNotes("");
  };

  const availableExtras = item.extras?.filter(e => e.is_available) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {item.image_url && (
          <img 
            src={item.image_url} 
            alt={item.name}
            className="w-full h-48 object-cover rounded-lg -mt-2"
          />
        )}
        
        <DialogHeader>
          <DialogTitle className="text-xl">{item.name}</DialogTitle>
          {item.description && (
            <p className="text-sm text-muted-foreground">{item.description}</p>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Sizes */}
          {item.sizes && item.sizes.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Tamanho</h4>
              <RadioGroup
                value={selectedSize?.id}
                onValueChange={(value) => {
                  const size = item.sizes?.find(s => s.id === value);
                  setSelectedSize(size);
                }}
              >
                {item.sizes.map(size => (
                  <div key={size.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={size.id} id={size.id} />
                      <Label htmlFor={size.id} className="cursor-pointer">
                        {size.name}
                      </Label>
                    </div>
                    {size.price_adjustment !== 0 && (
                      <span className="text-sm text-muted-foreground">
                        {size.price_adjustment > 0 ? "+" : ""}
                        {formatCurrency(size.price_adjustment)}
                      </span>
                    )}
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Extras */}
          {availableExtras.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Adicionais</h4>
              <div className="space-y-2">
                {availableExtras.map(extra => (
                  <div 
                    key={extra.id} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={extra.id}
                        checked={selectedExtras.has(extra.id)}
                        onCheckedChange={() => handleExtraToggle(extra)}
                      />
                      <Label htmlFor={extra.id} className="cursor-pointer">
                        {extra.name}
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        +{formatCurrency(extra.price)}
                      </span>
                      {selectedExtras.has(extra.id) && extra.max_quantity !== 1 && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateExtraQuantity(extra.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm">
                            {selectedExtras.get(extra.id)}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateExtraQuantity(extra.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <h4 className="font-medium mb-3">Observações</h4>
            <Textarea
              placeholder="Ex: Sem cebola, bem passado..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Quantity & Add to Cart */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button className="flex-1" size="lg" onClick={handleAddToCart}>
              Adicionar {formatCurrency(calculateTotal())}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MenuItemModal;
