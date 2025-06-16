"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLanding = pathname === "/";

    if (isLanding) {
        return <>{children}</>;
    }

    return (
        <div className="app-shell">
            <Sidebar />
            <main className="main-content">
                <div className="page-container">{children}</div>
            </main>
        </div>
    );
}
