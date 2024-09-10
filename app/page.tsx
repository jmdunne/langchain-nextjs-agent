"use client";

import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      setReport(data.report);
    } catch (error) {
      console.error("Error:", error);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="https://nextjs.org/icons/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <h1 className="text-2xl font-bold mb-4">Product Analysis Tool</h1>
        <form onSubmit={handleSubmit} className="w-full max-w-2xl">
          <input
            type="url"
            className="w-full p-2 border border-gray-300 rounded"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter product URL here..."
            required
          />
          <button
            type="submit"
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={isLoading}
          >
            {isLoading ? "Analyzing..." : "Analyze"}
          </button>
        </form>
        {report && (
          <div className="mt-8 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-2">Analysis Report:</h2>
            <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded">
              {report}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
