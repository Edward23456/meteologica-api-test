"use client";

import { motion } from "framer-motion";
import { ContentDataRow } from "@/types/contents";
import { ForecastCard } from "./ForecastCard";

interface ForecastCardListProps {
  rows: ContentDataRow[];
}

export function ForecastCardList({ rows }: ForecastCardListProps) {
  return (
    <motion.div layout className="flex flex-col gap-4">
      {rows.map((row, i) => (
        <ForecastCard key={row["From yyyy-mm-dd hh:mm"]} row={row} index={i} />
      ))}
    </motion.div>
  );
}
