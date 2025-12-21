import { useState, lazy, Suspense, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Activity, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load pages for code splitting
const DashboardPage = lazy(() => import("./dashboard"));
const HealthPage = lazy(() => import("./health"));
const MetricsPage = lazy(() => import("./metrics"));

const MonitorLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Map path to tab index
    const getTabFromPath = (pathname: string) => {
        if (pathname.includes("/health")) return 1;
        if (pathname.includes("/metrics")) return 2;
        return 0; // dashboard
    };

    const [activeTab, setActiveTab] = useState(getTabFromPath(location.pathname));

    // Sync URL with active tab
    useEffect(() => {
        setActiveTab(getTabFromPath(location.pathname));
    }, [location.pathname]);

    const navItems = [
        {
            title: "Dashboard",
            href: "/admin/monitor/dashboard",
            icon: LayoutDashboard,
            component: DashboardPage,
        },
        {
            title: "Service Health",
            href: "/admin/monitor/health",
            icon: Activity,
            component: HealthPage,
        },
        {
            title: "Metrics",
            href: "/admin/monitor/metrics",
            icon: LineChart,
            component: MetricsPage,
        },
    ];

    const handleTabClick = (index: number, href: string) => {
        setActiveTab(index);
        navigate(href, { replace: true });
    };

    const LoadingFallback = () => (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
            </div>
            <Skeleton className="h-64 rounded-xl" />
        </div>
    );

    return (
        <div className="flex h-full flex-col">
            {/* Horizontal Tabs Navigation */}
            <div className="border-b border-gray-200 bg-white px-6">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    {navItems.map((item, index) => {
                        const isActive = activeTab === index;
                        return (
                            <button
                                key={item.href}
                                onClick={() => handleTabClick(index, item.href)}
                                className={cn(
                                    "flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors duration-200",
                                    isActive
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                )}
                            >
                                <item.icon className={cn("h-4 w-4", isActive ? "text-blue-600" : "text-gray-400")} />
                                {item.title}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Main Content - All tabs rendered but hidden when inactive */}
            <main className="flex-1 overflow-auto bg-gray-50/50 p-6">
                {navItems.map((item, index) => {
                    const Component = item.component;
                    return (
                        <div
                            key={item.href}
                            className={cn(
                                "h-full",
                                activeTab === index ? "block" : "hidden"
                            )}
                        >
                            <Suspense fallback={<LoadingFallback />}>
                                <Component />
                            </Suspense>
                        </div>
                    );
                })}
            </main>
        </div>
    );
};

export default MonitorLayout;
