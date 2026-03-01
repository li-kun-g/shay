"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const COLLEGES: { label: string; value: string }[] = [
  { label: "All", value: "All" },
  { label: "Bang", value: "Bang College of Business" },
  { label: "Social Sci", value: "College of Social Sciences" },
  { label: "Human Sci & Edu", value: "College of Human Sciences and Education" },
  { label: "Law", value: "Law School" },
  { label: "CS & Math", value: "School of Computer Science and Mathematics" },
  { label: "Other", value: "Other" },
];

export default function CollegeFilter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const active = searchParams.get("college") ?? "All";

  function href(value: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (value === "All") sp.delete("college");
    else sp.set("college", value);
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
      {COLLEGES.map((c) => {
        const isActive =
          (c.value === "All" && !searchParams.get("college")) ||
          active === c.value;

        return (
          <Link
            key={c.value}
            href={href(c.value)}
            className={`shrink-0 rounded-full border px-3 py-1 text-sm transition ${
              isActive ? "bg-black text-white border-black" : "bg-white"
            }`}
          >
            {c.label}
          </Link>
        );
      })}
    </div>
  );
}
