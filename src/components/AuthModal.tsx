import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, ArrowRight, Loader2, ShieldCheck } from "lucide-react";

export function AuthModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const isOtpLengthValid = (value: string) => value.length >= 6 && value.length <= 8;

  const handleSend = async () => {
    if (!email.endsWith("@vce.ac.in")) {
      toast.error("Only @vce.ac.in emails are allowed");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("Verification code sent to your inbox");
    }
  };

  const handleVerify = async () => {
    if (!/^\d{6,8}$/.test(otp)) {
      toast.error("Enter the verification code sent to your email");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Signed in successfully");
    setEmail("");
    setOtp("");
    setSent(false);
    onOpenChange(false);
  };

  const resetState = () => {
    setSent(false);
    setEmail("");
    setOtp("");
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetState(); }}>
      <DialogContent className="glass-card border-border/50 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground text-xl">Senior Verification</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter your VCE college email to receive a 6-digit verification code.
          </DialogDescription>
        </DialogHeader>
        {sent ? (
          <div className="py-8 text-center space-y-3">
            <ShieldCheck className="h-12 w-12 text-primary mx-auto" />
            <p className="text-foreground font-medium">Enter your OTP code</p>
            <p className="text-sm text-muted-foreground">We sent a 6-digit code to <strong>{email}</strong>.</p>
            <Input
              placeholder="Enter verification code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8);
                if (isOtpLengthValid(pasted) && !loading) {
                  e.preventDefault();
                  setOtp(pasted);
                  queueMicrotask(async () => {
                    setLoading(true);
                    const { error } = await supabase.auth.verifyOtp({
                      email,
                      token: pasted,
                      type: "email",
                    });
                    setLoading(false);

                    if (error) {
                      toast.error(error.message);
                      return;
                    }

                    toast.success("Signed in successfully");
                    setEmail("");
                    setOtp("");
                    setSent(false);
                    onOpenChange(false);
                  });
                }
              }}
              className="bg-secondary border-border text-center tracking-[0.35em]"
              inputMode="numeric"
              maxLength={8}
            />
            <Button onClick={handleVerify} disabled={loading || !isOtpLengthValid(otp)} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ArrowRight className="h-4 w-4" /> Verify Code</>}
            </Button>
            <Button
              variant="ghost"
              onClick={handleSend}
              disabled={loading}
              className="w-full"
            >
              Resend Code
            </Button>
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
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Mail className="h-4 w-4" /> Send 6-digit Code</>}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
