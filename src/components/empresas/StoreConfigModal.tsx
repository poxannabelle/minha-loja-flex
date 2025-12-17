import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, MapPin, Palette, FolderTree, Link2, ChevronRight, CreditCard, Globe, AlertTriangle, Power, PowerOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface StoreConfigModalProps {
  store: {
    id: string;
    nome: string;
    slug: string;
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    status?: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
}

const PLANS = [
  { id: "starter", name: "Starter", description: "Até 50 produtos, 1 unidade", price: 49.90 },
  { id: "professional", name: "Professional", description: "Até 500 produtos, 5 unidades", price: 99.90 },
  { id: "enterprise", name: "Enterprise", description: "Produtos ilimitados, unidades ilimitadas", price: 199.90 },
];

const PAYMENT_GATEWAYS = [
  { id: "pagseguro", name: "PagSeguro", description: "Cartão, boleto e Pix" },
  { id: "mercadopago", name: "Mercado Pago", description: "Cartão, boleto e Pix" },
];

export const StoreConfigModal = ({ store, open, onOpenChange }: StoreConfigModalProps) => {
  const queryClient = useQueryClient();
  const [slug, setSlug] = useState(store?.slug || "");
  const [logoUrl, setLogoUrl] = useState(store?.logo_url || "");
  const [primaryColor, setPrimaryColor] = useState(store?.primary_color || "#000000");
  const [secondaryColor, setSecondaryColor] = useState(store?.secondary_color || "#FFD700");
  const [newUnit, setNewUnit] = useState({ name: "", city: "", state: "", is_main: false });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState("starter");
  const [selectedGateway, setSelectedGateway] = useState("");
  const [gatewayCredentials, setGatewayCredentials] = useState({ api_key: "", api_secret: "" });

  // Update state when store changes
  useEffect(() => {
    if (store) {
      setSlug(store.slug || "");
      setLogoUrl(store.logo_url || "");
      setPrimaryColor(store.primary_color || "#000000");
      setSecondaryColor(store.secondary_color || "#FFD700");
    }
  }, [store]);

  // Fetch units
  const { data: units = [] } = useQuery({
    queryKey: ["store-units", store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase
        .from("store_units")
        .select("*")
        .eq("store_id", store.id)
        .order("is_main", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!store?.id,
  });

  // Fetch global categories (predefined)
  const { data: globalCategories = [] } = useQuery({
    queryKey: ["global-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .is("store_id", null)
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
  });

  // Fetch linked categories for this store
  const { data: linkedCategories = [] } = useQuery({
    queryKey: ["store-linked-categories", store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase
        .from("store_categories")
        .select("category_id")
        .eq("store_id", store.id);
      if (error) throw error;
      return data.map((sc) => sc.category_id);
    },
    enabled: !!store?.id,
  });

  // Update selected categories when linked categories are fetched
  useEffect(() => {
    setSelectedCategories(linkedCategories);
  }, [linkedCategories]);

  // Get parent categories
  const parentCategories = globalCategories.filter((c) => !c.parent_id);
  
  // Get subcategories for a parent
  const getSubcategories = (parentId: string) => 
    globalCategories.filter((c) => c.parent_id === parentId);

  // Update store branding and slug
  const updateStoreMutation = useMutation({
    mutationFn: async () => {
      if (!store?.id) return;
      const { error } = await supabase
        .from("stores")
        .update({
          slug: slug,
          logo_url: logoUrl,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
        })
        .eq("id", store.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error: any) => {
      if (error?.message?.includes("duplicate") || error?.code === "23505") {
        toast.error("Este subdomínio já está em uso. Escolha outro.");
      } else {
        toast.error("Erro ao salvar configurações");
      }
    },
  });

  // Add unit
  const addUnitMutation = useMutation({
    mutationFn: async () => {
      if (!store?.id) return;
      const { error } = await supabase
        .from("store_units")
        .insert({ ...newUnit, store_id: store.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-units", store?.id] });
      setNewUnit({ name: "", city: "", state: "", is_main: false });
      toast.success("Unidade adicionada!");
    },
    onError: () => toast.error("Erro ao adicionar unidade"),
  });

  // Delete unit
  const deleteUnitMutation = useMutation({
    mutationFn: async (unitId: string) => {
      const { error } = await supabase.from("store_units").delete().eq("id", unitId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-units", store?.id] });
      toast.success("Unidade removida!");
    },
    onError: () => toast.error("Erro ao remover unidade"),
  });

  // Save category links
  const saveCategoriesMutation = useMutation({
    mutationFn: async () => {
      if (!store?.id) return;
      
      // Delete existing links
      await supabase
        .from("store_categories")
        .delete()
        .eq("store_id", store.id);
      
      // Insert new links
      if (selectedCategories.length > 0) {
        const links = selectedCategories.map((categoryId) => ({
          store_id: store.id,
          category_id: categoryId,
        }));
        
        const { error } = await supabase.from("store_categories").insert(links);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-linked-categories", store?.id] });
      toast.success("Categorias vinculadas com sucesso!");
    },
    onError: () => toast.error("Erro ao vincular categorias"),
  });

  // Toggle store status (activate/deactivate)
  const toggleStatusMutation = useMutation({
    mutationFn: async () => {
      if (!store?.id) return;
      const newStatus = store.status === "ativa" ? "inativa" : "ativa";
      const { error } = await supabase
        .from("stores")
        .update({ status: newStatus })
        .eq("id", store.id);
      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      onOpenChange(false);
      toast.success(newStatus === "ativa" ? "Empresa ativada com sucesso!" : "Empresa desativada com sucesso!");
    },
    onError: () => toast.error("Erro ao alterar status da empresa"),
  });

  // Delete store
  const deleteStoreMutation = useMutation({
    mutationFn: async () => {
      if (!store?.id) return;
      const { error } = await supabase
        .from("stores")
        .delete()
        .eq("id", store.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      onOpenChange(false);
      toast.success("Empresa excluída com sucesso!");
    },
    onError: () => toast.error("Erro ao excluir empresa. Verifique se não há dados vinculados."),
  });

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleParentWithChildren = (parentId: string) => {
    const subcategories = getSubcategories(parentId);
    const allIds = [parentId, ...subcategories.map((s) => s.id)];
    
    const allSelected = allIds.every((id) => selectedCategories.includes(id));
    
    if (allSelected) {
      setSelectedCategories((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      setSelectedCategories((prev) => [...new Set([...prev, ...allIds])]);
    }
  };

  if (!store) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar {store.nome}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="branding" className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="branding" className="gap-2">
              <Palette className="h-4 w-4" />
              Identidade
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Planos
            </TabsTrigger>
            <TabsTrigger value="units" className="gap-2">
              <MapPin className="h-4 w-4" />
              Unidades
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <FolderTree className="h-4 w-4" />
              Categorias
            </TabsTrigger>
            <TabsTrigger value="danger" className="gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Perigo
            </TabsTrigger>
          </TabsList>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Subdomínio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">Endereço da Loja</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="slug"
                      placeholder="minha-loja"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className="flex-1"
                    />
                    <span className="text-muted-foreground text-sm whitespace-nowrap">.plazoo.com</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Apenas letras minúsculas, números e hífens são permitidos.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Logo da Loja</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  {logoUrl && (
                    <img src={logoUrl} alt="Logo" className="h-20 w-20 object-contain rounded-lg border" />
                  )}
                  <div className="flex-1">
                    <Label htmlFor="logo-url">URL da Logo</Label>
                    <Input
                      id="logo-url"
                      placeholder="https://exemplo.com/logo.png"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cores da Marca</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">Cor Primária</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        id="primary-color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary-color">Cor Secundária</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        id="secondary-color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        placeholder="#FFD700"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 mt-4">
                  <div className="flex-1 p-4 rounded-lg text-center" style={{ backgroundColor: primaryColor, color: '#fff' }}>
                    Cor Primária
                  </div>
                  <div className="flex-1 p-4 rounded-lg text-center" style={{ backgroundColor: secondaryColor, color: '#000' }}>
                    Cor Secundária
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button onClick={() => updateStoreMutation.mutate()} disabled={updateStoreMutation.isPending} className="w-full">
              {updateStoreMutation.isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </TabsContent>

          {/* Plans & Payments Tab */}
          <TabsContent value="plans" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Plano Atual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  {PLANS.map((plan) => (
                    <div
                      key={plan.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedPlan === plan.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{plan.name}</p>
                          <p className="text-sm text-muted-foreground">{plan.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">R$ {plan.price.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">/mês</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gateway de Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Selecione o Gateway</Label>
                  <Select value={selectedGateway} onValueChange={setSelectedGateway}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um gateway" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_GATEWAYS.map((gateway) => (
                        <SelectItem key={gateway.id} value={gateway.id}>
                          {gateway.name} - {gateway.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedGateway && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label>API Key / Token</Label>
                      <Input
                        type="password"
                        placeholder="Sua chave de API"
                        value={gatewayCredentials.api_key}
                        onChange={(e) => setGatewayCredentials({ ...gatewayCredentials, api_key: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>API Secret (opcional)</Label>
                      <Input
                        type="password"
                        placeholder="Seu secret (se aplicável)"
                        value={gatewayCredentials.api_secret}
                        onChange={(e) => setGatewayCredentials({ ...gatewayCredentials, api_secret: e.target.value })}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      As credenciais são armazenadas de forma segura e criptografada.
                    </p>
                  </div>
                )}

                <Button className="w-full" disabled={!selectedGateway}>
                  Salvar Configurações de Pagamento
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Units Tab */}
          <TabsContent value="units" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Nova Unidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Unidade</Label>
                    <Input
                      placeholder="Matriz, Filial Centro, etc."
                      value={newUnit.name}
                      onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input
                      placeholder="São Paulo"
                      value={newUnit.city}
                      onChange={(e) => setNewUnit({ ...newUnit, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Input
                      placeholder="SP"
                      value={newUnit.state}
                      onChange={(e) => setNewUnit({ ...newUnit, state: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="is-main"
                    checked={newUnit.is_main}
                    onCheckedChange={(checked) => setNewUnit({ ...newUnit, is_main: checked === true })}
                  />
                  <Label htmlFor="is-main">Unidade Principal</Label>
                </div>
                <Button
                  onClick={() => addUnitMutation.mutate()}
                  disabled={!newUnit.name}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Unidade
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <h3 className="font-semibold">Unidades Cadastradas</h3>
              {units.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhuma unidade cadastrada</p>
              ) : (
                units.map((unit: any) => (
                  <Card key={unit.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {unit.name}
                          {unit.is_main && (
                            <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">Principal</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {unit.city} - {unit.state}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteUnitMutation.mutate(unit.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Vincular Categorias Pré-definidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Selecione as categorias que serão utilizadas nesta loja. As categorias são gerenciadas na página de Categorias.
                </p>
                
                {globalCategories.length === 0 ? (
                  <div className="text-center py-8">
                    <FolderTree className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Nenhuma categoria pré-definida encontrada.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Crie categorias na página de Categorias primeiro.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {parentCategories.map((parent) => {
                      const subcategories = getSubcategories(parent.id);
                      const allIds = [parent.id, ...subcategories.map((s) => s.id)];
                      const allSelected = allIds.every((id) => selectedCategories.includes(id));
                      const someSelected = allIds.some((id) => selectedCategories.includes(id));
                      
                      return (
                        <div key={parent.id} className="border rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={allSelected}
                              ref={(el) => {
                                if (el) {
                                  (el as any).indeterminate = someSelected && !allSelected;
                                }
                              }}
                              onCheckedChange={() => toggleParentWithChildren(parent.id)}
                            />
                            <div className="flex-1">
                              <p className="font-medium">{parent.name}</p>
                              {parent.description && (
                                <p className="text-xs text-muted-foreground">{parent.description}</p>
                              )}
                            </div>
                          </div>
                          
                          {subcategories.length > 0 && (
                            <div className="ml-6 mt-2 space-y-2 border-l pl-4">
                              {subcategories.map((sub) => (
                                <div key={sub.id} className="flex items-center gap-3">
                                  <Checkbox
                                    checked={selectedCategories.includes(sub.id)}
                                    onCheckedChange={() => toggleCategory(sub.id)}
                                  />
                                  <div className="flex items-center gap-2">
                                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-sm">{sub.name}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {selectedCategories.length} categoria(s) selecionada(s)
                  </p>
                  <Button 
                    onClick={() => saveCategoriesMutation.mutate()}
                    disabled={saveCategoriesMutation.isPending}
                    className="gap-2"
                  >
                    <Link2 className="h-4 w-4" />
                    {saveCategoriesMutation.isPending ? "Salvando..." : "Salvar Vínculos"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Danger Zone Tab */}
          <TabsContent value="danger" className="space-y-6">
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                  <PowerOff className="h-5 w-5" />
                  {store.status === "ativa" ? "Desativar Empresa" : "Ativar Empresa"}
                </CardTitle>
                <CardDescription>
                  {store.status === "ativa"
                    ? "A empresa ficará invisível para os clientes e os pedidos serão pausados."
                    : "Reative a empresa para que ela volte a aparecer para os clientes."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant={store.status === "ativa" ? "outline" : "default"}
                      className={store.status === "ativa" ? "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" : ""}
                    >
                      {store.status === "ativa" ? (
                        <>
                          <PowerOff className="h-4 w-4 mr-2" />
                          Desativar Empresa
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4 mr-2" />
                          Ativar Empresa
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {store.status === "ativa" ? "Desativar empresa?" : "Ativar empresa?"}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {store.status === "ativa"
                          ? "A empresa não aparecerá mais para os clientes. Você pode reativá-la a qualquer momento."
                          : "A empresa voltará a aparecer para os clientes e poderá receber pedidos."}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => toggleStatusMutation.mutate()}
                        className={store.status === "ativa" ? "bg-destructive hover:bg-destructive/90" : ""}
                      >
                        {store.status === "ativa" ? "Sim, desativar" : "Sim, ativar"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                  <Trash2 className="h-5 w-5" />
                  Excluir Empresa
                </CardTitle>
                <CardDescription>
                  Esta ação é irreversível. Todos os dados da empresa, incluindo produtos, pedidos e configurações serão permanentemente excluídos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Empresa Permanentemente
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente a empresa <strong>{store.nome}</strong> e todos os dados associados, incluindo:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Todos os produtos cadastrados</li>
                          <li>Histórico de pedidos</li>
                          <li>Configurações e personalizações</li>
                          <li>Unidades cadastradas</li>
                        </ul>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteStoreMutation.mutate()}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Sim, excluir permanentemente
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};