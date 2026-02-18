import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, CreditCard, ShoppingCart, Heart, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import AddressesTab from "@/components/user/AddressesTab";
import PaymentMethodsTab from "@/components/user/PaymentMethodsTab";
import CartTab from "@/components/user/CartTab";
import FavoritesTab from "@/components/user/FavoritesTab";
import ProfileTab from "@/components/user/ProfileTab";

const MinhaConta = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Minha Conta</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Gerencie suas informações pessoais</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-auto p-1">
            <TabsTrigger value="profile" className="gap-2 py-2.5 data-[state=active]:shadow-sm">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="addresses" className="gap-2 py-2.5 data-[state=active]:shadow-sm">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Endereços</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2 py-2.5 data-[state=active]:shadow-sm">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Cartões</span>
            </TabsTrigger>
            <TabsTrigger value="cart" className="gap-2 py-2.5 data-[state=active]:shadow-sm">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Carrinho</span>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2 py-2.5 data-[state=active]:shadow-sm">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Favoritos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>
          <TabsContent value="addresses">
            <AddressesTab />
          </TabsContent>
          <TabsContent value="payments">
            <PaymentMethodsTab />
          </TabsContent>
          <TabsContent value="cart">
            <CartTab />
          </TabsContent>
          <TabsContent value="favorites">
            <FavoritesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MinhaConta;
