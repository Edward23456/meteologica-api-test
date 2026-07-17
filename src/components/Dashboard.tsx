"use client";

import { Content } from "@/types/contents";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import ContentCard from "./contents/ContentCard";
import { Button } from "./ui/button";
import { motion } from "motion/react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import ContentTable from "./contents/ContentTabel";

export default function DashboardComponent() {
  const [showLatest, setShowLatest] = useState(false);
  const router = useRouter();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch: refetchContents,
  } = useQuery({
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
    refetch: refetchLatest,
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

  const loading = showLatest ? isLatestLoading : isLoading;
  const isErrored = showLatest ? isLatestError : isError;
  const errorObj = showLatest ? latestError : error;
  const items = showLatest ? latestData?.contents : data?.contents;

  const handleToggle = () => {
    const next = !showLatest;
    setShowLatest(next);

    if (next) {
      refetchLatest();
    } else {
      refetchContents();
    }
  };

  const handleLogout = () => {
    Cookies.remove("token");
    router.push("/login");
  };

  return (
    <div className="flex flex-col w-full p-4">
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold">Contents</span>
        </div>

        <Button
          variant="outline"
          className="cursor-pointer font-semibold"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </motion.div>

      <div className="mt-4">
        {isErrored && (
          <p className="text-red-500">
            {errorObj instanceof Error
              ? errorObj.message
              : "Something went wrong."}
          </p>
        )}

        {!loading && !isErrored && items && items.length === 0 && (
          <p>No contents available.</p>
        )}

        {!loading && !isErrored && items && items.length > 0 && (
          <>
            <div className="grid w-full grid-cols-1 gap-4 md:hidden">
              {items.map((content: Content, index: number) => (
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
              ))}
            </div>

            <motion.div
              className="hidden md:block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <ContentTable
                items={items}
                showLatest={showLatest}
                contentLatest={latestData}
              />
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
