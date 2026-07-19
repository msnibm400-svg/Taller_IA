import React from 'react';
import { Bell, HelpCircle } from 'lucide-react';
import { createClient } from '@/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Obtener datos del usuario autenticado desde el servidor
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Extraer el nombre del usuario de los metadatos o usar el email como fallback
    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';
    const userEmail = user?.email || '';
    // Generar iniciales para el avatar
    const initials = displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="flex h-screen overflow-hidden text-foreground bg-background">
            {/* SideNavBar */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden min-w-0">
                {/* TopNavBar */}
                <header className="flex items-center justify-between h-14 px-6 sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border">
                    <div className="flex items-center gap-4 flex-1">
                        {/* Se removió el buscador general sin funcionalidad para mejorar la interfaz */}
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
                                <p className="text-xs font-semibold text-foreground leading-tight">{displayName}</p>
                                <p className="text-[11px] font-medium text-muted-foreground truncate max-w-[140px]">{userEmail}</p>
                            </div>
                            {/* Avatar generado con iniciales */}
                            <div className="w-9 h-9 rounded-full bg-primary/10 border border-border flex items-center justify-center shrink-0">
                                <span className="text-xs font-bold text-primary">{initials}</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
