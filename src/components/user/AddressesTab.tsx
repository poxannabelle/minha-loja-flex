import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Plus, Trash2, MapPin, Home, Briefcase, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Address {
  id: string;
  label: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  is_default: boolean;
}

const LABEL_OPTIONS = [
  { value: "Casa", icon: Home, color: "text-emerald-600" },
  { value: "Trabalho", icon: Briefcase, color: "text-blue-600" },
  { value: "Outro", icon: MapPin, color: "text-muted-foreground" },
];

const AddressesTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    label: "Casa",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zip_code: "",
    is_default: false,
  });

  useEffect(() => {
    if (user) fetchAddresses();
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from("user_addresses")
        .select("*")
        .eq("user_id", user?.id)
        .order("is_default", { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("user_addresses").insert({
        user_id: user.id,
        ...formData,
      });

      if (error) throw error;

      toast({ title: "Endereço adicionado", description: "O endereço foi salvo com sucesso." });
      setDialogOpen(false);
      setFormData({ label: "Casa", street: "", number: "", complement: "", neighborhood: "", city: "", state: "", zip_code: "", is_default: false });
      fetchAddresses();
    } catch (error) {
      console.error("Error saving address:", error);
      toast({ title: "Erro", description: "Não foi possível salvar o endereço.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("user_addresses").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Endereço removido", description: "O endereço foi removido com sucesso." });
      fetchAddresses();
    } catch (error) {
      console.error("Error deleting address:", error);
      toast({ title: "Erro", description: "Não foi possível remover o endereço.", variant: "destructive" });
    }
  };

  const setAsDefault = async (id: string) => {
    try {
      await supabase.from("user_addresses").update({ is_default: false }).eq("user_id", user?.id);
      await supabase.from("user_addresses").update({ is_default: true }).eq("id", id);
      toast({ title: "Endereço principal", description: "Este endereço foi definido como principal." });
      fetchAddresses();
    } catch (error) {
      console.error("Error setting default:", error);
    }
  };

  const getLabelIcon = (label: string) => {
    const opt = LABEL_OPTIONS.find((o) => o.value === label);
    if (!opt) return { Icon: MapPin, color: "text-muted-foreground" };
    return { Icon: opt.icon, color: opt.color };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Endereços de Entrega
          </CardTitle>
          <CardDescription>Gerencie seus endereços de entrega</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Endereço
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Endereço</DialogTitle>
              <DialogDescription>Preencha os dados do novo endereço</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Label selector */}
              <div className="space-y-2">
                <Label>Tipo de Endereço</Label>
                <div className="flex gap-2">
                  {LABEL_OPTIONS.map((opt) => {
                    const isSelected = formData.label === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, label: opt.value })}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all text-sm font-medium ${
                          isSelected
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border bg-background text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        <opt.icon className={`h-4 w-4 ${isSelected ? opt.color : ""}`} />
                        {opt.value}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip_code">CEP</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: formatCep(e.target.value) })}
                  placeholder="00000-000"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="street">Rua</Label>
                  <Input id="street" value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Número</Label>
                  <Input id="number" value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input id="complement" value={formData.complement} onChange={(e) => setFormData({ ...formData, complement: e.target.value })} placeholder="Apto, bloco..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input id="neighborhood" value={formData.neighborhood} onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input id="state" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} placeholder="UF" maxLength={2} />
                </div>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Endereço
            </Button>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {addresses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MapPin className="h-14 w-14 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Nenhum endereço cadastrado</p>
            <p className="text-sm mt-1">Adicione seu primeiro endereço de entrega</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((address) => {
              const { Icon, color } = getLabelIcon(address.label);
              return (
                <div
                  key={address.id}
                  className={`relative p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                    address.is_default ? "border-primary/40 bg-primary/[0.02]" : "border-border"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-2 rounded-lg bg-muted`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{address.label}</span>
                        {address.is_default && (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <Star className="h-3 w-3" />
                            Padrão
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {address.street}, {address.number}
                        {address.complement && ` - ${address.complement}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {address.neighborhood}, {address.city} - {address.state}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">CEP: {address.zip_code}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                    {!address.is_default && (
                      <Button variant="outline" size="sm" onClick={() => setAsDefault(address.id)} className="gap-1.5 text-xs flex-1">
                        <Star className="h-3.5 w-3.5" />
                        Definir Padrão
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(address.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 text-xs">
                      <Trash2 className="h-3.5 w-3.5" />
                      Remover
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AddressesTab;
