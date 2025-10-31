import { UserPlus, Palette, ShoppingBag, Rocket } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "1. Cadastre-se",
    description: "Crie sua conta em minutos, sem complicação",
  },
  {
    icon: Palette,
    title: "2. Personalize",
    description: "Configure sua loja com sua identidade visual",
  },
  {
    icon: ShoppingBag,
    title: "3. Adicione Produtos",
    description: "Cadastre seu catálogo e configure pagamentos",
  },
  {
    icon: Rocket,
    title: "4. Venda!",
    description: "Sua loja está no ar, pronta para vender",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 bg-gradient-hero">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Como funciona?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Quatro passos simples para ter sua loja online funcionando
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="relative flex flex-col items-center text-center group"
            >
              <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-all duration-300">
                <step.icon className="h-10 w-10 text-accent" />
              </div>
              
              <h3 className="text-xl font-bold text-foreground mb-3">
                {step.title}
              </h3>
              
              <p className="text-muted-foreground">
                {step.description}
              </p>
              
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 -right-4 w-8 h-0.5 bg-accent/30"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
