"use client";

import { Content, ContentLatest } from "@/types/contents";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import ContentCard from "./ContentCard";
import { Button } from "./ui/button";
import { motion } from "motion/react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export default function DashboardComponent() {
  const [showLatest, setShowLatest] = useState(false);
  const router = useRouter();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["contents"],
    enabled: !showLatest,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await fetch("/api/contents");

      if (!response.ok) {
        throw new Error(`Failed to fetch contents: ${response.status}`);
      }

      return response.json();
    },
  });

  const {
    data: latestData,
    isLoading: isLatestLoading,
    isError: isLatestError,
    error: latestError,
  } = useQuery({
    queryKey: ["contentsLatest"],
    enabled: showLatest,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await fetch("/api/contents/latest");

      if (!response.ok) {
        throw new Error(`Failed to fetch contents: ${response.status}`);
      }

      return response.json();
    },
  });

  console.log("data", data);
  console.log("latestData", latestData);

  const loading = showLatest ? isLatestLoading : isLoading;
  const isErrored = showLatest ? isLatestError : isError;
  const errorObj = showLatest ? latestError : error;
  const items = showLatest ? latestData?.contents : data?.contents;

  const handleLogout = () => {
    Cookies.remove("token");
    router.push("/login");
  };

  return (
    <div className="flex flex-col w-full p-4">
      <motion.div
        className="flex items-center justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold">Contents</span>
          <Button
            variant="outline"
            className="mt-1 cursor-pointer"
            onClick={() => setShowLatest(!showLatest)}
          >
            {showLatest ? "Show All" : "Show Latest"}
          </Button>
        </div>

        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </motion.div>

      <div className="mt-6">
        {loading && <p>Loading...</p>}
        {isErrored && (
          <p className="text-red-500">
            {errorObj instanceof Error
              ? errorObj.message
              : "Something went wrong."}
          </p>
        )}

        <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {!loading &&
            !isErrored &&
            items &&
            (items.length === 0 ? (
              <p>No contents available.</p>
            ) : (
              items.map((content: Content, index: number) => (
                <motion.div
                  key={content.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.03,
                    ease: "easeOut",
                  }}
                >
                  <ContentCard
                    content={content}
                    showLatest={showLatest}
                    contentLatest={latestData}
                  />
                </motion.div>
              ))
            ))}
        </div>
      </div>
    </div>
  );
}
