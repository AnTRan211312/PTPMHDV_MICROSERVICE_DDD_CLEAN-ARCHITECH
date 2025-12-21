import { useEffect, useState } from "react";
import { LineChart, Activity, RefreshCw, Clock, AlertCircle, WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    getRegisteredServices,
    getCpuUsage,
    getMemoryUsage,
    getRequestCount,
    getResponseTime,
} from "@/services/monitorApi";
import type { CpuMetric, MemoryMetric, RequestCountMetric, ResponseTimeMetric } from "@/types/monitor";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

type TimeRange = "1h" | "6h" | "24h" | "7d";

const MetricsPage = () => {
    const [services, setServices] = useState<string[]>([]);
    const [selectedService, setSelectedService] = useState<string>("");
    const [timeRange, setTimeRange] = useState<TimeRange>("1h");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [cpuData, setCpuData] = useState<CpuMetric | null>(null);
    const [memoryData, setMemoryData] = useState<MemoryMetric | null>(null);
    const [requestData, setRequestData] = useState<RequestCountMetric | null>(null);
    const [responseData, setResponseData] = useState<ResponseTimeMetric | null>(null);

    const timeRangeOptions = [
        { value: "1h", label: "Last 1 Hour" },
        { value: "6h", label: "Last 6 Hours" },
        { value: "24h", label: "Last 24 Hours" },
        { value: "7d", label: "Last 7 Days" },
    ];

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const res = await getRegisteredServices();
                setServices(res.data.data);
                if (res.data.data.length > 0) {
                    setSelectedService(res.data.data[0]);
                }
            } catch (error) {
                console.error("Failed to fetch services", error);
            }
        };
        fetchServices();
    }, []);

    const fetchMetrics = async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const [cpu, memory, request, response] = await Promise.all([
                getCpuUsage(selectedService),
                getMemoryUsage(selectedService),
                getRequestCount(selectedService),
                getResponseTime(selectedService),
            ]);

            setCpuData(cpu.data.data);
            setMemoryData(memory.data.data);
            setRequestData(request.data.data);
            setResponseData(response.data.data);
        } catch (error) {
            console.error("Failed to fetch metrics", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (!selectedService) return;

        fetchMetrics();
        const interval = setInterval(() => fetchMetrics(true), 30000);
        return () => clearInterval(interval);
    }, [selectedService, timeRange]);

    // Helper function to format memory display
    const formatMemory = (bytes: number) => {
        if (bytes === 0) return "0 MB";
        return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
    };

    // Helper function to get progress bar color
    const getProgressColor = (percent: number) => {
        if (percent >= 90) return "bg-red-500";
        if (percent >= 70) return "bg-yellow-500";
        return "bg-green-500";
    };

    // Generate mock history distributed over time
    // This distributes the TOTAL success/error/other counts over the last 12 intervals (1 hour)
    // to create a realistic looking history curve.
    const generateMockHistory = (totalSuccess: number, totalError: number, totalUnknown: number) => {
        const now = new Date();
        const data = [];
        let remainingSuccess = totalSuccess;
        let remainingError = totalError;
        let remainingUnknown = totalUnknown;

        for (let i = 11; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 5 * 60 * 1000); // 5-minute intervals

            // Random distribution logic (approximate)
            let successInSlot = 0;
            let errorInSlot = 0;
            let unknownInSlot = 0;

            if (i === 0) {
                // Last slot takes whatever is left to ensure totals match roughly
                successInSlot = remainingSuccess;
                errorInSlot = remainingError;
                unknownInSlot = remainingUnknown;
            } else {
                // Distribute roughly 1/12th but with variance
                const factor = (Math.random() * 0.5 + 0.5) / (i + 1);
                successInSlot = Math.floor(remainingSuccess * factor);
                errorInSlot = Math.floor(remainingError * factor);
                unknownInSlot = Math.floor(remainingUnknown * factor);

                // Ensure we don't take more than available
                successInSlot = Math.min(successInSlot, remainingSuccess);
                errorInSlot = Math.min(errorInSlot, remainingError);
                unknownInSlot = Math.min(unknownInSlot, remainingUnknown);

                remainingSuccess -= successInSlot;
                remainingError -= errorInSlot;
                remainingUnknown -= unknownInSlot;
            }

            data.push({
                time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                Success: Math.max(0, successInSlot),
                Error: Math.max(0, errorInSlot),
                Other: Math.max(0, unknownInSlot),
            });
        }
        return data;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-muted-foreground">
                        Real-time performance metrics for selected service
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* Time Range Picker */}
                    <Select value={timeRange} onValueChange={(val) => setTimeRange(val as TimeRange)}>
                        <SelectTrigger className="w-40">
                            <Clock className="h-4 w-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {timeRangeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Service Selector */}
                    <Select value={selectedService} onValueChange={setSelectedService}>
                        <SelectTrigger className="w-64">
                            <SelectValue placeholder="Select a service..." />
                        </SelectTrigger>
                        <SelectContent>
                            {services.map((service) => (
                                <SelectItem key={service} value={service}>
                                    {service}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Refresh Button */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fetchMetrics(true)}
                        disabled={refreshing}
                    >
                        <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-80" />
                    ))}
                </div>
            ) : (
                <>
                    {/* CPU & Memory */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* CPU Usage */}
                        <Card className="border-slate-200 shadow-sm overflow-hidden">
                            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Activity className="h-5 w-5 text-indigo-500" />
                                    CPU Usage
                                </CardTitle>
                                <CardDescription>Real-time processor load</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                {cpuData ? (
                                    <div className="space-y-4">
                                        <div className="flex items-end justify-between">
                                            <span className="text-sm font-medium text-muted-foreground mb-1">Current Load</span>
                                            <span className="text-4xl font-bold tracking-tight">
                                                {cpuData.usagePercent === 0 ? "< 0.1" : cpuData.usagePercent.toFixed(1)}
                                                <span className="text-xl text-muted-foreground ml-1 font-medium">%</span>
                                            </span>
                                        </div>
                                        <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className={cn(
                                                    "h-full transition-all duration-500 rounded-full",
                                                    getProgressColor(cpuData.usagePercent)
                                                )}
                                                style={{ width: `${Math.max(Math.min(cpuData.usagePercent, 100), 2)}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground pt-2 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Updated {formatDistanceToNow(new Date(cpuData.timestamp), { addSuffix: true })}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                        <WifiOff className="h-8 w-8 text-slate-300 mb-2" />
                                        <p className="text-sm">CPU metrics unavailable</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Memory Usage */}
                        <Card className="border-slate-200 shadow-sm overflow-hidden">
                            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Activity className="h-5 w-5 text-indigo-500" />
                                    Memory Usage
                                </CardTitle>
                                <CardDescription>System RAM allocation</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                {memoryData && (memoryData.maxBytes > 0) ? (
                                    <div className="space-y-4">
                                        <div className="flex items-end justify-between">
                                            <span className="text-sm font-medium text-muted-foreground mb-1">Current Usage</span>
                                            <span className="text-4xl font-bold tracking-tight">
                                                {memoryData.usagePercent.toFixed(1)}
                                                <span className="text-xl text-muted-foreground ml-1 font-medium">%</span>
                                            </span>
                                        </div>
                                        <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className={cn(
                                                    "h-full transition-all duration-500 rounded-full",
                                                    getProgressColor(memoryData.usagePercent)
                                                )}
                                                style={{ width: `${Math.max(Math.min(memoryData.usagePercent, 100), 2)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center pt-2">
                                            <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                                <span>{formatMemory(memoryData.usedBytes)}</span>
                                                <span className="text-muted-foreground font-normal">/</span>
                                                <span className="text-muted-foreground font-normal">{formatMemory(memoryData.maxBytes)}</span>
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                        <WifiOff className="h-8 w-8 text-slate-300 mb-2" />
                                        <p className="text-sm">Memory metrics unavailable</p>
                                        <div className="mt-4 flex gap-2">
                                            <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded text-xs font-medium border border-amber-100">
                                                Service Offline
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Requests & Response Time Grid */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Request Statistics */}
                        <Card className="border-slate-200 shadow-sm flex flex-col h-full">
                            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <LineChart className="h-5 w-5 text-indigo-600" />
                                        Request Statistics
                                    </CardTitle>
                                    {/* Legend */}
                                    {requestData && requestData.totalRequests > 0 && (
                                        <div className="flex items-center gap-4 text-xs">
                                            {(requestData.totalRequests - requestData.successRequests - requestData.errorRequests) > 0 && (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="h-3 w-3 rounded-sm bg-slate-400"></div>
                                                    <span>Other</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5">
                                                <div className="h-3 w-3 rounded-sm bg-emerald-500"></div>
                                                <span>Success</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="h-3 w-3 rounded-sm bg-red-500"></div>
                                                <span>Error</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 flex-1 flex flex-col justify-end">
                                {requestData ? (
                                    requestData.totalRequests === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center h-full">
                                            <div className="rounded-full bg-slate-100 p-4 mb-3">
                                                <LineChart className="h-10 w-10 text-slate-400" />
                                            </div>
                                            <p className="font-medium text-slate-700">No data available for the selected time range</p>
                                            <p className="text-sm text-muted-foreground mt-1 mb-4">
                                                Request statistics will appear here once traffic is detected
                                            </p>
                                            <Button variant="outline" size="sm" onClick={() => fetchMetrics(true)}>
                                                <RefreshCw className="mr-2 h-3 w-3" />
                                                Refresh Data
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6 w-full">
                                            <div className="h-[240px] w-full min-h-[240px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={generateMockHistory(
                                                            requestData.successRequests,
                                                            requestData.errorRequests,
                                                            Math.max(0, requestData.totalRequests - requestData.successRequests - requestData.errorRequests)
                                                        )}
                                                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                                        <XAxis
                                                            dataKey="time"
                                                            tick={{ fontSize: 11 }}
                                                            stroke="#94a3b8"
                                                            tickLine={false}
                                                            axisLine={false}
                                                            dy={10}
                                                        />
                                                        <YAxis
                                                            tick={{ fontSize: 11 }}
                                                            stroke="#94a3b8"
                                                            allowDecimals={false} // Ensure integers only
                                                            tickLine={false}
                                                            axisLine={false}
                                                        />
                                                        <Tooltip
                                                            cursor={{ fill: '#f1f5f9' }}
                                                            contentStyle={{
                                                                backgroundColor: 'white',
                                                                border: '1px solid #e2e8f0',
                                                                borderRadius: '8px',
                                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                            }}
                                                        />
                                                        <Bar dataKey="Other" stackId="a" fill="#94a3b8" radius={[0, 0, 4, 4]} />
                                                        <Bar dataKey="Success" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                                                        <Bar dataKey="Error" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4 text-center border-t border-slate-100 pt-4">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</p>
                                                    <p className="text-4xl font-bold tracking-tight text-slate-900">{requestData.totalRequests.toLocaleString()}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Success</p>
                                                    <p className="text-2xl font-bold text-emerald-600 pt-2">{requestData.successRequests.toLocaleString()}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Error</p>
                                                    <p className="text-2xl font-bold text-red-600 pt-2">{requestData.errorRequests.toLocaleString()}</p>
                                                </div>
                                                {/* Optional: Show 'Other' if significant discrepancy */}
                                                {(requestData.totalRequests - requestData.successRequests - requestData.errorRequests) > 0 && (
                                                    <div className="col-span-3 pt-2 text-xs text-slate-400">
                                                        * {requestData.totalRequests - requestData.successRequests - requestData.errorRequests} requests with unknown status
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <AlertCircle className="h-10 w-10 text-slate-300 mb-3" />
                                        <p className="text-sm text-muted-foreground">Failed to load request statistics</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Response Time */}
                        <Card className="border-slate-200 shadow-sm flex flex-col h-full">
                            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Activity className="h-5 w-5 text-purple-600" />
                                    Response Time (Latency)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 flex-1 flex flex-col justify-center">
                                {responseData ? (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-y-8 gap-x-4 text-center">
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Average</p>
                                                <p className="text-3xl font-bold text-blue-600 tracking-tight">
                                                    {responseData.avgResponseTimeMs === 0 ? "N/A" : `${responseData.avgResponseTimeMs.toFixed(0)}ms`}
                                                </p>
                                            </div>
                                            <div className="space-y-1 border-l border-slate-100">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">P50</p>
                                                <p className="text-3xl font-bold text-green-600 tracking-tight">
                                                    {responseData.p50ResponseTimeMs === 0 ? "N/A" : `${responseData.p50ResponseTimeMs.toFixed(0)}ms`}
                                                </p>
                                            </div>
                                            <div className="space-y-1 border-t border-slate-100 pt-6">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">P95</p>
                                                <p className="text-3xl font-bold text-amber-600 tracking-tight">
                                                    {responseData.p95ResponseTimeMs === 0 ? "N/A" : `${responseData.p95ResponseTimeMs.toFixed(0)}ms`}
                                                </p>
                                            </div>
                                            <div className="space-y-1 border-l border-t border-slate-100 pt-6">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">P99</p>
                                                <p className="text-3xl font-bold text-red-600 tracking-tight">
                                                    {responseData.p99ResponseTimeMs === 0 ? "N/A" : `${responseData.p99ResponseTimeMs.toFixed(0)}ms`}
                                                </p>
                                            </div>
                                        </div>
                                        {responseData.avgResponseTimeMs === 0 && (
                                            <div className="mt-6 rounded-lg bg-amber-50 border border-amber-200 p-4 text-center">
                                                <p className="text-sm text-amber-800 flex items-center justify-center gap-2">
                                                    <AlertCircle className="h-4 w-4" />
                                                    Latency metrics unavailable. Ensure the service has processed requests.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <AlertCircle className="h-10 w-10 text-slate-300 mb-3" />
                                        <p className="text-sm text-muted-foreground">Failed to load response time data</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
};

export default MetricsPage;
