import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  UtensilsCrossed, 
  QrCode, 
  ExternalLink,
  Copy,
  Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";

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
  category?: { name: string };
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

interface Category {
  id: string;
  name: string;
}

interface Store {
  id: string;
  name: string;
  slug: string;
  is_food_business: boolean;
}

interface StoreTable {
  id: string;
  table_number: string;
  is_active: boolean;
  qr_code_url: string | null;
}

const CardapioAdmin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<StoreTable[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Form states
  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    base_price: "",
    image_url: "",
    is_available: true,
    preparation_time_minutes: "",
    category_id: "",
  });

  const [newTableNumber, setNewTableNumber] = useState("");

  useEffect(() => {
    if (user) {
      fetchStores();
    }
  }, [user]);

  useEffect(() => {
    if (selectedStoreId) {
      const store = stores.find(s => s.id === selectedStoreId);
      setSelectedStore(store || null);
      fetchMenuData();
      fetchTables();
    }
  }, [selectedStoreId, stores]);

  const fetchStores = async () => {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("owner_id", user?.id)
      .eq("is_food_business", true);

    if (error) {
      console.error("Error fetching stores:", error);
      return;
    }

    setStores(data || []);
    if (data && data.length > 0) {
      setSelectedStoreId(data[0].id);
    }
    setLoading(false);
  };

  const fetchMenuData = async () => {
    // Fetch categories
    const { data: categoriesData } = await supabase
      .from("categories")
      .select("id, name")
      .eq("store_id", selectedStoreId);

    setCategories(categoriesData || []);

    // Fetch menu items with sizes and extras
    const { data: menuData } = await supabase
      .from("menu_items")
      .select(`
        *,
        category:categories(name),
        sizes:menu_item_sizes(*),
        extras:menu_item_extras(*)
      `)
      .eq("store_id", selectedStoreId)
      .order("name");

    setMenuItems(menuData || []);
  };

  const fetchTables = async () => {
    const { data } = await supabase
      .from("store_tables")
      .select("*")
      .eq("store_id", selectedStoreId)
      .order("table_number");

    setTables(data || []);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleSaveItem = async () => {
    if (!itemForm.name.trim() || !itemForm.base_price) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e preço são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const itemData = {
      store_id: selectedStoreId,
      name: itemForm.name.trim(),
      description: itemForm.description.trim() || null,
      base_price: parseFloat(itemForm.base_price),
      image_url: itemForm.image_url.trim() || null,
      is_available: itemForm.is_available,
      preparation_time_minutes: itemForm.preparation_time_minutes 
        ? parseInt(itemForm.preparation_time_minutes) 
        : null,
      category_id: itemForm.category_id || null,
    };

    if (editingItem) {
      const { error } = await supabase
        .from("menu_items")
        .update(itemData)
        .eq("id", editingItem.id);

      if (error) {
        toast({ title: "Erro ao atualizar item", variant: "destructive" });
        return;
      }
      toast({ title: "Item atualizado!" });
    } else {
      const { error } = await supabase
        .from("menu_items")
        .insert(itemData);

      if (error) {
        toast({ title: "Erro ao criar item", variant: "destructive" });
        return;
      }
      toast({ title: "Item criado!" });
    }

    setItemModalOpen(false);
    resetItemForm();
    fetchMenuData();
  };

  const handleDeleteItem = async (id: string) => {
    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Erro ao excluir item", variant: "destructive" });
      return;
    }

    toast({ title: "Item excluído!" });
    fetchMenuData();
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || "",
      base_price: item.base_price.toString(),
      image_url: item.image_url || "",
      is_available: item.is_available,
      preparation_time_minutes: item.preparation_time_minutes?.toString() || "",
      category_id: item.category_id || "",
    });
    setItemModalOpen(true);
  };

  const resetItemForm = () => {
    setEditingItem(null);
    setItemForm({
      name: "",
      description: "",
      base_price: "",
      image_url: "",
      is_available: true,
      preparation_time_minutes: "",
      category_id: "",
    });
  };

  const handleAddTable = async () => {
    if (!newTableNumber.trim()) {
      toast({
        title: "Número da mesa obrigatório",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("store_tables")
      .insert({
        store_id: selectedStoreId,
        table_number: newTableNumber.trim(),
        is_active: true,
      });

    if (error) {
      toast({ title: "Erro ao criar mesa", variant: "destructive" });
      return;
    }

    toast({ title: "Mesa criada!" });
    setNewTableNumber("");
    setTableModalOpen(false);
    fetchTables();
  };

  const handleToggleTable = async (table: StoreTable) => {
    const { error } = await supabase
      .from("store_tables")
      .update({ is_active: !table.is_active })
      .eq("id", table.id);

    if (error) {
      toast({ title: "Erro ao atualizar mesa", variant: "destructive" });
      return;
    }

    fetchTables();
  };

  const handleDeleteTable = async (id: string) => {
    const { error } = await supabase
      .from("store_tables")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Erro ao excluir mesa", variant: "destructive" });
      return;
    }

    toast({ title: "Mesa excluída!" });
    fetchTables();
  };

  const getMenuUrl = (tableNumber?: string) => {
    const baseUrl = `${window.location.origin}/cardapio/${selectedStore?.slug}`;
    return tableNumber ? `${baseUrl}?mesa=${tableNumber}` : baseUrl;
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 py-12 text-center">
          <UtensilsCrossed className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Nenhuma empresa de alimentação</h1>
          <p className="text-muted-foreground mb-6">
            Para gerenciar o cardápio, primeiro crie uma empresa e marque-a como negócio de alimentação.
          </p>
          <Button onClick={() => window.location.href = "/empresas"}>
            Ir para Empresas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Cardápio Digital</h1>
            <p className="text-muted-foreground">Gerencie os itens do seu cardápio</p>
          </div>

          {stores.length > 1 && (
            <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Selecione a empresa" />
              </SelectTrigger>
              <SelectContent>
                {stores.map(store => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Quick Links */}
        {selectedStore && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm font-medium">Link do Cardápio:</span>
                <code className="bg-muted px-2 py-1 rounded text-sm">
                  {getMenuUrl()}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(getMenuUrl(), "main")}
                >
                  {copiedLink === "main" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getMenuUrl(), "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Abrir
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="items" className="space-y-6">
          <TabsList>
            <TabsTrigger value="items">Itens do Cardápio</TabsTrigger>
            <TabsTrigger value="tables">Mesas & QR Codes</TabsTrigger>
          </TabsList>

          {/* Menu Items Tab */}
          <TabsContent value="items">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Itens do Cardápio</CardTitle>
                <Dialog open={itemModalOpen} onOpenChange={(open) => {
                  setItemModalOpen(open);
                  if (!open) resetItemForm();
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>
                        {editingItem ? "Editar Item" : "Novo Item"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nome *</Label>
                        <Input
                          id="name"
                          value={itemForm.name}
                          onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Descrição</Label>
                        <Textarea
                          id="description"
                          value={itemForm.description}
                          onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="price">Preço *</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={itemForm.base_price}
                            onChange={(e) => setItemForm(prev => ({ ...prev, base_price: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="time">Tempo de Preparo (min)</Label>
                          <Input
                            id="time"
                            type="number"
                            value={itemForm.preparation_time_minutes}
                            onChange={(e) => setItemForm(prev => ({ ...prev, preparation_time_minutes: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="category">Categoria</Label>
                        <Select 
                          value={itemForm.category_id} 
                          onValueChange={(value) => setItemForm(prev => ({ ...prev, category_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="image">URL da Imagem</Label>
                        <Input
                          id="image"
                          value={itemForm.image_url}
                          onChange={(e) => setItemForm(prev => ({ ...prev, image_url: e.target.value }))}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={itemForm.is_available}
                          onCheckedChange={(checked) => setItemForm(prev => ({ ...prev, is_available: checked }))}
                        />
                        <Label>Disponível</Label>
                      </div>
                      <Button className="w-full" onClick={handleSaveItem}>
                        Salvar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {menuItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum item cadastrado
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {menuItems.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {item.image_url && (
                                <img 
                                  src={item.image_url} 
                                  alt={item.name}
                                  className="h-10 w-10 rounded object-cover"
                                />
                              )}
                              <div>
                                <p className="font-medium">{item.name}</p>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{item.category?.name || "-"}</TableCell>
                          <TableCell>{formatCurrency(item.base_price)}</TableCell>
                          <TableCell>
                            <Badge variant={item.is_available ? "default" : "secondary"}>
                              {item.is_available ? "Disponível" : "Indisponível"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditItem(item)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tables Tab */}
          <TabsContent value="tables">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Mesas & QR Codes</CardTitle>
                <Dialog open={tableModalOpen} onOpenChange={setTableModalOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Mesa
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nova Mesa</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="tableNumber">Número/Nome da Mesa</Label>
                        <Input
                          id="tableNumber"
                          value={newTableNumber}
                          onChange={(e) => setNewTableNumber(e.target.value)}
                          placeholder="Ex: 1, 2, VIP, Varanda"
                        />
                      </div>
                      <Button className="w-full" onClick={handleAddTable}>
                        Criar Mesa
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {tables.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma mesa cadastrada
                  </p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tables.map(table => (
                      <Card key={table.id} className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <QrCode className="h-5 w-5" />
                            <span className="font-semibold">Mesa {table.table_number}</span>
                          </div>
                          <Badge variant={table.is_active ? "default" : "secondary"}>
                            {table.is_active ? "Ativa" : "Inativa"}
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-muted-foreground mb-3 break-all">
                          {getMenuUrl(table.table_number)}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => copyToClipboard(getMenuUrl(table.table_number), table.id)}
                          >
                            {copiedLink === table.id ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleTable(table)}
                          >
                            {table.is_active ? "Desativar" : "Ativar"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTable(table.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CardapioAdmin;
