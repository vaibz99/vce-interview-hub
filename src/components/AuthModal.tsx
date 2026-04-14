import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Phone, ArrowRight, Loader2, ShieldCheck } from "lucide-react";

const SMS_RATE_LIMIT_MS = 120000; // 30 per hour = 2 requests per minute = 120 seconds between requests

export function AuthModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  // Email OTP state
  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  
  // SMS OTP state
  const [phone, setPhone] = useState("");
  const [smsOtp, setSmsOtp] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [lastSmsRequestTime, setLastSmsRequestTime] = useState(0);
  
  // Shared state
  const [loading, setLoading] = useState(false);
  const [authType, setAuthType] = useState<"email" | "sms">("email");

  const isOtpLengthValid = (value: string) => value.length >= 6 && value.length <= 8;

  // ===== EMAIL OTP =====
  const handleEmailSend = async () => {
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
      setEmailSent(true);
      toast.success("Verification code sent to your inbox");
    }
  };

  const handleEmailVerify = async () => {
    if (!/^\d{6,8}$/.test(emailOtp)) {
      toast.error("Enter the verification code sent to your email");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: emailOtp,
      type: "email",
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Signed in successfully");
    resetState();
    onOpenChange(false);
  };

  // ===== SMS OTP =====
  const handleSmsSend = async () => {
    // Rate limiting check: 30 requests per hour = 1 request per 2 minutes
    const now = Date.now();
    if (now - lastSmsRequestTime < SMS_RATE_LIMIT_MS) {
      const waitSeconds = Math.ceil((SMS_RATE_LIMIT_MS - (now - lastSmsRequestTime)) / 1000);
      toast.error(`Please wait ${waitSeconds}s before sending another SMS`);
      return;
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
      toast.error("Enter a valid phone number");
      return;
    }

    setLoading(true);
    setLastSmsRequestTime(now);
    
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    
    if (error) {
      toast.error(error.message);
      setLastSmsRequestTime(0); // Reset on error
    } else {
      setSmsSent(true);
      toast.success("Verification code sent via SMS");
    }
  };

  const handleSmsVerify = async () => {
    if (!/^\d{6}$/.test(smsOtp)) {
      toast.error("Enter the 6-digit code sent via SMS");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: smsOtp,
      type: "sms",
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Signed in successfully");
    resetState();
    onOpenChange(false);
  };

  const resetState = () => {
    setEmailSent(false);
    setSmsSent(false);
    setEmail("");
    setEmailOtp("");
    setPhone("");
    setSmsOtp("");
    setLoading(false);
    setLastSmsRequestTime(0);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetState(); }}>
      <DialogContent className="glass-card border-border/50 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground text-xl">Senior Verification</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose email or SMS to receive a verification code.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={authType} onValueChange={(v) => { resetState(); setAuthType(v as "email" | "sms"); }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="sms" className="gap-2">
              <Phone className="h-4 w-4" />
              SMS
            </TabsTrigger>
          </TabsList>

          {/* ===== EMAIL TAB ===== */}
          <TabsContent value="email" className="space-y-4">
            {emailSent ? (
              <div className="py-8 text-center space-y-3">
                <ShieldCheck className="h-12 w-12 text-primary mx-auto" />
                <p className="text-foreground font-medium">Enter your OTP code</p>
                <p className="text-sm text-muted-foreground">We sent a 6-digit code to <strong>{email}</strong>.</p>
                <Input
                  placeholder="Enter verification code"
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8);
                    if (isOtpLengthValid(pasted) && !loading) {
                      e.preventDefault();
                      setEmailOtp(pasted);
                      queueMicrotask(handleEmailVerify);
                    }
                  }}
                  className="bg-secondary border-border text-center tracking-[0.35em]"
                  inputMode="numeric"
                  maxLength={8}
                />
                <Button onClick={handleEmailVerify} disabled={loading || !isOtpLengthValid(emailOtp)} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ArrowRight className="h-4 w-4" /> Verify Code</>}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleEmailSend}
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
                <Button onClick={handleEmailSend} disabled={loading || !email} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Mail className="h-4 w-4" /> Send 6-digit Code</>}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ===== SMS TAB ===== */}
          <TabsContent value="sms" className="space-y-4">
            {smsSent ? (
              <div className="py-8 text-center space-y-3">
                <ShieldCheck className="h-12 w-12 text-primary mx-auto" />
                <p className="text-foreground font-medium">Enter your SMS code</p>
                <p className="text-sm text-muted-foreground">We sent a 6-digit code to <strong>{phone}</strong>.</p>
                <Input
                  placeholder="Enter verification code"
                  value={smsOtp}
                  onChange={(e) => setSmsOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                    if (pasted.length === 6 && !loading) {
                      e.preventDefault();
                      setSmsOtp(pasted);
                      queueMicrotask(handleSmsVerify);
                    }
                  }}
                  className="bg-secondary border-border text-center tracking-[0.35em]"
                  inputMode="numeric"
                  maxLength={6}
                />
                <Button onClick={handleSmsVerify} disabled={loading || smsOtp.length !== 6} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ArrowRight className="h-4 w-4" /> Verify Code</>}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleSmsSend}
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
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-secondary border-border"
                    type="tel"
                  />
                  <p className="text-xs text-muted-foreground">Include country code (e.g., +91 for India)</p>
                </div>
                <Button onClick={handleSmsSend} disabled={loading || !phone} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Phone className="h-4 w-4" /> Send 6-digit Code</>}
                </Button>
                <p className="text-xs text-muted-foreground text-center">Rate limit: 30 requests per hour</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
