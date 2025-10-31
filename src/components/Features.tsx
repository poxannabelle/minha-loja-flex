import { Store, CreditCard, BarChart3, Shield, Smartphone, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Store,
    title: "Sua Loja Exclusiva",
    description: "Subdomínio personalizado e identidade visual única para sua marca",
  },
  {
    icon: CreditCard,
    title: "Pagamentos Seguros",
    description: "Integração com PagSeguro, Mercado Pago e outras plataformas confiáveis",
  },
  {
    icon: BarChart3,
    title: "Gestão Completa",
    description: "Painel administrativo com controle total de pedidos, estoque e clientes",
  },
  {
    icon: Shield,
    title: "100% Seguro",
    description: "Seus dados e transações protegidos com as melhores práticas de segurança",
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    description: "Gerencie sua loja de qualquer lugar, direto do seu celular",
  },
  {
    icon: Zap,
    title: "Deploy Instantâneo",
    description: "Sua loja online em minutos, sem complicação técnica",
  },
];

const Features = () => {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Tudo que você precisa para vender online
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Uma plataforma completa com todas as ferramentas para criar e gerenciar seu e-commerce profissional
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="border-2 hover:border-accent/50 transition-all duration-300 hover:shadow-lg bg-card"
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
