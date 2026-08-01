import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Shield, Loader2 } from "lucide-react";

// The `supabase.auth.oauth` namespace is beta; declare the shape we use.
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
};
const oauthApi = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

const OAuthConsent = () => {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error: detailsError } = await oauthApi().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (detailsError) {
        setError(detailsError.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  const decide = async (approve: boolean) => {
    setBusy(true);
    const { data, error: decideError } = approve
      ? await oauthApi().approveAuthorization(authorizationId)
      : await oauthApi().denyAuthorization(authorizationId);
    if (decideError) {
      setBusy(false);
      setError(decideError.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  };

  const clientName = details?.client?.name ?? "this app";

  return (
    <main className="min-h-screen flex items-center justify-center bg-primary p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent mb-4">
            <Shield className="w-8 h-8 text-accent-foreground" />
          </div>
          <h1 className="text-xl font-heading font-bold text-primary-foreground">
            TMQ Mianwala Management
          </h1>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="pb-2 pt-6 px-6">
            <h2 className="text-lg font-heading font-semibold text-center">
              {error ? "Authorization problem" : details ? `Connect ${clientName}` : "Loading…"}
            </h2>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-4">
            {error && (
              <p className="text-sm text-destructive text-center">
                Could not complete this authorization request: {error}
              </p>
            )}

            {!error && !details && (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!error && details && (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  {clientName} is requesting access to read and manage members, payments, fund
                  donations and activities in this app, acting as you.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>
                    Deny
                  </Button>
                  <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
                    {busy ? "Please wait…" : "Approve"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default OAuthConsent;
