import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

interface DashboardSummaryCardsProps {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
}

export function DashboardSummaryCards({
  totalBalance,
  totalIncome,
  totalExpense,
  netCashflow,
}: DashboardSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Total Saldo
            </p>
            <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Pemasukan Bulan Ini
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-500">
              +{formatCurrency(totalIncome)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Pengeluaran Bulan Ini
            </p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-500">
              -{formatCurrency(totalExpense)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Selisih Bulan Ini
            </p>
            <p
              className={`text-2xl font-bold ${
                netCashflow >= 0
                  ? "text-green-600 dark:text-green-500"
                  : "text-red-600 dark:text-red-500"
              }`}
            >
              {netCashflow >= 0 ? "+" : ""}
              {formatCurrency(netCashflow)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
