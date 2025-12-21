
import { useEffect, useState } from "react";
import {
    Activity,
    RefreshCw,
    Server,
    ShoppingCart,
    Package,
    CreditCard,
    ShieldCheck,
    Users,
    Bell,
    Store,
    Warehouse,
    HardDrive
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getAllServicesHealth } from "@/services/monitorApi";
import type { ServiceHealth } from "@/types/monitor";
import { Skeleton } from "@/components/ui/skeleton";

const HealthPage = () => {
    const [services, setServices] = useState<ServiceHealth[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const servicePortMap: Record<string, number> = {
        "api-gateway": 8080,
        "auth-service": 8081,
        "product-service": 8082,
        "cart-service": 8083,
        "order-service": 8084,
        "inventory-service": 8085,
        "notification-service": 8086,
        "payment-service": 8087,
        "monitor-service": 8088,
    };

    const fetchHealth = async (pageNum: number = 0) => {
        setLoading(true);
        try {
            const res = await getAllServicesHealth(pageNum, 10);
            setServices(res.data.data.content);
            setTotalPages(res.data.data.totalPages);
            setPage(pageNum);
        } catch (error) {
            console.error("Failed to fetch health", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(() => fetchHealth(page), 30000);
        return () => clearInterval(interval);
    }, []);

    const filteredServices = services.filter((service) => {
        if (filter === "all") return true;
        return service.status === filter.toUpperCase();
    });

    const getServiceIcon = (name: string) => {
        if (name.includes("cart")) return ShoppingCart;
        if (name.includes("order")) return Package;
        if (name.includes("payment")) return CreditCard;
        if (name.includes("auth")) return ShieldCheck;
        if (name.includes("user")) return Users;
        if (name.includes("notification")) return Bell;
        if (name.includes("product")) return Store;
        if (name.includes("inventory")) return Warehouse;
        if (name.includes("monitor")) return Activity;
        if (name.includes("gateway")) return Server;
        return HardDrive;
    };

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffSeconds < 60) return "Just now";
        if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} mins ago`;
        return date.toLocaleTimeString();
    };

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (days > 0) return `${days}d ${hours} h`;
        if (hours > 0) return `${hours}h ${mins} m`;
        return `${mins} m`;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    {/* Removed redundant header title */}
                </div>
                <div className="flex gap-2">
                    <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="w-36">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="up">UP</SelectItem>
                            <SelectItem value="down">DOWN</SelectItem>
                            <SelectItem value="unknown">UNKNOWN</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => fetchHealth(page)}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                    <CardTitle className="flex items-center gap-2">
                        <Server className="h-5 w-5 text-blue-600" />
                        Registered Services ({filteredServices.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="space-y-2 p-6">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-12" />
                            ))}
                        </div>
                    ) : filteredServices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <Server className="h-12 w-12 text-slate-200 mb-2" />
                            <p>No services found matching your criteria</p>
                        </div>
                    ) : (
                        <div className="rounded-md">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="pl-6">Service Name</TableHead>
                                        <TableHead>Port</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Uptime</TableHead>
                                        <TableHead>Last Checked</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredServices.map((service) => {
                                        const ServiceIcon = getServiceIcon(service.serviceName);
                                        const port = servicePortMap[service.serviceName];

                                        return (
                                            <TableRow key={service.instanceId} className="hover:bg-slate-50/50">
                                                <TableCell className="pl-6 font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                                            <ServiceIcon className="h-5 w-5" />
                                                        </div>
                                                        <span className="text-sm font-semibold text-slate-700">{service.serviceName}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {port ? (
                                                        <code className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-mono text-slate-600">
                                                            {port}
                                                        </code>
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={
                                                            service.status === "UP"
                                                                ? "bg-emerald-500 hover:bg-emerald-600 text-white border-0"
                                                                : service.status === "DOWN"
                                                                    ? "bg-red-500 hover:bg-red-600 text-white border-0"
                                                                    : "bg-slate-500 hover:bg-slate-600 text-white"
                                                        }
                                                    >
                                                        {service.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-slate-500 text-sm">
                                                    {service.uptimeSeconds < 60 ? (
                                                        <span className="text-emerald-600 font-medium text-xs">Just started</span>
                                                    ) : (
                                                        formatUptime(service.uptimeSeconds)
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-500">
                                                    {formatRelativeTime(service.lastChecked)}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-4 flex justify-center gap-2 pb-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page === 0}
                                        onClick={() => fetchHealth(page - 1)}
                                    >
                                        Previous
                                    </Button>
                                    <span className="flex items-center px-4 text-sm font-medium">
                                        Page {page + 1} / {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page === totalPages - 1}
                                        onClick={() => fetchHealth(page + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default HealthPage;
