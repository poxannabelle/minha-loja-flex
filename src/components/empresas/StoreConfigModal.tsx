import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Upload, MapPin, Palette, FolderTree } from "lucide-react";
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
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StoreConfigModal = ({ store, open, onOpenChange }: StoreConfigModalProps) => {
  const queryClient = useQueryClient();
  const [logoUrl, setLogoUrl] = useState(store?.logo_url || "");
  const [primaryColor, setPrimaryColor] = useState(store?.primary_color || "#000000");
  const [secondaryColor, setSecondaryColor] = useState(store?.secondary_color || "#FFD700");
  const [newUnit, setNewUnit] = useState({ name: "", address: "", city: "", state: "", zip_code: "", phone: "", is_main: false });
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });

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

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["store-categories", store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("store_id", store.id)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!store?.id,
  });

  // Update store colors/logo
  const updateStoreMutation = useMutation({
    mutationFn: async () => {
      if (!store?.id) return;
      const { error } = await supabase
        .from("stores")
        .update({
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
    onError: () => toast.error("Erro ao salvar configurações"),
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
      setNewUnit({ name: "", address: "", city: "", state: "", zip_code: "", phone: "", is_main: false });
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

  // Add category
  const addCategoryMutation = useMutation({
    mutationFn: async () => {
      if (!store?.id) return;
      const { error } = await supabase
        .from("categories")
        .insert({ ...newCategory, store_id: store.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-categories", store?.id] });
      setNewCategory({ name: "", description: "" });
      toast.success("Categoria adicionada!");
    },
    onError: () => toast.error("Erro ao adicionar categoria"),
  });

  // Delete category
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", categoryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-categories", store?.id] });
      toast.success("Categoria removida!");
    },
    onError: () => toast.error("Erro ao remover categoria"),
  });

  if (!store) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar {store.nome}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="branding" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="branding" className="gap-2">
              <Palette className="h-4 w-4" />
              Identidade Visual
            </TabsTrigger>
            <TabsTrigger value="units" className="gap-2">
              <MapPin className="h-4 w-4" />
              Unidades
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <FolderTree className="h-4 w-4" />
              Categorias
            </TabsTrigger>
          </TabsList>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-6">
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

            <Button onClick={() => updateStoreMutation.mutate()} className="w-full">
              Salvar Identidade Visual
            </Button>
          </TabsContent>

          {/* Units Tab */}
          <TabsContent value="units" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Nova Unidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Unidade</Label>
                    <Input
                      placeholder="Matriz, Filial Centro, etc."
                      value={newUnit.name}
                      onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input
                      placeholder="(11) 99999-9999"
                      value={newUnit.phone}
                      onChange={(e) => setNewUnit({ ...newUnit, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input
                    placeholder="Rua, número"
                    value={newUnit.address}
                    onChange={(e) => setNewUnit({ ...newUnit, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
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
                  <div className="space-y-2">
                    <Label>CEP</Label>
                    <Input
                      placeholder="00000-000"
                      value={newUnit.zip_code}
                      onChange={(e) => setNewUnit({ ...newUnit, zip_code: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is-main"
                    checked={newUnit.is_main}
                    onChange={(e) => setNewUnit({ ...newUnit, is_main: e.target.checked })}
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
                          {unit.address}, {unit.city} - {unit.state}
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
                <CardTitle className="text-lg">Nova Categoria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Categoria</Label>
                  <Input
                    placeholder="Eletrônicos, Roupas, etc."
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição (opcional)</Label>
                  <Textarea
                    placeholder="Descrição da categoria..."
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  />
                </div>
                <Button
                  onClick={() => addCategoryMutation.mutate()}
                  disabled={!newCategory.name}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Categoria
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <h3 className="font-semibold">Categorias Cadastradas</h3>
              {categories.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhuma categoria cadastrada</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category: any) => (
                    <Card key={category.id}>
                      <CardContent className="flex items-center justify-between py-3">
                        <div>
                          <p className="font-medium">{category.name}</p>
                          {category.description && (
                            <p className="text-xs text-muted-foreground">{category.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteCategoryMutation.mutate(category.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
