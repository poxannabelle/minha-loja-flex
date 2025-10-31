import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Pronto para começar a vender online?
          </h2>
          <p className="text-xl mb-12 opacity-90">
            Junte-se a milhares de empresas que já confiam na Plazoo para gerenciar suas vendas online
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6 shadow-xl"
            >
              Criar minha loja grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 border-2 border-primary-foreground/20 bg-transparent hover:bg-primary-foreground/10 text-primary-foreground"
            >
              Falar com vendas
            </Button>
          </div>
          
          <p className="mt-8 text-sm opacity-75">
            ✓ 14 dias grátis  ✓ Sem cartão de crédito  ✓ Suporte em português
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
