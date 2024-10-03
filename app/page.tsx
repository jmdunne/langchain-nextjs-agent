"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SideNav } from "@/app/components/sidenav";

export default function Home() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [completedStages, setCompletedStages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [analysisStarted, setAnalysisStarted] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setReport("");
    setCompletedStages([]);
    setError("");
    setAnalysisStarted(true);  // Add this line

    const eventSource = new EventSource(`/api/analyze?url=${encodeURIComponent(url)}`);

    eventSource.addEventListener('stage', (event) => {
      const data = JSON.parse(event.data);
      setCompletedStages((prevStages) => [...prevStages, data.stage]);
    });

    eventSource.addEventListener('complete', (event) => {
      const data = JSON.parse(event.data);
      setReport(data.report);
      setIsLoading(false);
      eventSource.close();
    });

    eventSource.addEventListener('error', (event) => {
      if (event instanceof ErrorEvent) {
        setError(event.message || "An error occurred");
      } else {
        setError("An unknown error occurred");
      }
      setIsLoading(false);
    });
  };

  return (
    <div className="flex min-h-screen font-[family-name:var(--font-geist-sans)]">
      <SideNav
        url={url}
        setUrl={setUrl}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        completedStages={completedStages}
        analysisStarted={analysisStarted}  // Add this line
      />
      <main className="flex-1 p-8 overflow-y-auto">
        {error && (
          <div className="text-red-500 mb-4">
            {error}
          </div>
        )}

        {report && (
          <Card className="w-full">
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