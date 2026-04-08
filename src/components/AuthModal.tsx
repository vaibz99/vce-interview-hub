import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, ArrowRight, Loader2 } from "lucide-react";

export function AuthModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.endsWith("@vce.ac.in")) {
      toast.error("Only @vce.ac.in emails are allowed");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("Check your inbox for the magic link!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setSent(false); setEmail(""); } }}>
      <DialogContent className="glass-card border-border/50 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground text-xl">Senior Verification</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter your VCE college email to verify and post interview dumps.
          </DialogDescription>
        </DialogHeader>
        {sent ? (
          <div className="py-8 text-center space-y-3">
            <Mail className="h-12 w-12 text-primary mx-auto" />
            <p className="text-foreground font-medium">Magic link sent!</p>
            <p className="text-sm text-muted-foreground">Check your <strong>{email}</strong> inbox and click the link to sign in.</p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Input
                placeholder="yourname@vce.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-secondary border-border"
                type="email"
              />
              <p className="text-xs text-muted-foreground">Only @vce.ac.in emails are accepted</p>
            </div>
            <Button onClick={handleSend} disabled={loading || !email} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ArrowRight className="h-4 w-4" /> Send Magic Link</>}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
