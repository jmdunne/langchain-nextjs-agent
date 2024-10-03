import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalysisStages } from "@/app/components/analysisstages";

interface SideNavProps {
  url: string;
  setUrl: (url: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  completedStages: string[];
  analysisStarted: boolean;  // Add this line
}

export function SideNav({
  url,
  setUrl,
  handleSubmit,
  isLoading,
  completedStages,
  analysisStarted,
}: SideNavProps) {
  return (
    <aside className="w-1/5 h-screen bg-gray-100 p-4 flex flex-col gap-4 h-100%">
      <h2 className="text-xl font-bold">Product Analysis</h2>
      <Card>
        <CardHeader>
          <CardTitle>Enter Product URL</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter product URL here..."
              required
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Analyzing..." : "Analyze"}
            </Button>
          </form>
        </CardContent>
      </Card>
      {analysisStarted && <AnalysisStages completedStages={completedStages} />}
    </aside>
  );
}
