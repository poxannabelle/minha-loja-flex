import logo from "@/assets/plazoo-logo.png";

const Footer = () => {
  return (
    <footer className="bg-secondary/30 border-t border-border py-12">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <img src={logo} alt="Plazoo" className="h-12 mb-4" />
            <p className="text-sm text-muted-foreground">
              A plataforma completa para criar e gerenciar sua loja virtual
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Produto</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-accent transition-colors">Funcionalidades</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Preços</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Integrações</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">API</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-accent transition-colors">Sobre nós</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Carreiras</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Contato</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Suporte</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-accent transition-colors">Central de ajuda</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Documentação</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Status</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Termos de uso</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Plazoo. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
