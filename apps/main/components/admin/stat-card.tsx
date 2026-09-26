import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: number;
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("min-w-0 overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4 sm:p-6 sm:pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground ml-1" />}
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="text-lg sm:text-2xl font-bold truncate">{value}</div>
        {(description || trend !== undefined) && (
          <p className="mt-1 text-xs text-muted-foreground truncate">
            {trend !== undefined && (
              <span
                className={cn(
                  "mr-1 font-medium",
                  trend >= 0 ? "text-green-600" : "text-red-600",
                )}
              >
                {trend >= 0 ? "+" : ""}
                {trend}%
              </span>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
