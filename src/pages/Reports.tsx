import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

const Reports = () => {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <p className="page-description">Generate and export financial reports</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="font-heading font-semibold text-lg mb-2">Reports Coming Soon</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Detailed member-wise, monthly, and yearly financial reports with PDF and Excel export will be available here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
