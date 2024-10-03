import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularProgress } from "./circularprogress";

const stages = [
  {
    name: "Web Scraping",
    description: "Extracting content from the provided URL",
  },
  {
    name: "Document Ingestion",
    description: "Processing and splitting the scraped content",
  },
  {
    name: "Information Extraction",
    description: "Extracting key product information",
  },
  {
    name: "Competitive Research",
    description: "Researching competitor information",
  },
  {
    name: "Analysis Comparison",
    description: "Comparing product with competitors",
  },
  {
    name: "Report Generation",
    description: "Generating the final analysis report",
  },
];

export function AnalysisStages({ completedStages }: { completedStages: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      {stages.map((stage, index) => {
        const isCompleted = completedStages.includes(stage.name);
        const isActive = !isCompleted && completedStages.length === index;
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
                {stage.name}
              </CardTitle>
              <CircularProgress progress={progress} size={16} strokeWidth={2} color={progressColor} />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">{stage.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}