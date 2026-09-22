import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { Transaction, Category, Wallet } from "@prisma/client";

interface TransactionWithRelations extends Transaction {
  category: Category;
  wallet: Wallet;
}

interface TransactionTableProps {
  transactions: TransactionWithRelations[];
  userId?: string;
}

export function TransactionTable({ transactions, userId }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-muted-foreground">
        Belum ada transaksi
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tanggal</TableHead>
          <TableHead>Tipe</TableHead>
          <TableHead>Kategori</TableHead>
          <TableHead>Dompet</TableHead>
          <TableHead className="text-right">Jumlah</TableHead>
          <TableHead>Catatan</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell>{formatDate(transaction.date)}</TableCell>
            <TableCell>
              <Badge
                variant={
                  transaction.type === "INCOME" ? "default" : "destructive"
                }
              >
                {transaction.type === "INCOME" ? "Pemasukan" : "Pengeluaran"}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: transaction.category.color }}
                />
                {transaction.category.name}
              </div>
            </TableCell>
            <TableCell>{transaction.wallet.name}</TableCell>
            <TableCell
              className={`text-right font-medium ${
                transaction.type === "INCOME"
                  ? "text-green-600 dark:text-green-500"
                  : "text-red-600 dark:text-red-500"
              }`}
            >
              {transaction.type === "INCOME" ? "+" : "-"}
              {formatCurrency(transaction.amount.toNumber())}
            </TableCell>
            <TableCell className="max-w-[200px] truncate">
              {transaction.note || "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
