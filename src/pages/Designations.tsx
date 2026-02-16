import { Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const teamMembers = [
  { no: 1, name: "Tauqeer Aslam", designation: "President (Saddar)", role: "president" },
  { no: 2, name: "Muhammad Ghalib", designation: "Nazim (General Secretary)", role: "nazim" },
  { no: 3, name: "Abdul Shakoor", designation: "Nazim Markaz-e-Ilm (Knowledge Center)", role: "nazim" },
  { no: 4, name: "Muhammad Shoaib", designation: "Nazim Finance & Membership", role: "nazim" },
  { no: 5, name: "Muhammad Rizwan Ahmed", designation: "Nazim Dawat-o-Tarbiyat (Outreach & Training)", role: "nazim" },
  { no: 6, name: "Raheel-ur-Rehman", designation: "Nazim Halqa-e-Durood (Durood Circle)", role: "nazim" },
  { no: 7, name: "Jalal Aslam", designation: "Nazim Social Media", role: "nazim" },
  { no: 8, name: "Muhammad Mashkoor", designation: "Deputy Nazim Social Media", role: "nazim" },
];

const Designations = () => {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Award className="w-6 h-6 text-primary" />
          Team Designations
        </h1>
        <p className="page-description">Leadership team of TMQ UC Mianwala</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {teamMembers.map((member) => (
          <Card key={member.no} className="group hover:shadow-lg transition-all duration-200 border-border">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {member.no}
                </div>
                <Badge
                  variant={member.role === "president" ? "default" : "secondary"}
                  className={member.role === "president" ? "bg-accent text-accent-foreground" : ""}
                >
                  {member.role === "president" ? "President" : "Nazim"}
                </Badge>
              </div>
              <CardTitle className="text-base mt-3">{member.name}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">{member.designation}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Designations;
