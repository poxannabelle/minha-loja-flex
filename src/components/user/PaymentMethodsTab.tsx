import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Plus, Trash2, CreditCard, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PaymentMethod {
  id: string;
  type: string;
  label: string;
  last_four_digits: string | null;
  brand: string | null;
  is_default: boolean;
  card_number: string | null;
  expiry_month: string | null;
  expiry_year: string | null;
  cvv: string | null;
  cardholder_name: string | null;
  cardholder_cpf: string | null;
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
    card_number: "",
    expiry_month: "",
    expiry_year: "",
    cvv: "",
    cardholder_name: "",
    cardholder_cpf: "",
  });

  useEffect(() => {
    if (user) fetchMethods();
  }, [user]);

  const fetchMethods = async () => {
    try {
      const { data, error } = await supabase
        .from("user_payment_methods")
        .select("*")
        .eq("user_id", user?.id)
        .order("is_default", { ascending: false });

      if (error) throw error;
      setMethods((data || []) as PaymentMethod[]);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const detectBrand = (number: string): string => {
    const d = number.replace(/\D/g, "");
    if (/^4/.test(d)) return "visa";
    if (/^5[1-5]/.test(d)) return "mastercard";
    if (/^3[47]/.test(d)) return "amex";
    if (/^(636368|438935|504175|451416|636297|5067|4576|4011|506699)/.test(d)) return "elo";
    return "";
  };

  const handleSave = async () => {
    if (!user) return;
    if (!formData.card_number || !formData.expiry_month || !formData.expiry_year || !formData.cvv || !formData.cardholder_name || !formData.label) {
      toast({ title: "Atenção", description: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const digits = formData.card_number.replace(/\D/g, "");
      const brand = detectBrand(digits);

      const { error } = await supabase.from("user_payment_methods").insert({
        user_id: user.id,
        type: formData.type,
        label: formData.label,
        last_four_digits: digits.slice(-4),
        brand,
        card_number: formData.card_number,
        expiry_month: formData.expiry_month,
        expiry_year: formData.expiry_year,
        cvv: formData.cvv,
        cardholder_name: formData.cardholder_name,
        cardholder_cpf: formData.cardholder_cpf,
      } as any);

      if (error) throw error;

      toast({ title: "Cartão adicionado", description: "Seu cartão foi salvo com sucesso." });
      setDialogOpen(false);
      resetForm();
      fetchMethods();
    } catch (error) {
      console.error("Error saving payment method:", error);
      toast({ title: "Erro", description: "Não foi possível salvar o cartão.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({ type: "credit_card", label: "", card_number: "", expiry_month: "", expiry_year: "", cvv: "", cardholder_name: "", cardholder_cpf: "" });
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("user_payment_methods").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Cartão removido", description: "O cartão foi removido com sucesso." });
      fetchMethods();
    } catch (error) {
      console.error("Error deleting payment method:", error);
      toast({ title: "Erro", description: "Não foi possível remover o cartão.", variant: "destructive" });
    }
  };

  const setAsDefault = async (id: string) => {
    try {
      await supabase.from("user_payment_methods").update({ is_default: false }).eq("user_id", user?.id);
      await supabase.from("user_payment_methods").update({ is_default: true }).eq("id", id);
      toast({ title: "Cartão principal", description: "Este cartão foi definido como principal." });
      fetchMethods();
    } catch (error) {
      console.error("Error setting default:", error);
    }
  };

  const getBrandLogo = (brand: string | null) => {
    switch (brand) {
      case "visa": return "💳 Visa";
      case "mastercard": return "💳 Mastercard";
      case "elo": return "💳 Elo";
      case "amex": return "💳 Amex";
      default: return "💳";
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => String(currentYear + i));

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
            <CreditCard className="h-5 w-5" />
            Cartões Salvos
          </CardTitle>
          <CardDescription>Gerencie seus cartões de crédito e débito</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Cartão
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Cartão</DialogTitle>
              <DialogDescription>Preencha os dados do seu cartão</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Card type */}
              <div className="space-y-2">
                <Label>Tipo do Cartão</Label>
                <div className="flex gap-2">
                  {[
                    { value: "credit_card", label: "Crédito" },
                    { value: "debit_card", label: "Débito" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: opt.value })}
                      className={`flex-1 px-4 py-2.5 rounded-lg border-2 transition-all text-sm font-medium ${
                        formData.type === opt.value
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardLabel">Apelido do Cartão *</Label>
                <Input
                  id="cardLabel"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Ex: Meu Nubank"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardNumber">Número do Cartão *</Label>
                <Input
                  id="cardNumber"
                  value={formData.card_number}
                  onChange={(e) => setFormData({ ...formData, card_number: formatCardNumber(e.target.value) })}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Mês *</Label>
                  <select
                    value={formData.expiry_month}
                    onChange={(e) => setFormData({ ...formData, expiry_month: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Mês</option>
                    {months.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Ano *</Label>
                  <select
                    value={formData.expiry_year}
                    onChange={(e) => setFormData({ ...formData, expiry_year: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Ano</option>
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV *</Label>
                  <Input
                    id="cvv"
                    value={formData.cvv}
                    onChange={(e) => setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    placeholder="000"
                    maxLength={4}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardholderName">Nome no Cartão *</Label>
                <Input
                  id="cardholderName"
                  value={formData.cardholder_name}
                  onChange={(e) => setFormData({ ...formData, cardholder_name: e.target.value.toUpperCase() })}
                  placeholder="NOME COMO NO CARTÃO"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardholderCpf">CPF do Titular</Label>
                <Input
                  id="cardholderCpf"
                  value={formData.cardholder_cpf}
                  onChange={(e) => setFormData({ ...formData, cardholder_cpf: formatCpf(e.target.value) })}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Cartão
            </Button>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {methods.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CreditCard className="h-14 w-14 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Nenhum cartão cadastrado</p>
            <p className="text-sm mt-1">Adicione seu primeiro cartão</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {methods.map((method) => (
              <div
                key={method.id}
                className={`relative p-5 rounded-xl border-2 transition-all hover:shadow-md ${
                  method.is_default ? "border-primary/40 bg-primary/[0.02]" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">{method.label}</span>
                      {method.is_default && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Star className="h-3 w-3" />
                          Principal
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {method.type === "credit_card" ? "Crédito" : "Débito"}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{getBrandLogo(method.brand)}</span>
                </div>

                <div className="font-mono text-lg tracking-widest text-foreground/80 mb-2">
                  •••• •••• •••• {method.last_four_digits || "****"}
                </div>

                {method.cardholder_name && (
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {method.cardholder_name}
                  </p>
                )}
                {method.expiry_month && method.expiry_year && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Validade: {method.expiry_month}/{method.expiry_year}
                  </p>
                )}

                <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                  {!method.is_default && (
                    <Button variant="outline" size="sm" onClick={() => setAsDefault(method.id)} className="gap-1.5 text-xs flex-1">
                      <Star className="h-3.5 w-3.5" />
                      Definir Principal
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(method.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 text-xs">
                    <Trash2 className="h-3.5 w-3.5" />
                    Remover
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
