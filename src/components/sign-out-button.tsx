'use client';

import { LogOut } from 'lucide-react';
import { signout } from '@/app/auth/actions';

/**
 * Botón de cierre de sesión.
 * Usa un form con action={signout} para invocar la Server Action desde el cliente.
 * No requiere estado local ni useRouter; la redirección la maneja la Server Action.
 */
export function SignOutButton() {
    return (
        <form action={signout}>
            <button
                type="submit"
                className="w-full flex items-center gap-3 text-destructive hover:bg-destructive/10 transition-colors rounded-lg px-3 py-2"
            >
                <LogOut className="w-5 h-5" />
                <span className="text-sm">Cerrar Sesión</span>
            </button>
        </form>
    );
}
