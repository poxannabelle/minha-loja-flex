import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Plus, Trash2, CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaymentMethod {
  id: string;
  type: string;
  label: string;
  last_four_digits: string | null;
  brand: string | null;
  is_default: boolean;
}

const PaymentMethodsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "credit_card",
    label: "",
    last_four_digits: "",
    brand: "",
    is_default: false,
  });

  useEffect(() => {
    if (user) {
      fetchMethods();
    }
  }, [user]);

  const fetchMethods = async () => {
    try {
      const { data, error } = await supabase
        .from("user_payment_methods")
        .select("*")
        .eq("user_id", user?.id)
        .order("is_default", { ascending: false });

      if (error) throw error;
      setMethods(data || []);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("user_payment_methods").insert({
        user_id: user.id,
        ...formData,
      });

      if (error) throw error;

      toast({
        title: "Forma de pagamento adicionada",
        description: "A forma de pagamento foi salva com sucesso.",
      });
      setDialogOpen(false);
      setFormData({
        type: "credit_card",
        label: "",
        last_four_digits: "",
        brand: "",
        is_default: false,
      });
      fetchMethods();
    } catch (error) {
      console.error("Error saving payment method:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a forma de pagamento.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("user_payment_methods").delete().eq("id", id);
      if (error) throw error;

      toast({
        title: "Forma de pagamento removida",
        description: "A forma de pagamento foi removida com sucesso.",
      });
      fetchMethods();
    } catch (error) {
      console.error("Error deleting payment method:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a forma de pagamento.",
        variant: "destructive",
      });
    }
  };

  const setAsDefault = async (id: string) => {
    try {
      await supabase
        .from("user_payment_methods")
        .update({ is_default: false })
        .eq("user_id", user?.id);

      await supabase.from("user_payment_methods").update({ is_default: true }).eq("id", id);

      toast({
        title: "Pagamento principal",
        description: "Esta forma de pagamento foi definida como principal.",
      });
      fetchMethods();
    } catch (error) {
      console.error("Error setting default:", error);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "credit_card":
        return "Cartão de Crédito";
      case "debit_card":
        return "Cartão de Débito";
      case "pix":
        return "PIX";
      default:
        return type;
    }
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
          <CardTitle>Formas de Pagamento</CardTitle>
          <CardDescription>Gerencie suas formas de pagamento</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Forma
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Forma de Pagamento</DialogTitle>
              <DialogDescription>Preencha os dados da nova forma de pagamento</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                    <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Apelido</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Meu cartão principal"
                />
              </div>
              {formData.type !== "pix" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="last_four">Últimos 4 dígitos</Label>
                    <Input
                      id="last_four"
                      value={formData.last_four_digits}
                      onChange={(e) =>
                        setFormData({ ...formData, last_four_digits: e.target.value.slice(0, 4) })
                      }
                      placeholder="1234"
                      maxLength={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">Bandeira</Label>
                    <Select
                      value={formData.brand}
                      onValueChange={(value) => setFormData({ ...formData, brand: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a bandeira" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visa">Visa</SelectItem>
                        <SelectItem value="mastercard">Mastercard</SelectItem>
                        <SelectItem value="elo">Elo</SelectItem>
                        <SelectItem value="amex">American Express</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Forma de Pagamento
            </Button>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {methods.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma forma de pagamento cadastrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {methods.map((method) => (
              <div
                key={method.id}
                className="flex items-start justify-between p-4 border rounded-lg"
              >
                <div className="flex gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{method.label}</span>
                      {method.is_default && <Badge variant="secondary">Principal</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getTypeLabel(method.type)}
                      {method.last_four_digits && ` •••• ${method.last_four_digits}`}
                      {method.brand && ` (${method.brand})`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!method.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAsDefault(method.id)}
                    >
                      Definir Principal
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(method.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentMethodsTab;
