import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularProgress } from "./circularprogress";

const stages = [
  "Web Scraping",
  "Document Ingestion",
  "Information Extraction",
  "Competitive Research",
  "Analysis Comparison",
  "Report Generation",
];

export function AnalysisStages({ stageUpdates }: { stageUpdates: { [key: string]: string[] } }) {
  return (
    <div className="flex flex-col gap-2">
      {stages.map((stage, index) => {
        const updates = stageUpdates[stage] || [];
        const isCompleted = updates.length > 0 && !updates[updates.length - 1].startsWith("Error");
        const isActive = updates.length > 0 && !isCompleted;
        const progress = isCompleted ? 100 : (isActive ? 50 : 0);

        let borderColor = "border-gray-300";
        let bgColor = "bg-gray-50";
        let progressColor = "text-gray-300";

        if (isActive) {
          borderColor = "border-blue-500";
          bgColor = "bg-blue-50";
          progressColor = "text-blue-500";
        } else if (isCompleted) {
          borderColor = "border-green-500";
          bgColor = "bg-green-50";
          progressColor = "text-green-500";
        }

        return (
          <Card
            key={index}
            className={`${borderColor} ${bgColor}`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stage}
              </CardTitle>
              <CircularProgress progress={progress} size={16} strokeWidth={2} color={progressColor} />
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-gray-500">
                {updates.map((update, i) => (
                  <li key={i}>{update}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}