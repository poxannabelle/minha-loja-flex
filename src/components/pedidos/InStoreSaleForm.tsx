import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Search, Plus, Minus, Trash2, ShoppingCart, User, 
  CreditCard, Percent, Package, Tag, Receipt, UserPlus,
  Phone, Mail, MapPin, X, Check
} from "lucide-react";

interface CartItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  discount: number;
  discountType: "percent" | "fixed";
  imageUrl?: string;
}

interface InStoreSaleFormProps {
  storeId: string;
}

const InStoreSaleForm = ({ storeId }: InStoreSaleFormProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [itemDiscount, setItemDiscount] = useState(0);
  const [itemDiscountType, setItemDiscountType] = useState<"percent" | "fixed">("percent");
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Customer data
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerCpf, setCustomerCpf] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  
  // Order data
  const [paymentMethod, setPaymentMethod] = useState("");
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [orderDiscountType, setOrderDiscountType] = useState<"percent" | "fixed">("percent");
  const [notes, setNotes] = useState("");
  
  const queryClient = useQueryClient();

  // Buscar produtos
  const { data: products, isLoading: isLoadingProducts } = useQuery({
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

  // Agrupar variantes por tipo
  const groupedVariants = useMemo(() => {
    if (!variants) return {};
    return variants.reduce((acc, variant) => {
      if (!acc[variant.variant_type]) {
        acc[variant.variant_type] = [];
      }
      acc[variant.variant_type].push(variant);
      return acc;
    }, {} as Record<string, typeof variants>);
  }, [variants]);

  // Calcular preço com ajustes de variante
  const calculateItemPrice = () => {
    if (!selectedProduct) return 0;
    let price = Number(selectedProduct.price);
    
    Object.values(selectedVariants).forEach(variantId => {
      const variant = variants?.find(v => v.id === variantId);
      if (variant?.price_adjustment) {
        price += Number(variant.price_adjustment);
      }
    });
    
    return price;
  };

  const applyDiscount = (price: number, discount: number, type: "percent" | "fixed") => {
    if (type === "percent") {
      return price * (1 - discount / 100);
    }
    return Math.max(0, price - discount);
  };

  const addToCart = () => {
    if (!selectedProduct) {
      toast.error("Selecione um produto");
      return;
    }

    const variantNames = Object.entries(selectedVariants)
      .map(([type, id]) => {
        const variant = variants?.find(v => v.id === id);
        return variant ? `${type}: ${variant.variant_value}` : null;
      })
      .filter(Boolean)
      .join(", ");

    const originalPrice = calculateItemPrice();
    const unitPrice = applyDiscount(originalPrice, itemDiscount, itemDiscountType);
    
    // Get image from first selected variant or product
    const firstVariantId = Object.values(selectedVariants)[0];
    const firstVariant = variants?.find(v => v.id === firstVariantId);
    const imageUrl = firstVariant?.image_url || selectedProduct.image_url || undefined;

    const existingIndex = cart.findIndex(
      item => item.productId === selectedProductId && 
              JSON.stringify(item.variantId) === JSON.stringify(Object.values(selectedVariants).join(","))
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
          variantId: Object.values(selectedVariants).join(",") || undefined,
          variantName: variantNames || undefined,
          quantity,
          unitPrice,
          originalPrice,
          discount: itemDiscount,
          discountType: itemDiscountType,
          imageUrl,
        },
      ]);
    }

    // Reset
    setSelectedProductId("");
    setSelectedVariants({});
    setQuantity(1);
    setItemDiscount(0);
    setSearchTerm("");
    toast.success("Produto adicionado");
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

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalDiscount = orderDiscountType === "percent" 
    ? subtotal * (orderDiscount / 100)
    : orderDiscount;
  const total = Math.max(0, subtotal - totalDiscount);

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
          notes: notes || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Criar itens do pedido
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        variant_id: item.variantId?.split(",")[0] || null,
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
      setCustomerCpf("");
      setCustomerAddress("");
      setPaymentMethod("");
      setOrderDiscount(0);
      setNotes("");
      setShowCustomerForm(false);
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
    if (!paymentMethod) {
      toast.error("Selecione a forma de pagamento");
      return;
    }
    createOrderMutation.mutate();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Coluna Principal - Produtos */}
      <div className="lg:col-span-3 space-y-6">
        {/* Busca de Produto */}
        <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              Adicionar Produto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Campo de busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou código do produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 h-12 text-base bg-background"
              />
              {isLoadingProducts && searchTerm && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              )}
            </div>

            {/* Lista de produtos encontrados */}
            {searchTerm && products && products.length > 0 && !selectedProductId && (
              <div className="border border-border rounded-xl overflow-hidden bg-background shadow-lg">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      setSelectedProductId(product.id);
                      setSearchTerm("");
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-accent/50 flex items-center gap-4 border-b border-border last:border-0 transition-colors"
                  >
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-14 h-14 object-cover rounded-lg" />
                    ) : (
                      <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          Estoque: {product.stock_quantity}
                        </Badge>
                        {product.original_price && Number(product.original_price) > Number(product.price) && (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatCurrency(Number(product.original_price))}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary text-lg">
                        {formatCurrency(Number(product.price))}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchTerm && products && products.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum produto encontrado</p>
              </div>
            )}

            {/* Produto selecionado */}
            {selectedProduct && (
              <div className="bg-background rounded-xl border-2 border-primary/50 overflow-hidden">
                <div className="p-4 bg-primary/5 flex items-center gap-4">
                  {selectedProduct.image_url ? (
                    <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-20 h-20 object-cover rounded-lg" />
                  ) : (
                    <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{selectedProduct.name}</h3>
                    <p className="text-2xl font-bold text-primary mt-1">
                      {formatCurrency(calculateItemPrice())}
                    </p>
                    {selectedProduct.original_price && Number(selectedProduct.original_price) > Number(selectedProduct.price) && (
                      <p className="text-sm text-muted-foreground line-through">
                        {formatCurrency(Number(selectedProduct.original_price))}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedProductId("");
                      setSelectedVariants({});
                    }}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="p-4 space-y-4">
                  {/* Variantes agrupadas por tipo */}
                  {Object.entries(groupedVariants).map(([type, typeVariants]) => (
                    <div key={type}>
                      <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        {type}
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {typeVariants.map((variant) => (
                          <button
                            key={variant.id}
                            onClick={() => setSelectedVariants(prev => ({
                              ...prev,
                              [type]: prev[type] === variant.id ? "" : variant.id
                            }))}
                            className={`
                              px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium
                              ${selectedVariants[type] === variant.id 
                                ? 'border-primary bg-primary text-primary-foreground' 
                                : 'border-border hover:border-primary/50 bg-background'}
                            `}
                          >
                            {variant.variant_value}
                            {variant.price_adjustment !== null && Number(variant.price_adjustment) !== 0 && (
                              <span className="ml-1 opacity-70">
                                ({Number(variant.price_adjustment) > 0 ? "+" : ""}{formatCurrency(Number(variant.price_adjustment))})
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <Separator />

                  {/* Quantidade e Desconto */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">Quantidade</Label>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="h-10 w-10"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-16 text-center h-10 text-lg font-semibold"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setQuantity(quantity + 1)}
                          className="h-10 w-10"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        Desconto no Item
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={itemDiscount}
                          onChange={(e) => setItemDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="flex-1 h-10"
                          placeholder="0"
                        />
                        <Select value={itemDiscountType} onValueChange={(v: "percent" | "fixed") => setItemDiscountType(v)}>
                          <SelectTrigger className="w-20 h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percent">%</SelectItem>
                            <SelectItem value="fixed">R$</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Preview do preço */}
                  {itemDiscount > 0 && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center justify-between">
                      <span className="text-sm text-green-700 dark:text-green-400">Preço com desconto:</span>
                      <span className="font-bold text-green-700 dark:text-green-400">
                        {formatCurrency(applyDiscount(calculateItemPrice(), itemDiscount, itemDiscountType))}
                      </span>
                    </div>
                  )}

                  <Button onClick={addToCart} className="w-full h-12 text-base" size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Adicionar ao Carrinho
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Carrinho */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Carrinho
              </span>
              {cart.length > 0 && (
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} itens
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">Carrinho vazio</p>
                <p className="text-sm">Busque produtos acima para adicionar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border border-border rounded-xl bg-accent/5 hover:bg-accent/10 transition-colors">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="w-16 h-16 object-cover rounded-lg" />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{item.productName}</p>
                      {item.variantName && (
                        <p className="text-sm text-muted-foreground">{item.variantName}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {item.discount > 0 && (
                          <>
                            <span className="text-sm text-muted-foreground line-through">
                              {formatCurrency(item.originalPrice)}
                            </span>
                            <Badge variant="destructive" className="text-xs">
                              -{item.discount}{item.discountType === "percent" ? "%" : " reais"}
                            </Badge>
                          </>
                        )}
                        <span className="font-medium text-primary">{formatCurrency(item.unitPrice)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateCartItemQuantity(index, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateCartItemQuantity(index, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="font-bold">{formatCurrency(item.unitPrice * item.quantity)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromCart(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Coluna Lateral - Resumo e Cliente */}
      <div className="lg:col-span-2 space-y-6">
        {/* Dados do Cliente */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Comprador
              </CardTitle>
              <Button
                variant={showCustomerForm ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowCustomerForm(!showCustomerForm)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {showCustomerForm ? "Ocultar" : "Cadastrar"}
              </Button>
            </div>
          </CardHeader>
          {showCustomerForm && (
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Nome Completo</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nome do cliente"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Telefone
                  </Label>
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className="mt-1"
                    maxLength={15}
                  />
                </div>
                <div>
                  <Label className="text-sm">CPF</Label>
                  <Input
                    value={customerCpf}
                    onChange={(e) => setCustomerCpf(formatCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    className="mt-1"
                    maxLength={14}
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  E-mail
                </Label>
                <Input
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  type="email"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Endereço
                </Label>
                <Input
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Endereço completo"
                  className="mt-1"
                />
              </div>
              {customerName && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <Check className="h-4 w-4" />
                  Cliente cadastrado
                </div>
              )}
            </CardContent>
          )}
          {!showCustomerForm && customerName && (
            <CardContent>
              <div className="p-3 bg-accent/50 rounded-lg">
                <p className="font-medium">{customerName}</p>
                {customerPhone && <p className="text-sm text-muted-foreground">{customerPhone}</p>}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Resumo da Venda */}
        <Card className="border-2 border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt className="h-5 w-5" />
              Resumo da Venda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Desconto Geral */}
            <div>
              <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Desconto no Pedido
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={orderDiscount}
                  onChange={(e) => setOrderDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="flex-1"
                  placeholder="0"
                />
                <Select value={orderDiscountType} onValueChange={(v: "percent" | "fixed") => setOrderDiscountType(v)}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">%</SelectItem>
                    <SelectItem value="fixed">R$</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Forma de Pagamento */}
            <div>
              <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Forma de Pagamento *
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className={!paymentMethod ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">💵 Dinheiro</SelectItem>
                  <SelectItem value="pix">📱 PIX</SelectItem>
                  <SelectItem value="credito">💳 Cartão de Crédito</SelectItem>
                  <SelectItem value="debito">💳 Cartão de Débito</SelectItem>
                  <SelectItem value="transferencia">🏦 Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Observações */}
            <div>
              <Label className="text-sm">Observações</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionais..."
                className="mt-1"
              />
            </div>

            <Separator />

            {/* Totais */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {orderDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Desconto ({orderDiscount}{orderDiscountType === "percent" ? "%" : " reais"})</span>
                  <span>-{formatCurrency(totalDiscount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-3xl font-bold text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            <Button
              onClick={handleFinalizeSale}
              disabled={cart.length === 0 || !paymentMethod || createOrderMutation.isPending}
              className="w-full h-14 text-lg"
              size="lg"
            >
              {createOrderMutation.isPending ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Processando...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Finalizar Venda
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InStoreSaleForm;
