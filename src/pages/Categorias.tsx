import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, FolderTree, Pencil, Trash2, ChevronRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Category {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  store_id: string;
}

const Categorias = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parent_id: "",
  });

  // Fetch user's stores
  const { data: stores } = useQuery({
    queryKey: ["user-stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name")
        .eq("owner_id", user?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [selectedStoreId, setSelectedStoreId] = useState<string>("");

  // Fetch categories for selected store
  const { data: categories, isLoading } = useQuery({
    queryKey: ["store-categories", selectedStoreId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("store_id", selectedStoreId)
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
    enabled: !!selectedStoreId,
  });

  // Get parent categories (categories without parent)
  const parentCategories = categories?.filter((c) => !c.parent_id) || [];
  
  // Get subcategories for a parent
  const getSubcategories = (parentId: string) => 
    categories?.filter((c) => c.parent_id === parentId) || [];

  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("categories").insert({
        name: formData.name,
        description: formData.description || null,
        parent_id: formData.parent_id || null,
        store_id: selectedStoreId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-categories", selectedStoreId] });
      queryClient.invalidateQueries({ queryKey: ["all-categories"] });
      toast.success("Categoria criada com sucesso!");
      resetForm();
    },
    onError: () => {
      toast.error("Erro ao criar categoria");
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async () => {
      if (!editingCategory) return;
      const { error } = await supabase
        .from("categories")
        .update({
          name: formData.name,
          description: formData.description || null,
          parent_id: formData.parent_id || null,
        })
        .eq("id", editingCategory.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-categories", selectedStoreId] });
      queryClient.invalidateQueries({ queryKey: ["all-categories"] });
      toast.success("Categoria atualizada!");
      resetForm();
    },
    onError: () => {
      toast.error("Erro ao atualizar categoria");
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-categories", selectedStoreId] });
      queryClient.invalidateQueries({ queryKey: ["all-categories"] });
      toast.success("Categoria excluída!");
    },
    onError: () => {
      toast.error("Erro ao excluir categoria");
    },
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", parent_id: "" });
    setEditingCategory(null);
    setIsModalOpen(false);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      parent_id: category.parent_id || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (editingCategory) {
      updateCategoryMutation.mutate();
    } else {
      createCategoryMutation.mutate();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Acesso Restrito</h1>
          <p className="text-muted-foreground">Faça login para gerenciar categorias.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Categorias</h1>
            <p className="text-muted-foreground">
              Gerencie as categorias e subcategorias dos seus produtos
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione uma loja" />
              </SelectTrigger>
              <SelectContent>
                {stores?.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() => {
                setEditingCategory(null);
                setFormData({ name: "", description: "", parent_id: "" });
                setIsModalOpen(true);
              }}
              disabled={!selectedStoreId}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Categoria
            </Button>
          </div>
        </div>

        {!selectedStoreId ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderTree className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Selecione uma loja</h3>
              <p className="text-muted-foreground">
                Escolha uma loja para visualizar e gerenciar suas categorias
              </p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : parentCategories.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderTree className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma categoria</h3>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira categoria para organizar seus produtos
              </p>
              <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Categoria
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {parentCategories.map((category) => {
              const subcategories = getSubcategories(category.id);
              return (
                <Card key={category.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        {category.description && (
                          <CardDescription className="mt-1">
                            {category.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. As subcategorias também serão afetadas.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteCategoryMutation.mutate(category.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  {subcategories.length > 0 && (
                    <CardContent className="pt-0">
                      <div className="border-t pt-3 space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          Subcategorias
                        </p>
                        {subcategories.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between py-1.5 px-2 bg-muted/50 rounded"
                          >
                            <div className="flex items-center gap-2">
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{sub.name}</span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => openEditModal(sub)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir subcategoria?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteCategoryMutation.mutate(sub.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Criação/Edição */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                placeholder="Ex: Eletrônicos"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descrição da categoria..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent">Categoria Pai (opcional)</Label>
              <Select
                value={formData.parent_id}
                onValueChange={(value) => setFormData({ ...formData, parent_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma (categoria principal)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma (categoria principal)</SelectItem>
                  {parentCategories
                    .filter((c) => c.id !== editingCategory?.id)
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selecione uma categoria pai para criar uma subcategoria
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                className="flex-1"
              >
                {createCategoryMutation.isPending || updateCategoryMutation.isPending
                  ? "Salvando..."
                  : editingCategory
                  ? "Salvar"
                  : "Criar Categoria"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categorias;