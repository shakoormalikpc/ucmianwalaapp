import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Send, Trash2 } from "lucide-react";
import { format } from "date-fns";

const Activities = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const { user, role } = useAuth();
  const { toast } = useToast();
  const isPresident = role === "president";

  const fetchActivities = async () => {
    const { data } = await supabase
      .from("activities")
      .select("*")
      .order("created_at", { ascending: false });
    setActivities(data || []);
  };

  useEffect(() => { fetchActivities(); }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    const { error } = await supabase.from("activities").insert({
      message: message.trim(),
      created_by: user?.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Activity posted" });
      setMessage("");
      fetchActivities();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("activities").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Activity deleted" });
      fetchActivities();
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Activities</h1>
        <p className="page-description">Updates and announcements from the president</p>
      </div>

      {isPresident && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handlePost} className="space-y-3">
              <Textarea
                placeholder="Write an activity update or announcement..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                required
              />
              <Button type="submit" className="w-full sm:w-auto">
                <Send className="w-4 h-4 mr-2" />
                Post Activity
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {activities.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No activities posted yet
            </CardContent>
          </Card>
        ) : (
          activities.map((a) => (
            <Card key={a.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{a.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(a.created_at), "dd MMM yyyy, hh:mm a")}
                    </p>
                  </div>
                  {isPresident && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Activity</AlertDialogTitle>
                          <AlertDialogDescription>Are you sure you want to delete this activity? This cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(a.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Activities;
