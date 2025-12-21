import { useEffect, useState } from "react";
import { Server, Activity, AlertCircle, Cpu, HardDrive, ExternalLink, RefreshCw, CheckCircle2, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDashboardSummary } from "@/services/monitorApi";
import type { DashboardSummary } from "@/types/monitor";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const DashboardPage = () => {
    const [data, setData] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const res = await getDashboardSummary();
            setData(res.data.data);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Failed to fetch dashboard", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
        const interval = setInterval(fetchDashboard, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const infrastructureLinks = [
        { name: "Prometheus", port: 9090, url: "http://localhost:9090", description: "Metrics Database", color: "text-orange-600 bg-orange-100" },
        { name: "Grafana", port: 3000, url: "http://localhost:3000", description: "Visualization Dashboard", color: "text-orange-500 bg-orange-50" },
        { name: "Eureka", port: 8761, url: "http://localhost:8761", description: "Service Registry", color: "text-green-600 bg-green-100" },
        { name: "Kafka UI", port: 8888, url: "http://localhost:8888", description: "Message Broker UI", color: "text-purple-600 bg-purple-100" },
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">Monitoring Dashboard</h1>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-64 rounded-xl" />
                    <Skeleton className="h-64 rounded-xl" />
                </div>
            </div>
        );
    }

    if (!data) {
        return <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="space-y-2">
                <h3 className="text-lg font-semibold">Failed to load dashboard data</h3>
                <p className="text-muted-foreground">Please check if the monitor service is running.</p>
                <Button onClick={fetchDashboard} variant="outline">Try Again</Button>
            </div>
        </div>;
    }

    // Heuristic for "N/A" or small values
    const formatPercent = (val: number) => {
        if (val === 0 && data.totalServices > 0) return "< 0.1%"; // It's running, so likely just very low
        return `${val.toFixed(1)}%`;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Monitor</h1>
                    <p className="text-gray-500 mt-1">Overview of system performance and health status.</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-1 rounded-lg border shadow-sm">
                    <div className="px-3 py-1 bg-gray-50 rounded text-xs font-medium text-gray-500 flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span>Live Updates</span>
                    </div>
                    <div className="h-4 w-px bg-gray-200"></div>
                    <span className="text-xs text-gray-400 font-mono pr-2">
                        {lastUpdated.toLocaleTimeString()}
                    </span>
                    <Button variant="ghost" size="icon" onClick={fetchDashboard} className="h-6 w-6 text-gray-400 hover:text-blue-600">
                        <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Stats Cards - Compact Horizontal Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Services */}
                <Card className="border shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                            <Server className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Services</p>
                            <h3 className="text-2xl font-bold text-gray-900">{data.totalServices}</h3>
                        </div>
                    </CardContent>
                </Card>

                {/* Healthy Services */}
                <Card className="border shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Healthy</p>
                            <h3 className="text-2xl font-bold text-emerald-600">{data.healthyServices}</h3>
                        </div>
                    </CardContent>
                </Card>

                {/* Unhealthy Services */}
                <Card className="border shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center", data.unhealthyServices > 0 ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-400")}>
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Unhealthy</p>
                            <h3 className={cn("text-2xl font-bold", data.unhealthyServices > 0 ? "text-red-600" : "text-gray-900")}>{data.unhealthyServices}</h3>
                        </div>
                    </CardContent>
                </Card>

                {/* Avg CPU Usage */}
                <Card className="border shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Cpu className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg CPU Load</p>
                            <h3 className="text-2xl font-bold text-gray-900">{formatPercent(data.avgCpuUsagePercent)}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Infrastructure Links */}
                <Card className="lg:col-span-2 border-gray-200 shadow-sm bg-white">
                    <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4">
                        <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
                            <Server className="h-4.5 w-4.5 text-blue-600" />
                            Infrastructure Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            {infrastructureLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative flex items-start gap-4 rounded-xl border border-gray-200 p-4 transition-all hover:border-blue-300 hover:shadow-md hover:bg-blue-50/30 bg-white"
                                >
                                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0 mt-0.5", link.color)}>
                                        <ExternalLink className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{link.name}</span>
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
                                                <span className="relative flex h-1.5 w-1.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                                </span>
                                                <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Online</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-1 line-clamp-1">{link.description}</p>
                                        <p className="text-[10px] font-mono text-gray-400">localhost:{link.port}</p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Active Alerts */}
                <Card className="border-gray-200 shadow-sm bg-white flex flex-col">
                    <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4 flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
                            <AlertCircle className="h-4.5 w-4.5 text-amber-500" />
                            Active Alerts
                        </CardTitle>
                        {data.activeAlerts.length > 0 && (
                            <Badge variant="destructive" className="rounded-full px-2 py-0.5 text-xs font-bold">
                                {data.activeAlerts.length}
                            </Badge>
                        )}
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden">
                        {data.activeAlerts.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center gap-4 py-8 text-center px-6">
                                <div className="rounded-full bg-emerald-50 p-6 shadow-sm border border-emerald-100 animate-pulse">
                                    <ShieldCheck className="h-10 w-10 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">All Systems Operational</p>
                                    <p className="text-sm text-gray-500 mt-1 max-w-[200px] mx-auto">Running smoothly. No critical issues detected.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                                {data.activeAlerts.map((alert, idx) => (
                                    <div key={idx} className="relative p-4 hover:bg-red-50/50 transition-colors group">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="flex items-start justify-between mb-1">
                                            <p className="text-sm font-bold text-gray-900">{alert.serviceName}</p>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(alert.triggeredAt).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Badge variant="outline" className="text-[10px] font-bold text-red-600 bg-red-50 border-red-100 px-1.5 py-0 rounded mt-0.5">
                                                {alert.alertType}
                                            </Badge>
                                            <p className="text-xs text-gray-600 leading-snug line-clamp-2">{alert.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* System Resources */}
            <Card className="border-gray-200 shadow-sm bg-white">
                <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4">
                    <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
                        <HardDrive className="h-4.5 w-4.5 text-indigo-600" />
                        System Resources Overview
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid gap-12 md:grid-cols-2">
                        {/* Memory */}
                        <div className="space-y-4">
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Average Memory Usage</p>
                                    <h4 className="text-2xl font-bold text-gray-900 mt-1">{data.avgMemoryUsagePercent.toFixed(1)}%</h4>
                                </div>
                                <div className={cn("text-xs font-bold px-2 py-1 rounded-full border",
                                    data.avgMemoryUsagePercent > 80 ? "bg-red-50 text-red-700 border-red-200" : "bg-blue-50 text-blue-700 border-blue-200"
                                )}>
                                    {data.avgMemoryUsagePercent > 80 ? "High Load" : "Healthy"}
                                </div>
                            </div>
                            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                                <div
                                    className={cn("h-full transition-all duration-1000 ease-out rounded-full shadow-sm",
                                        data.avgMemoryUsagePercent > 80 ? "bg-red-500" : "bg-blue-500"
                                    )}
                                    style={{ width: `${Math.min(data.avgMemoryUsagePercent, 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 flex items-center gap-2">
                                <Activity className="h-3 w-3" />
                                Aggregated memory usage across all running microservices.
                            </p>
                        </div>

                        {/* Requests */}
                        <div className="space-y-4">
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Requests (Last Hour)</p>
                                    <h4 className="text-2xl font-bold text-gray-900 mt-1">{data.totalRequestsLastHour.toLocaleString()}</h4>
                                </div>
                                <div className="text-xs font-bold px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    Traffic
                                </div>
                            </div>
                            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 relative">
                                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%,transparent_100%)] bg-[length:1rem_1rem] opacity-30 animate-[spin_3s_linear_infinite]"></div>
                                <div className="h-full w-full bg-indigo-500 rounded-full opacity-80" />
                            </div>
                            <p className="text-xs text-gray-500 flex items-center gap-2">
                                <ExternalLink className="h-3 w-3" />
                                Total HTTP requests processed by the API gateway and services.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DashboardPage;
