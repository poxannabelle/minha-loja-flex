import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "R$ 49",
    description: "Perfeito para começar",
    features: [
      "Até 100 produtos",
      "Subdomínio personalizado",
      "Painel de gestão",
      "Integração de pagamento",
      "Suporte por email",
      "SSL gratuito",
    ],
    highlighted: false,
  },
  {
    name: "Professional",
    price: "R$ 99",
    description: "Para lojas em crescimento",
    features: [
      "Até 500 produtos",
      "Domínio próprio",
      "Painel avançado",
      "Múltiplas formas de pagamento",
      "Suporte prioritário",
      "Relatórios detalhados",
      "Marketing integrado",
      "App mobile de gestão",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "R$ 199",
    description: "Para grandes operações",
    features: [
      "Produtos ilimitados",
      "Multi-domínios",
      "Dashboard personalizado",
      "API completa",
      "Gerente de conta dedicado",
      "Integrações customizadas",
      "White-label",
      "SLA garantido",
    ],
    highlighted: false,
  },
];

const Pricing = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Planos simples e transparentes
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sem taxas por venda. Escolha o plano ideal para o seu negócio e pague apenas uma mensalidade fixa.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative ${
                plan.highlighted 
                  ? 'border-accent border-2 shadow-lg scale-105' 
                  : 'border-2'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  Mais Popular
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-base">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button 
                  className={`w-full ${
                    plan.highlighted 
                      ? 'bg-accent hover:bg-accent/90 text-accent-foreground' 
                      : ''
                  }`}
                  variant={plan.highlighted ? 'default' : 'outline'}
                  size="lg"
                >
                  Começar agora
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <p className="text-center text-muted-foreground mt-12">
          Todos os planos incluem 14 dias de teste grátis. Cancele quando quiser.
        </p>
      </div>
    </section>
  );
};

export default Pricing;
