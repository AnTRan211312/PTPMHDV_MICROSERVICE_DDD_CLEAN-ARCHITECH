import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    variant?: "default" | "success" | "warning" | "danger";
}

const SummaryCard = ({ title, value, icon: Icon, description, variant = "default" }: SummaryCardProps) => {
    const variantStyles = {
        default: "border-l-4 border-blue-500 bg-gradient-to-br from-white to-blue-50/20 hover:shadow-lg transition-all duration-300",
        success: "border-l-4 border-emerald-500 bg-gradient-to-br from-white to-emerald-50/20 hover:shadow-lg transition-all duration-300",
        warning: "border-l-4 border-amber-500 bg-gradient-to-br from-white to-amber-50/20 hover:shadow-lg transition-all duration-300",
        danger: "border-l-4 border-rose-500 bg-gradient-to-br from-white to-rose-50/20 hover:shadow-lg transition-all duration-300",
    };

    const iconStyles = {
        default: "bg-blue-100 text-blue-600",
        success: "bg-emerald-100 text-emerald-600",
        warning: "bg-amber-100 text-amber-600",
        danger: "bg-rose-100 text-rose-600",
    };

    return (
        <Card className={cn("overflow-hidden border-none shadow-sm", variantStyles[variant])}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold tracking-tight">{value}</span>
                            {description && <span className="text-xs text-muted-foreground">{description}</span>}
                        </div>
                    </div>
                    <div className={cn("rounded-xl p-3 shadow-inner", iconStyles[variant])}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default SummaryCard;
