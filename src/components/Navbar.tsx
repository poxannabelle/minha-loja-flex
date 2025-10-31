import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, Package, ShoppingCart, ClipboardList, User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/plazoo-logo.png";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Plazoo" className="h-12" />
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link to="/empresas">
              <Button variant="ghost" className="gap-2">
                <Building2 className="h-4 w-4" />
                Empresas
              </Button>
            </Link>
            <Link to="/produtos">
              <Button variant="ghost" className="gap-2">
                <Package className="h-4 w-4" />
                Produtos
              </Button>
            </Link>
            <Link to="/estoque">
              <Button variant="ghost" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                Estoque
              </Button>
            </Link>
            <Link to="/pedidos">
              <Button variant="ghost" className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                Pedidos
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <User className="h-4 w-4" />
                    Minha Conta
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate("/auth")}>
                  Login
                </Button>
                <Button 
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={() => navigate("/auth")}
                >
                  Cadastrar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
