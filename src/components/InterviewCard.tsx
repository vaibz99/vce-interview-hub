import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Share2, Building2, Briefcase, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

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
  "Core ECE": "bg-warning/15 text-warning border-warning/30",
  Management: "bg-success/15 text-success border-success/30",
};

export function InterviewCard({ interview }: { interview: Interview }) {
  const navigate = useNavigate();

  const shareToWhatsApp = () => {
    const url = `${window.location.origin}/interview/${interview.id}`;
    const text = `Check out this ${interview.company_name} (${interview.role}) interview dump on VCE ECE Placement Dump!\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <Card className="glass-card hover:border-primary/30 transition-all duration-300 group cursor-pointer" onClick={() => navigate(`/interview/${interview.id}`)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                {interview.company_name}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Briefcase className="h-3.5 w-3.5" />
              <span>{interview.role}</span>
            </div>
          </div>
          <Badge variant="outline" className={categoryColors[interview.category] || ""}>
            {interview.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {(() => {
          // Group questions by round
          const questionsByRound: Record<string, string[]> = {};
          
          (interview.questions as string[]).forEach((q) => {
            const roundMatch = q.match(/^Round\s+(\d+)\s*-\s*(.+)$/i);
            if (roundMatch) {
              const roundNum = `Round ${roundMatch[1]}`;
              const question = roundMatch[2];
              if (!questionsByRound[roundNum]) questionsByRound[roundNum] = [];
              questionsByRound[roundNum].push(question);
            } else {
              // If no round prefix, treat as ungrouped
              if (!questionsByRound["Questions"]) questionsByRound["Questions"] = [];
              questionsByRound["Questions"].push(q);
            }
          });
          
          return Object.entries(questionsByRound).map(([round, questions]) => (
            <div key={round} className="space-y-2">
              <h4 className="text-sm font-semibold text-primary">{round}</h4>
              <ul className="space-y-1 pl-2 border-l-2 border-primary/30">
                {questions.map((q, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-primary/60 font-mono text-xs mt-0.5">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          ));
        })()}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {format(new Date(interview.created_at), "MMM d, yyyy")}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); shareToWhatsApp(); }} 
            className="text-muted-foreground hover:text-primary"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
