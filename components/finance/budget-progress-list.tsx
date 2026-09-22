import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";

interface BudgetProgress {
  id: string;
  categoryName: string;
  budgetAmount: number;
  spent: number;
  percentage: number;
  status: "safe" | "warning" | "over";
}

interface BudgetProgressListProps {
  budgets: BudgetProgress[];
}

export function BudgetProgressList({ budgets }: BudgetProgressListProps) {
  // Get top 3 budgets by percentage
  const topBudgets = budgets.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Budget</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topBudgets.map((budget) => (
            <div key={budget.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{budget.categoryName}</span>
                  <Badge
                    variant={
                      budget.status === "over"
                        ? "destructive"
                        : budget.status === "warning"
                          ? "default"
                          : "secondary"
                    }
                  >
                    {budget.status === "over"
                      ? "Over Budget"
                      : budget.status === "warning"
                        ? "Hampir Habis"
                        : "Aman"}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(budget.spent)} /{" "}
                  {formatCurrency(budget.budgetAmount)}
                </span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    budget.status === "over"
                      ? "bg-red-500"
                      : budget.status === "warning"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {budget.percentage}% terpakai
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
