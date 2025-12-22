import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Plus, Minus, Trash2, ShoppingBag, User } from "lucide-react";

interface CartItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
}

interface InStoreSaleFormProps {
  storeId: string;
}

const InStoreSaleForm = ({ storeId }: InStoreSaleFormProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  
  const queryClient = useQueryClient();

  // Buscar produtos
  const { data: products } = useQuery({
    queryKey: ["products-search", storeId, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*")
        .eq("store_id", storeId)
        .eq("status", "ativo");

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!storeId,
  });

  // Buscar variantes do produto selecionado
  const { data: variants } = useQuery({
    queryKey: ["product-variants", selectedProductId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", selectedProductId);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProductId,
  });

  const selectedProduct = products?.find(p => p.id === selectedProductId);

  const addToCart = () => {
    if (!selectedProduct) {
      toast.error("Selecione um produto");
      return;
    }

    const variant = variants?.find(v => v.id === selectedVariantId);
    const unitPrice = selectedProduct.price + (variant?.price_adjustment || 0);

    const existingIndex = cart.findIndex(
      item => item.productId === selectedProductId && item.variantId === (selectedVariantId || undefined)
    );

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += quantity;
      setCart(newCart);
    } else {
      setCart([
        ...cart,
        {
          productId: selectedProductId,
          productName: selectedProduct.name,
          variantId: selectedVariantId || undefined,
          variantName: variant ? `${variant.variant_type}: ${variant.variant_value}` : undefined,
          quantity,
          unitPrice,
          imageUrl: variant?.image_url || selectedProduct.image_url || undefined,
        },
      ]);
    }

    // Reset
    setSelectedProductId("");
    setSelectedVariantId("");
    setQuantity(1);
    setSearchTerm("");
    toast.success("Produto adicionado ao carrinho");
  };

  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(index);
      return;
    }
    const newCart = [...cart];
    newCart[index].quantity = newQuantity;
    setCart(newCart);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const total = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Criar pedido
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          store_id: storeId,
          customer_name: customerName || null,
          customer_phone: customerPhone || null,
          customer_email: customerEmail || null,
          order_type: "loja",
          status: "finalizado",
          total,
          payment_method: paymentMethod || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Criar itens do pedido
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        variant_id: item.variantId || null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.unitPrice * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: () => {
      toast.success("Venda registrada com sucesso!");
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setPaymentMethod("");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      toast.error("Erro ao registrar venda: " + error.message);
    },
  });

  const handleFinalizeSale = () => {
    if (cart.length === 0) {
      toast.error("Adicione produtos ao carrinho");
      return;
    }
    createOrderMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          Registrar Venda na Loja
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Busca de Produto */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Buscar Produto</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome ou SKU do produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Lista de produtos encontrados */}
          {searchTerm && products && products.length > 0 && (
            <div className="border border-border rounded-lg max-h-40 overflow-y-auto">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => {
                    setSelectedProductId(product.id);
                    setSearchTerm("");
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-accent/10 flex items-center gap-3 border-b border-border last:border-0"
                >
                  {product.image_url && (
                    <img src={product.image_url} alt={product.name} className="w-10 h-10 object-cover rounded" />
                  )}
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      R$ {Number(product.price).toFixed(2)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Produto selecionado */}
          {selectedProduct && (
            <div className="p-4 border border-border rounded-lg bg-accent/5">
              <div className="flex items-center gap-4">
                {selectedProduct.image_url && (
                  <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-16 h-16 object-cover rounded" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{selectedProduct.name}</p>
                  <p className="text-sm text-muted-foreground">
                    R$ {Number(selectedProduct.price).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Variantes */}
              {variants && variants.length > 0 && (
                <div className="mt-4">
                  <Label>Variação</Label>
                  <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a variação" />
                    </SelectTrigger>
                    <SelectContent>
                      {variants.map((variant) => (
                        <SelectItem key={variant.id} value={variant.id}>
                          {variant.variant_type}: {variant.variant_value}
                          {variant.price_adjustment !== 0 && (
                            <span className="ml-2 text-muted-foreground">
                              ({variant.price_adjustment > 0 ? "+" : ""}R$ {Number(variant.price_adjustment).toFixed(2)})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Quantidade */}
              <div className="mt-4 flex items-center gap-4">
                <div>
                  <Label>Quantidade</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button onClick={addToCart} className="mt-6">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Carrinho */}
        {cart.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Itens do Carrinho</h3>
            <div className="space-y-2">
              {cart.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-3 border border-border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    {item.variantName && (
                      <Badge variant="secondary" className="text-xs">{item.variantName}</Badge>
                    )}
                    <p className="text-sm text-muted-foreground">
                      R$ {item.unitPrice.toFixed(2)} x {item.quantity} = R$ {(item.unitPrice * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateCartItemQuantity(index, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateCartItemQuantity(index, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromCart(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold">Total: R$ {total.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Dados do Cliente */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <User className="h-4 w-4" />
            Dados do Comprador (opcional)
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nome do cliente"
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="email@exemplo.com"
                type="email"
              />
            </div>
          </div>
        </div>

        {/* Pagamento e Finalização */}
        <div className="space-y-4">
          <div>
            <Label>Forma de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="credito">Cartão de Crédito</SelectItem>
                <SelectItem value="debito">Cartão de Débito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleFinalizeSale}
            disabled={cart.length === 0 || createOrderMutation.isPending}
            className="w-full"
            size="lg"
          >
            {createOrderMutation.isPending ? "Registrando..." : "Finalizar Venda"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InStoreSaleForm;
