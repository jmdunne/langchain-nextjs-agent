"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SideNav } from "@/app/components/sidenav";
import { AnalysisStages } from "@/app/components/analysisstages";

export default function Home() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [stageUpdates, setStageUpdates] = useState<{ [key: string]: string[] }>({});
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setReport("");
    setStageUpdates({});
    setError("");

    const eventSource = new EventSource(`/api/analyze?url=${encodeURIComponent(url)}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.stage === "complete") {
        setReport(data.message);
        setIsLoading(false);
        eventSource.close();
      } else if (data.stage === "error") {
        setError(data.message);
        setIsLoading(false);
        eventSource.close();
      } else {
        setStageUpdates((prev) => ({
          ...prev,
          [data.stage]: [...(prev[data.stage] || []), data.message],
        }));
      }
    };

    eventSource.onerror = () => {
      setError("An error occurred while connecting to the server");
      setIsLoading(false);
      eventSource.close();
    };
  };

  return (
    <div className="flex min-h-screen font-[family-name:var(--font-geist-sans)]">
      <SideNav
        url={url}
        setUrl={setUrl}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        stageUpdates={stageUpdates}
        analysisStarted={isLoading}
      />
      <main className="flex-1 p-8 overflow-y-auto">
        {error && (
          <div className="text-red-500 mb-4">
            {error}
          </div>
        )}

        <AnalysisStages stageUpdates={stageUpdates} />

        {report && (
          <Card className="w-full mt-8">
            <CardHeader>
              <CardTitle>Analysis Report</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[calc(100vh-150px)] overflow-y-auto">
              <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded text-sm">
                {report}
              </pre>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}