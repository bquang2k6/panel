import { Filter, Search } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockReports } from "@/lib/mock/admin-data";
import { formatDate } from "@/lib/format";

// import { getReports } from "@/lib/queries";

export default function ReportsPage() {
  // TODO: Bỏ comment khi kết nối database
  // const reports = await getReports();
  const reports = mockReports;

  const openCount = reports.filter((r) => r.status === "open").length;
  const resolvedCount = reports.filter((r) => r.status === "resolved").length;
  const dismissedCount = reports.filter((r) => r.status === "dismissed").length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Reports"
        description="Review and manage user violation reports."
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Open" value={openCount} />
        <StatCard title="Resolved" value={resolvedCount} />
        <StatCard title="Dismissed" value={dismissedCount} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search reports..." className="pl-10" />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Reporter</TableHead>
              <TableHead>Reported User</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground"
                >
                  No reports found.
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{report.reporter_name}</TableCell>
                  <TableCell className="font-medium">
                    {report.reported_user}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {report.reason}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={report.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(report.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                      {report.status === "open" && (
                        <>
                          <Button variant="ghost" size="sm">
                            Resolve
                          </Button>
                          <Button variant="ghost" size="sm">
                            Dismiss
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
