import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Search, ShoppingCart, Plus, Minus, Trash2, UtensilsCrossed } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MenuItemModal from "@/components/cardapio/MenuItemModal";
import CheckoutModal from "@/components/cardapio/CheckoutModal";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  image_url: string | null;
  is_available: boolean;
  preparation_time_minutes: number | null;
  category_id: string | null;
  store_id: string;
  category?: {
    id: string;
    name: string;
  };
  sizes?: MenuItemSize[];
  extras?: MenuItemExtra[];
}

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

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  selectedSize?: MenuItemSize;
  selectedExtras: { extra: MenuItemExtra; quantity: number }[];
  totalPrice: number;
  notes?: string;
}

interface Store {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  description: string | null;
}

const Cardapio = () => {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get("mesa");
  
  const [store, setStore] = useState<Store | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (storeSlug) {
      fetchStoreAndMenu();
    }
  }, [storeSlug]);

  const fetchStoreAndMenu = async () => {
    setLoading(true);
    
    // Fetch store by slug
    const { data: storeData, error: storeError } = await supabase
      .from("stores")
      .select("*")
      .eq("slug", storeSlug)
      .eq("is_food_business", true)
      .single();

    if (storeError || !storeData) {
      console.error("Store not found:", storeError);
      setLoading(false);
      return;
    }

    setStore(storeData);

    // Fetch categories for this store
    const { data: categoriesData } = await supabase
      .from("categories")
      .select("id, name")
      .eq("store_id", storeData.id);

    setCategories(categoriesData || []);

    // Fetch menu items with sizes and extras
    const { data: menuData, error: menuError } = await supabase
      .from("menu_items")
      .select(`
        *,
        category:categories(id, name),
        sizes:menu_item_sizes(*),
        extras:menu_item_extras(*)
      `)
      .eq("store_id", storeData.id)
      .eq("is_available", true);

    if (menuError) {
      console.error("Error fetching menu:", menuError);
    }

    setMenuItems(menuData || []);
    setLoading(false);
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesCategory = selectedCategory === "all" || item.category?.id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setItemModalOpen(true);
  };

  const addToCart = (
    item: MenuItem,
    quantity: number,
    selectedSize?: MenuItemSize,
    selectedExtras: { extra: MenuItemExtra; quantity: number }[] = [],
    notes?: string
  ) => {
    let totalPrice = item.base_price;
    
    if (selectedSize) {
      totalPrice += selectedSize.price_adjustment;
    }
    
    selectedExtras.forEach(({ extra, quantity: qty }) => {
      totalPrice += extra.price * qty;
    });
    
    totalPrice *= quantity;

    const cartItem: CartItem = {
      menuItem: item,
      quantity,
      selectedSize,
      selectedExtras,
      totalPrice,
      notes,
    };

    setCart(prev => [...prev, cartItem]);
    setItemModalOpen(false);
    
    toast({
      title: "Item adicionado!",
      description: `${item.name} foi adicionado ao carrinho.`,
    });
  };

  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(index);
      return;
    }

    setCart(prev => prev.map((item, i) => {
      if (i === index) {
        const unitPrice = item.totalPrice / item.quantity;
        return { ...item, quantity: newQuantity, totalPrice: unitPrice * newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <UtensilsCrossed className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Estabelecimento não encontrado</h1>
        <p className="text-muted-foreground">Verifique o link e tente novamente.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header 
        className="sticky top-0 z-50 bg-card border-b"
        style={{ 
          backgroundColor: store.primary_color || undefined,
        }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {store.logo_url && (
                <img 
                  src={store.logo_url} 
                  alt={store.name} 
                  className="h-10 w-10 rounded-full object-cover"
                />
              )}
              <div>
                <h1 className="text-lg font-bold text-foreground">{store.name}</h1>
                {tableId && (
                  <Badge variant="secondary" className="text-xs">
                    Mesa {tableId}
                  </Badge>
                )}
              </div>
            </div>

            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemCount > 0 && (
                    <Badge 
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {cartItemCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Seu Pedido</SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto py-4">
                    {cart.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Seu carrinho está vazio</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {cart.map((item, index) => (
                          <Card key={index} className="p-3">
                            <div className="flex gap-3">
                              {item.menuItem.image_url && (
                                <img 
                                  src={item.menuItem.image_url} 
                                  alt={item.menuItem.name}
                                  className="h-16 w-16 rounded-md object-cover"
                                />
                              )}
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{item.menuItem.name}</h4>
                                {item.selectedSize && (
                                  <p className="text-xs text-muted-foreground">
                                    {item.selectedSize.name}
                                  </p>
                                )}
                                {item.selectedExtras.length > 0 && (
                                  <p className="text-xs text-muted-foreground">
                                    + {item.selectedExtras.map(e => e.extra.name).join(", ")}
                                  </p>
                                )}
                                {item.notes && (
                                  <p className="text-xs text-muted-foreground italic">
                                    Obs: {item.notes}
                                  </p>
                                )}
                                <p className="font-semibold text-sm mt-1">
                                  {formatCurrency(item.totalPrice)}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => removeFromCart(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => updateCartItemQuantity(index, item.quantity - 1)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => updateCartItemQuantity(index, item.quantity + 1)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  {cart.length > 0 && (
                    <div className="border-t pt-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total</span>
                        <span className="text-xl font-bold">{formatCurrency(cartTotal)}</span>
                      </div>
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={() => {
                          setCartOpen(false);
                          setCheckoutOpen(true);
                        }}
                      >
                        Finalizar Pedido
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Search & Categories */}
      <div className="sticky top-[73px] z-40 bg-background border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar no cardápio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
              <TabsTrigger value="all">Todos</TabsTrigger>
              {categories.map(cat => (
                <TabsTrigger key={cat.id} value={cat.id}>
                  {cat.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Menu Items */}
      <main className="container mx-auto px-4 py-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum item encontrado</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredItems.map(item => (
              <Card 
                key={item.id} 
                className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleItemClick(item)}
              >
                <CardContent className="p-0">
                  <div className="flex gap-4 p-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">
                          {formatCurrency(item.base_price)}
                        </span>
                        {item.preparation_time_minutes && (
                          <Badge variant="outline" className="text-xs">
                            ~{item.preparation_time_minutes} min
                          </Badge>
                        )}
                      </div>
                    </div>
                    {item.image_url && (
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="h-24 w-24 rounded-lg object-cover"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Fixed bottom cart bar (mobile) */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4 md:hidden">
          <Button 
            className="w-full" 
            size="lg"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Ver Carrinho ({cartItemCount}) - {formatCurrency(cartTotal)}
          </Button>
        </div>
      )}

      {/* Modals */}
      {selectedItem && (
        <MenuItemModal
          open={itemModalOpen}
          onOpenChange={setItemModalOpen}
          item={selectedItem}
          onAddToCart={addToCart}
        />
      )}

      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        cart={cart}
        store={store}
        tableId={tableId}
        onOrderComplete={() => {
          setCart([]);
          setCheckoutOpen(false);
        }}
      />
    </div>
  );
};

export default Cardapio;
