import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, Building2, Briefcase, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Interview {
  id: string;
  company_name: string;
  role: string;
  category: string;
  questions: string[];
  created_at: string;
}

const categoryColors: Record<string, string> = {
  Software: "bg-primary/15 text-accent-foreground border-primary/30",
  "Core ECE": "bg-[hsl(38,92%,50%)]/15 text-[hsl(38,92%,50%)] border-[hsl(38,92%,50%)]/30",
  Management: "bg-[hsl(142,70%,45%)]/15 text-[hsl(142,70%,45%)] border-[hsl(142,70%,45%)]/30",
};

export default function InterviewDetail() {
  const { id } = useParams();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("interviews")
      .select("id, company_name, role, category, questions, created_at")
      .eq("id", id!)
      .single()
      .then(({ data }) => {
        setInterview(data as Interview | null);
        setLoading(false);
      });
  }, [id]);

  const shareToWhatsApp = () => {
    if (!interview) return;
    const text = `Check out this ${interview.company_name} (${interview.role}) interview dump!\n${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!interview) return <div className="min-h-screen flex flex-col items-center justify-center gap-4"><p className="text-muted-foreground">Interview not found</p><Link to="/"><Button variant="outline">Go Home</Button></Link></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/">
          <Button variant="ghost" size="sm" className="text-muted-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">{interview.company_name}</h1>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span>{interview.role}</span>
              </div>
            </div>
            <Badge variant="outline" className={categoryColors[interview.category] || ""}>{interview.category}</Badge>
          </div>
          <div className="space-y-3">
            <h2 className="font-semibold text-foreground">Questions</h2>
            <ol className="space-y-2">
              {(interview.questions as string[]).map((q, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-3">
                  <span className="text-primary font-mono text-xs mt-0.5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <span>{q}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(interview.created_at), "MMM d, yyyy")}
            </div>
            <Button variant="outline" size="sm" onClick={shareToWhatsApp} className="border-border text-muted-foreground hover:text-primary">
              <Share2 className="h-4 w-4" /> Share on WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
