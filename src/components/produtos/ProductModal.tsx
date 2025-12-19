import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X, Plus, Package, Palette, Ruler, Image, DollarSign, Boxes } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId?: string;
}

interface VariantStock {
  color: string;
  size: string;
  code: string;
  quantity: string;
  safetyStock: string;
  price: string;
  costPrice: string;
  imageUrl: string;
}

const ProductModal = ({ open, onOpenChange, storeId }: ProductModalProps) => {
  const queryClient = useQueryClient();
  
  // Basic info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  
  // Dimensions
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [depth, setDepth] = useState("");
  const [weight, setWeight] = useState("");
  
  // Variations
  const [colors, setColors] = useState<string[]>([]);
  const [newColor, setNewColor] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [newSize, setNewSize] = useState("");
  
  // Stock per variant
  const [variantStocks, setVariantStocks] = useState<Record<string, VariantStock>>({});

  // Generate variant combinations
  const variantCombinations = useMemo(() => {
    if (colors.length === 0 && sizes.length === 0) return [];
    if (colors.length === 0) return sizes.map(s => ({ color: "", size: s, key: `_${s}` }));
    if (sizes.length === 0) return colors.map(c => ({ color: c, size: "", key: `${c}_` }));
    
    const combos: { color: string; size: string; key: string }[] = [];
    colors.forEach(color => {
      sizes.forEach(size => {
        combos.push({ color, size, key: `${color}_${size}` });
      });
    });
    return combos;
  }, [colors, sizes]);

  const updateVariantStock = (key: string, field: keyof VariantStock, value: string) => {
    setVariantStocks(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        color: prev[key]?.color || "",
        size: prev[key]?.size || "",
        code: prev[key]?.code || "",
        quantity: prev[key]?.quantity || "",
        safetyStock: prev[key]?.safetyStock || "",
        price: prev[key]?.price || "",
        costPrice: prev[key]?.costPrice || "",
        imageUrl: prev[key]?.imageUrl || "",
        [field]: value,
      },
    }));
  };

  const createProductMutation = useMutation({
    mutationFn: async () => {
      if (!storeId) throw new Error("Store ID is required");
      
      // Calculate total stock and base price
      const totalStock = Object.values(variantStocks).reduce(
        (sum, v) => sum + (parseInt(v.quantity) || 0), 0
      );
      const firstVariantPrice = Object.values(variantStocks)[0]?.price;
      const basePrice = parseFloat(firstVariantPrice) || 0;

      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          store_id: storeId,
          name,
          description,
          price: basePrice,
          stock_quantity: totalStock,
          status: "rascunho",
        })
        .select()
        .single();

      if (productError) throw productError;

      // Create variants with stock
      for (const combo of variantCombinations) {
        const stock = variantStocks[combo.key];
        if (!stock) continue;

        if (combo.color) {
          await supabase.from("product_variants").insert({
            product_id: product.id,
            variant_type: "cor",
            variant_value: combo.color,
            stock_quantity: parseInt(stock.quantity) || 0,
            price_adjustment: 0,
            image_url: stock.imageUrl || null,
          });
        }

        if (combo.size) {
          await supabase.from("product_variants").insert({
            product_id: product.id,
            variant_type: "tamanho",
            variant_value: combo.size,
            stock_quantity: parseInt(stock.quantity) || 0,
            price_adjustment: 0,
          });
        }
      }

      return product;
    },
    onSuccess: () => {
      toast.success("Produto cadastrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao cadastrar produto");
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setBrand("");
    setModel("");
    setWidth("");
    setHeight("");
    setDepth("");
    setWeight("");
    setColors([]);
    setNewColor("");
    setSizes([]);
    setNewSize("");
    setVariantStocks({});
  };

  const addColor = () => {
    if (newColor && !colors.includes(newColor)) {
      setColors([...colors, newColor]);
      setNewColor("");
    }
  };

  const removeColor = (color: string) => {
    setColors(colors.filter((c) => c !== color));
  };

  const addSize = () => {
    if (newSize && !sizes.includes(newSize)) {
      setSizes([...sizes, newSize]);
      setNewSize("");
    }
  };

  const removeSize = (size: string) => {
    setSizes(sizes.filter((s) => s !== size));
  };

  const handleSubmit = () => {
    if (!name) {
      toast.error("Nome do produto é obrigatório");
      return;
    }
    if (variantCombinations.length === 0) {
      toast.error("Adicione pelo menos uma variação (cor ou tamanho)");
      return;
    }
    createProductMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Cadastrar Novo Produto
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT FRAME - Product Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Informações do Produto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome do produto"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição detalhada"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="brand">Marca</Label>
                    <Input
                      id="brand"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="Marca"
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">Modelo</Label>
                    <Input
                      id="model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="Modelo"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Dimensões e Peso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Largura (cm)</Label>
                    <Input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Altura (cm)</Label>
                    <Input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Profundidade (cm)</Label>
                    <Input
                      type="number"
                      value={depth}
                      onChange={(e) => setDepth(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Peso (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Variações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Colors */}
                <div className="space-y-2">
                  <Label>Cores</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      placeholder="Ex: Azul, Vermelho"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addColor())}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={addColor}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color) => (
                      <Badge key={color} variant="secondary" className="gap-1">
                        {color}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeColor(color)} />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Sizes */}
                <div className="space-y-2">
                  <Label>Tamanhos</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newSize}
                      onChange={(e) => setNewSize(e.target.value)}
                      placeholder="Ex: P, M, G, 38, 40"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSize())}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={addSize}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => (
                      <Badge key={size} variant="secondary" className="gap-1">
                        {size}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeSize(size)} />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT FRAME - Stock per Variation */}
          <div>
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Boxes className="h-4 w-4" />
                  Estoque por Variação
                </CardTitle>
              </CardHeader>
              <CardContent>
                {variantCombinations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Boxes className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Adicione cores ou tamanhos para configurar o estoque de cada variação</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {variantCombinations.map((combo) => (
                      <div key={combo.key} className="p-3 border rounded-lg space-y-3">
                        <div className="flex items-center gap-2">
                          {combo.color && <Badge variant="outline">{combo.color}</Badge>}
                          {combo.size && <Badge variant="secondary">{combo.size}</Badge>}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Código (SKU)</Label>
                            <Input
                              value={variantStocks[combo.key]?.code || ""}
                              onChange={(e) => updateVariantStock(combo.key, "code", e.target.value)}
                              placeholder="SKU-001"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Quantidade</Label>
                            <Input
                              type="number"
                              value={variantStocks[combo.key]?.quantity || ""}
                              onChange={(e) => updateVariantStock(combo.key, "quantity", e.target.value)}
                              placeholder="0"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Estoque Segurança</Label>
                            <Input
                              type="number"
                              value={variantStocks[combo.key]?.safetyStock || ""}
                              onChange={(e) => updateVariantStock(combo.key, "safetyStock", e.target.value)}
                              placeholder="5"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              Valor Venda
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={variantStocks[combo.key]?.price || ""}
                              onChange={(e) => updateVariantStock(combo.key, "price", e.target.value)}
                              placeholder="0.00"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Valor Origem</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={variantStocks[combo.key]?.costPrice || ""}
                              onChange={(e) => updateVariantStock(combo.key, "costPrice", e.target.value)}
                              placeholder="0.00"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs flex items-center gap-1">
                              <Image className="h-3 w-3" />
                              URL Foto
                            </Label>
                            <Input
                              value={variantStocks[combo.key]?.imageUrl || ""}
                              onChange={(e) => updateVariantStock(combo.key, "imageUrl", e.target.value)}
                              placeholder="https://..."
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createProductMutation.isPending}
          >
            {createProductMutation.isPending ? "Salvando..." : "Cadastrar Produto"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductModal;
