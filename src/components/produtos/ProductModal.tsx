import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Package, Palette, Ruler, Image, DollarSign } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId?: string;
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
  
  // Stock
  const [code, setCode] = useState("");
  const [quantity, setQuantity] = useState("");
  const [safetyStock, setSafetyStock] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");

  const createProductMutation = useMutation({
    mutationFn: async () => {
      if (!storeId) throw new Error("Store ID is required");
      
      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          store_id: storeId,
          name,
          description,
          image_url: imageUrl || null,
          price: parseFloat(price) || 0,
          original_price: originalPrice ? parseFloat(originalPrice) : null,
          stock_quantity: parseInt(quantity) || 0,
          status: "rascunho",
        })
        .select()
        .single();

      if (productError) throw productError;

      // Create color variants
      for (const color of colors) {
        await supabase.from("product_variants").insert({
          product_id: product.id,
          variant_type: "cor",
          variant_value: color,
          stock_quantity: 0,
        });
      }

      // Create size variants
      for (const size of sizes) {
        await supabase.from("product_variants").insert({
          product_id: product.id,
          variant_type: "tamanho",
          variant_value: size,
          stock_quantity: 0,
        });
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
    setCode("");
    setQuantity("");
    setSafetyStock("");
    setImageUrl("");
    setPrice("");
    setOriginalPrice("");
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
    if (!price) {
      toast.error("Preço do produto é obrigatório");
      return;
    }
    createProductMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Cadastrar Novo Produto
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="dimensions">Dimensões</TabsTrigger>
            <TabsTrigger value="variations">Variações</TabsTrigger>
            <TabsTrigger value="stock">Estoque</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do produto"
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição detalhada do produto"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Marca do produto"
                />
              </div>

              <div>
                <Label htmlFor="model">Modelo</Label>
                <Input
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Modelo do produto"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dimensions" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <Ruler className="h-4 w-4" />
              <span className="text-sm">Dimensões para cálculo de frete</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="width">Largura (cm)</Label>
                <Input
                  id="width"
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="depth">Profundidade (cm)</Label>
                <Input
                  id="depth"
                  type="number"
                  value={depth}
                  onChange={(e) => setDepth(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="variations" className="space-y-6 mt-4">
            {/* Colors */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <Label>Cores</Label>
              </div>
              
              <div className="flex gap-2">
                <Input
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  placeholder="Adicionar cor (ex: Azul)"
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
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeColor(color)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Sizes */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <Label>Tamanhos</Label>
              </div>
              
              <div className="flex gap-2">
                <Input
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  placeholder="Adicionar tamanho (ex: M, G, 42)"
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
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeSize(size)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stock" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Código (SKU)</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="SKU-001"
                />
              </div>

              <div>
                <Label htmlFor="quantity">Quantidade em Estoque</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="safetyStock">Estoque de Segurança</Label>
                <Input
                  id="safetyStock"
                  type="number"
                  value={safetyStock}
                  onChange={(e) => setSafetyStock(e.target.value)}
                  placeholder="5"
                />
              </div>

              <div>
                <Label htmlFor="imageUrl" className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  URL da Foto
                </Label>
                <Input
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="price" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Valor de Venda *
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="originalPrice">Valor de Origem (Custo)</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  step="0.01"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
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
