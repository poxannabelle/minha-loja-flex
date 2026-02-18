import Navbar from "@/components/Navbar";
import StoreBrandingWrapper from "@/components/StoreBrandingWrapper";
import { useStoreContext } from "@/hooks/useStoreContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users,
  Store,
  AlertTriangle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "warning" | "success";
}

const StatCard = ({ title, value, description, icon, trend, variant = "default" }: StatCardProps) => {
  const variantStyles = {
    default: "bg-card",
    warning: "bg-amber-500/10 border-amber-500/20",
    success: "bg-emerald-500/10 border-emerald-500/20"
  };

  return (
    <Card className={variantStyles[variant]}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 bg-accent/10 rounded-lg">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-sm ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend.isPositive ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
            <span>{trend.value}% vs. mês anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { selectedStore } = useStoreContext();
  const selectedStoreId = selectedStore?.id || "";

  // Buscar produtos filtrados pela loja selecionada
  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['dashboard-products', selectedStoreId],
    queryFn: async () => {
      let query = supabase.from('products').select('id, price, stock_quantity, status');
      if (selectedStoreId) query = query.eq('store_id', selectedStoreId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Buscar lojas
  const { data: stores, isLoading: loadingStores } = useQuery({
    queryKey: ['dashboard-stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('id, status');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Buscar categorias filtradas pela loja
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['dashboard-categories', selectedStoreId],
    queryFn: async () => {
      let query = supabase.from('categories').select('id');
      if (selectedStoreId) query = query.eq('store_id', selectedStoreId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const isLoading = loadingProducts || loadingStores || loadingCategories;

  // Calcular métricas
  const totalProducts = products?.length || 0;
  const activeProducts = products?.filter(p => p.status === 'ativo').length || 0;
  const draftProducts = products?.filter(p => p.status === 'rascunho').length || 0;
  const inactiveProducts = products?.filter(p => p.status === 'inativo').length || 0;
  
  const totalStock = products?.reduce((acc, p) => acc + (p.stock_quantity || 0), 0) || 0;
  const lowStockProducts = products?.filter(p => p.stock_quantity <= 5 && p.stock_quantity > 0).length || 0;
  const outOfStock = products?.filter(p => p.stock_quantity === 0).length || 0;
  
  const totalValue = products?.reduce((acc, p) => acc + (Number(p.price) * p.stock_quantity), 0) || 0;
  const avgPrice = totalProducts > 0 
    ? (products?.reduce((acc, p) => acc + Number(p.price), 0) || 0) / totalProducts 
    : 0;

  const totalStores = stores?.length || 0;
  const activeStores = stores?.filter(s => s.status === 'ativa').length || 0;
  const totalCategories = categories?.length || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Acesso Restrito</h1>
            <p className="text-muted-foreground">Faça login para acessar o painel de controle.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <StoreBrandingWrapper title="Visão Geral" subtitle="Acompanhe os principais indicadores do seu negócio">
        <div className="container mx-auto px-6 py-8">

        {/* Indicadores Principais */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {isLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <StatCard
                title="Total de Produtos"
                value={totalProducts}
                description={`${activeProducts} ativos, ${draftProducts} rascunhos`}
                icon={<Package className="h-5 w-5 text-accent" />}
              />
              <StatCard
                title="Unidades em Estoque"
                value={totalStock.toLocaleString('pt-BR')}
                description={`${lowStockProducts} com estoque baixo`}
                icon={<BarChart3 className="h-5 w-5 text-accent" />}
              />
              <StatCard
                title="Valor em Estoque"
                value={formatCurrency(totalValue)}
                description={`Preço médio: ${formatCurrency(avgPrice)}`}
                icon={<DollarSign className="h-5 w-5 text-accent" />}
              />
              <StatCard
                title="Lojas Ativas"
                value={activeStores}
                description={`${totalStores} lojas cadastradas`}
                icon={<Store className="h-5 w-5 text-accent" />}
              />
            </>
          )}
        </div>

        {/* Alertas e Status */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <StatCard
            title="Produtos sem Estoque"
            value={outOfStock}
            description="Requerem reposição imediata"
            icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
            variant={outOfStock > 0 ? "warning" : "default"}
          />
          <StatCard
            title="Estoque Baixo"
            value={lowStockProducts}
            description="Produtos com 5 ou menos unidades"
            icon={<TrendingDown className="h-5 w-5 text-amber-500" />}
            variant={lowStockProducts > 0 ? "warning" : "default"}
          />
          <StatCard
            title="Categorias"
            value={totalCategories}
            description="Categorias de produtos cadastradas"
            icon={<TrendingUp className="h-5 w-5 text-accent" />}
          />
        </div>

        {/* Detalhamento por Status */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Status dos Produtos
              </CardTitle>
              <CardDescription>Distribuição por status de publicação</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-sm">Ativos</span>
                  </div>
                  <span className="font-semibold">{activeProducts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-sm">Rascunhos</span>
                  </div>
                  <span className="font-semibold">{draftProducts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400" />
                    <span className="text-sm">Inativos</span>
                  </div>
                  <span className="font-semibold">{inactiveProducts}</span>
                </div>
              </div>
              
              {/* Progress bar visual */}
              <div className="mt-6 h-3 bg-muted rounded-full overflow-hidden flex">
                {totalProducts > 0 && (
                  <>
                    <div 
                      className="bg-emerald-500 h-full transition-all"
                      style={{ width: `${(activeProducts / totalProducts) * 100}%` }}
                    />
                    <div 
                      className="bg-amber-500 h-full transition-all"
                      style={{ width: `${(draftProducts / totalProducts) * 100}%` }}
                    />
                    <div 
                      className="bg-gray-400 h-full transition-all"
                      style={{ width: `${(inactiveProducts / totalProducts) * 100}%` }}
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Status das Lojas
              </CardTitle>
              <CardDescription>Situação das lojas cadastradas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-sm">Ativas</span>
                  </div>
                  <span className="font-semibold">{activeStores}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-sm">Em Configuração</span>
                  </div>
                  <span className="font-semibold">{stores?.filter(s => s.status === 'em_configuracao').length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400" />
                    <span className="text-sm">Inativas</span>
                  </div>
                  <span className="font-semibold">{stores?.filter(s => s.status === 'inativa').length || 0}</span>
                </div>
              </div>

              {/* Progress bar visual */}
              <div className="mt-6 h-3 bg-muted rounded-full overflow-hidden flex">
                {totalStores > 0 && (
                  <>
                    <div 
                      className="bg-emerald-500 h-full transition-all"
                      style={{ width: `${(activeStores / totalStores) * 100}%` }}
                    />
                    <div 
                      className="bg-amber-500 h-full transition-all"
                      style={{ width: `${((stores?.filter(s => s.status === 'em_configuracao').length || 0) / totalStores) * 100}%` }}
                    />
                    <div 
                      className="bg-gray-400 h-full transition-all"
                      style={{ width: `${((stores?.filter(s => s.status === 'inativa').length || 0) / totalStores) * 100}%` }}
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </StoreBrandingWrapper>
    </div>
  );
};

export default Dashboard;
