import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Banknote, QrCode, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MenuItemSize {
  id: string;
  name: string;
  price_adjustment: number;
}

interface MenuItemExtra {
  id: string;
  name: string;
  price: number;
}

interface MenuItem {
  id: string;
  name: string;
  base_price: number;
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
}

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  store: Store;
  tableId: string | null;
  onOrderComplete: () => void;
}

const CheckoutModal = ({ 
  open, 
  onOpenChange, 
  cart, 
  store, 
  tableId, 
  onOrderComplete 
}: CheckoutModalProps) => {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  };

  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const total = subtotal; // Add delivery fee, discounts, etc. here if needed

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe seu nome.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create the order
      const { data: orderData, error: orderError } = await supabase
        .from("menu_orders")
        .insert({
          store_id: store.id,
          table_id: tableId || null,
          order_type: tableId ? "dine_in" : "takeout",
          customer_name: customerName.trim(),
          customer_phone: customerPhone.replace(/\D/g, "") || null,
          customer_email: customerEmail.trim() || null,
          notes: notes.trim() || null,
          payment_method: paymentMethod,
          subtotal,
          total,
          status: "pending",
          payment_status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      for (const cartItem of cart) {
        const unitPrice = cartItem.menuItem.base_price + 
          (cartItem.selectedSize?.price_adjustment || 0);
        
        const extrasTotal = cartItem.selectedExtras.reduce(
          (sum, { extra, quantity }) => sum + extra.price * quantity, 
          0
        );

        const { data: orderItemData, error: itemError } = await supabase
          .from("menu_order_items")
          .insert({
            order_id: orderData.id,
            menu_item_id: cartItem.menuItem.id,
            quantity: cartItem.quantity,
            size_id: cartItem.selectedSize?.id || null,
            unit_price: unitPrice,
            extras_total: extrasTotal,
            total_price: cartItem.totalPrice,
            notes: cartItem.notes || null,
          })
          .select()
          .single();

        if (itemError) throw itemError;

        // Create order item extras
        for (const { extra, quantity } of cartItem.selectedExtras) {
          const { error: extraError } = await supabase
            .from("menu_order_item_extras")
            .insert({
              order_item_id: orderItemData.id,
              extra_id: extra.id,
              quantity,
              price: extra.price,
            });

          if (extraError) throw extraError;
        }
      }

      // =================================================================
      // TODO: INTEGRAÇÃO COM GATEWAY DE PAGAMENTO
      // =================================================================
      // Aqui você deve integrar com o gateway de pagamento escolhido.
      // 
      // Exemplos de integrações:
      //
      // 1. STRIPE:
      //    - Criar PaymentIntent no backend (edge function)
      //    - Usar Stripe Elements ou Checkout Session
      //    - Exemplo:
      //    // const { data } = await supabase.functions.invoke('create-payment-intent', {
      //    //   body: { orderId: orderData.id, amount: total }
      //    // });
      //    // Redirecionar para Stripe Checkout ou mostrar modal de pagamento
      //
      // 2. MERCADO PAGO:
      //    - Criar preferência de pagamento
      //    - Usar Checkout Pro ou Checkout Transparente
      //    // const { data } = await supabase.functions.invoke('create-mercadopago-preference', {
      //    //   body: { orderId: orderData.id, amount: total }
      //    // });
      //
      // 3. PIX (via PagSeguro, Gerencianet, etc.):
      //    - Gerar QR Code PIX
      //    - Mostrar modal com QR Code para pagamento
      //    // const { data } = await supabase.functions.invoke('generate-pix-qrcode', {
      //    //   body: { orderId: orderData.id, amount: total }
      //    // });
      //    // Exibir data.qrCode e data.pixCopyPaste
      //
      // 4. PAGARME:
      //    - Criar transação
      //    // const { data } = await supabase.functions.invoke('create-pagarme-transaction', {
      //    //   body: { orderId: orderData.id, amount: total, paymentMethod }
      //    // });
      //
      // Após sucesso do pagamento, atualizar o status:
      // await supabase
      //   .from("menu_orders")
      //   .update({ payment_status: "paid" })
      //   .eq("id", orderData.id);
      //
      // =================================================================

      toast({
        title: "Pedido realizado!",
        description: `Pedido #${orderData.id.slice(0, 8)} criado com sucesso.`,
      });

      onOrderComplete();
      
      // Reset form
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setNotes("");
      setPaymentMethod("pix");
      
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Erro ao criar pedido",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finalizar Pedido</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <div>
            <h4 className="font-medium mb-3">Resumo do Pedido</h4>
            <div className="space-y-2 text-sm">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span>
                    {item.quantity}x {item.menuItem.name}
                    {item.selectedSize && ` (${item.selectedSize.name})`}
                  </span>
                  <span>{formatCurrency(item.totalPrice)}</span>
                </div>
              ))}
            </div>
            <Separator className="my-3" />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-4">
            <h4 className="font-medium">Seus Dados</h4>
            
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Alguma observação para o pedido?"
                rows={2}
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <h4 className="font-medium mb-3">Forma de Pagamento</h4>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="grid gap-2">
                <Label
                  htmlFor="pix"
                  className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 [&:has(:checked)]:border-primary"
                >
                  <RadioGroupItem value="pix" id="pix" />
                  <QrCode className="h-5 w-5" />
                  <span>PIX</span>
                </Label>
                
                <Label
                  htmlFor="credit"
                  className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 [&:has(:checked)]:border-primary"
                >
                  <RadioGroupItem value="credit" id="credit" />
                  <CreditCard className="h-5 w-5" />
                  <span>Cartão de Crédito</span>
                </Label>
                
                <Label
                  htmlFor="debit"
                  className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 [&:has(:checked)]:border-primary"
                >
                  <RadioGroupItem value="debit" id="debit" />
                  <CreditCard className="h-5 w-5" />
                  <span>Cartão de Débito</span>
                </Label>
                
                <Label
                  htmlFor="cash"
                  className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 [&:has(:checked)]:border-primary"
                >
                  <RadioGroupItem value="cash" id="cash" />
                  <Banknote className="h-5 w-5" />
                  <span>Dinheiro</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Submit Button */}
          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              `Confirmar Pedido - ${formatCurrency(total)}`
            )}
          </Button>

          {/* 
            =================================================================
            TODO: COMPONENTES DE PAGAMENTO
            =================================================================
            Dependendo do gateway escolhido, adicione aqui os componentes:
            
            - Stripe: <Elements> com CardElement
            - Mercado Pago: Checkout Bricks
            - PIX: Modal com QR Code
            
            Exemplo com Stripe:
            import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
            
            <Elements stripe={stripePromise}>
              <CardElement />
            </Elements>
            =================================================================
          */}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutModal;
