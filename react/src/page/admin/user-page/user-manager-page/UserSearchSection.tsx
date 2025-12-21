import { RotateCcw, Search } from "lucide-react";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";

interface UserSearchSectionProps {
    searchUserName: string;
    setSearchUserName: (value: string) => void;
    searchEmail: string;
    setSearchEmail: (value: string) => void;
    onReset: () => void;
}

export function UserSearchSection({
    searchUserName,
    setSearchUserName,
    searchEmail,
    setSearchEmail,
    onReset,
}: UserSearchSectionProps) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        id="search-user-name"
                        placeholder="Tìm theo tên đăng nhập..."
                        className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                        value={searchUserName}
                        onChange={(e) => setSearchUserName(e.target.value)}
                    />
                </div>
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        id="search-email"
                        placeholder="Tìm theo email hoặc số điện thoại..."
                        className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                    />
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={onReset}
                    className="shrink-0 border-slate-200 text-slate-500 hover:text-slate-900"
                    title="Đặt lại bộ lọc"
                >
                    <RotateCcw className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
