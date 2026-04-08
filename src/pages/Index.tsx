import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { InterviewCard } from "@/components/InterviewCard";
import { SearchBar } from "@/components/SearchBar";
import { AuthModal } from "@/components/AuthModal";
import { PostModal } from "@/components/PostModal";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

interface Interview {
  id: string;
  company_name: string;
  role: string;
  category: string;
  questions: string[];
  created_at: string;
}

export default function Index() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchInterviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("interviews")
      .select("id, company_name, role, category, questions, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load interviews");
    else setInterviews((data as Interview[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchInterviews(); }, []);

  const filtered = useMemo(() => {
    let list = interviews;
    if (category !== "All") list = list.filter((i) => i.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.company_name.toLowerCase().includes(q) ||
          i.role.toLowerCase().includes(q) ||
          (i.questions as string[]).some((qu) => qu.toLowerCase().includes(q))
      );
    }
    return list;
  }, [interviews, search, category]);

  const handlePostClick = () => {
    if (user) setPostOpen(true);
    else setAuthOpen(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center glow-primary">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground leading-tight">VCE ECE Placements</h1>
              <p className="text-xs text-muted-foreground">Interview dump archive</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            )}
            <Button onClick={handlePostClick} size="sm">
              <Plus className="h-4 w-4" /> Post
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8 space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Interview Dumps</h2>
          <p className="text-muted-foreground text-sm">Browse real interview experiences shared by VCE ECE seniors</p>
        </div>

        <div className="mb-8">
          <SearchBar search={search} onSearch={setSearch} category={category} onCategory={setCategory} />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <p className="text-muted-foreground">No interview dumps found</p>
            <Button variant="outline" onClick={handlePostClick} className="border-border text-muted-foreground">
              <Plus className="h-4 w-4" /> Be the first to post
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((interview) => (
              <InterviewCard key={interview.id} interview={interview} />
            ))}
          </div>
        )}
      </main>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      {user && <PostModal open={postOpen} onOpenChange={setPostOpen} onPosted={fetchInterviews} />}
    </div>
  );
}
