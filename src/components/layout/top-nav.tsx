import { Search, Bell, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

export function TopNavBar() {
  return (
    <header className="flex items-center justify-between h-14 px-6 sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            className="w-full bg-background border-none rounded-full pl-9 pr-4 h-9 focus-visible:ring-1 focus-visible:ring-primary/50" 
            placeholder="Buscar pacientes, citas..." 
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors rounded-full">
          <Bell className="w-5 h-5" />
        </button>
        <button className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors rounded-full">
          <HelpCircle className="w-5 h-5" />
        </button>
        <div className="h-8 w-[1px] bg-border mx-2"></div>
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-foreground leading-tight">Dr. Julian Garcia</p>
            <p className="text-xs text-muted-foreground">Administrador</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-muted border border-border overflow-hidden">
            <img 
              className="w-full h-full object-cover" 
              alt="Profile" 
              src="https://api.dicebear.com/9.x/notionists/svg?seed=Julian"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
