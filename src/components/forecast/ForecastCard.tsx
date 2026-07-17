"use client";

import { motion } from "framer-motion";
import { ContentDataRow } from "@/types/contents";

interface ForecastCardProps {
  row: ContentDataRow;
  index: number;
}

function formatMW(value: string) {
  return Number(value).toLocaleString();
}

function formatTime(value: string) {
  return value.split(" ")[1] ?? value;
}

function formatDate(value: string) {
  const [date] = value.split(" ");
  const d = new Date(date);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function ForecastCard({ row, index }: ForecastCardProps) {
  const forecast = Number(row.forecast);
  const p10 = Number(row.perc10);
  const p90 = Number(row.perc90);
  const range = p90 - p10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: Math.min(index * 0.03, 0.6),
        ease: "easeOut",
      }}
      whileTap={{ scale: 0.98 }}
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">
            {formatDate(row["From yyyy-mm-dd hh:mm"])}
          </p>
          <p className="text-sm font-medium text-gray-700">
            {formatTime(row["From yyyy-mm-dd hh:mm"])} –{" "}
            {formatTime(row["To yyyy-mm-dd hh:mm"])}
          </p>
        </div>
        <motion.p
          key={row.forecast}
          initial={{ scale: 0.85 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="text-xl font-bold text-gray-900"
        >
          {formatMW(row.forecast)}
          <span className="ml-1 text-xs font-normal text-gray-400">MW</span>
        </motion.p>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-[11px] text-gray-400 mb-1">
          <span>P10: {formatMW(row.perc10)}</span>
          <span>P90: {formatMW(row.perc90)}</span>
        </div>
        <div className="relative h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{
              duration: 0.5,
              delay: Math.min(index * 0.03, 0.6) + 0.1,
            }}
            className="absolute inset-y-0 left-0 rounded-full bg-amber-200"
          />
          {range > 0 && (
            <div
              className="absolute inset-y-0 w-1 rounded-full bg-amber-500"
              style={{
                left: `${((forecast - p10) / range) * 100}%`,
              }}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
