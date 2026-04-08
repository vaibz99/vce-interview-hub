import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";

type ExtractionResult = {
  rejected: boolean;
  reason?: string;
  company_name?: string;
  role?: string;
  category?: "Software" | "Core ECE" | "Management";
  questions?: string[];
};

export function PostModal({ open, onOpenChange, onPosted }: { open: boolean; onOpenChange: (v: boolean) => void; onPosted: () => void }) {
  const [dump, setDump] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (dump.trim().length < 20) {
      toast.error("Please paste a more detailed interview dump");
      return;
    }

    setLoading(true);
    try {
      const { data: aiData, error: aiError } = await supabase.functions.invoke<ExtractionResult>("extract-interview", {
        body: { dump: dump.trim() },
      });

      if (aiError) {
        throw new Error(aiError.message || "AI extraction failed");
      }

      if (aiData?.rejected) {
        toast.error(aiData.reason || "Content was rejected as spam or irrelevant");
        setLoading(false);
        return;
      }

      if (!aiData.company_name || !aiData.role || !aiData.category || !Array.isArray(aiData.questions)) {
        throw new Error("AI response missing required interview fields");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: insertError } = await supabase.from("interviews").insert({
        user_id: user.id,
        company_name: aiData.company_name,
        role: aiData.role,
        category: aiData.category,
        questions: aiData.questions,
        raw_dump: dump.trim(),
      });

      if (insertError) throw insertError;

      toast.success("Interview dump posted successfully!");
      setDump("");
      onOpenChange(false);
      onPosted();
    } catch (err: any) {
      toast.error(err.message || "Failed to post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/50 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Post Interview Dump
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Paste your interview experience. AI will extract company, role, and questions automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Textarea
            placeholder={"e.g. I interviewed at Google for SDE-1 role.\n\nRound 1: Tell me about yourself, Why Google?\nRound 2: Reverse a linked list, System design for URL shortener..."}
            value={dump}
            onChange={(e) => setDump(e.target.value)}
            className="bg-secondary border-border min-h-[200px] text-sm"
          />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            Your identity stays anonymous on the public feed
          </div>
          <Button onClick={handleSubmit} disabled={loading || dump.trim().length < 20} className="w-full">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Extracting & Posting...</> : <><Sparkles className="h-4 w-4" /> Extract & Post</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
