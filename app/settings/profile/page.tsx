"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AvatarUploader from "@/components/AvatarUploader";
import { updateProfile } from "@/app/actions/updateProfile";
import { setCampusPrefs } from "@/app/actions/setCampusPrefs";
import { useI18n } from "@/components/LanguageProvider";

const COLLEGES = [
  "Bang College of Business",
  "College of Social Sciences",
  "School of Law",
  "School of Humanities and Education",
  "School of Mathematics and Computer Science",
  "Other",
] as const;

type College = (typeof COLLEGES)[number];

type CampusVisibility = "ONLY_ME" | "FRIENDS" | "EVERYONE";
type CampusDuration = "2h" | "4h" | "eod";

function isCampusVisibility(v: any): v is CampusVisibility {
  return v === "ONLY_ME" || v === "FRIENDS" || v === "EVERYONE";
}
function isCampusDuration(v: any): v is CampusDuration {
  return v === "2h" || v === "4h" || v === "eod";
}

export default function ProfileSettingsPage() {
  const { t } = useI18n();

  const { data: session, status } = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [image, setImage] = useState<string>("");
  const [statusText, setStatusText] = useState<string>("");
  const [major, setMajor] = useState<string>("");
  const [yearOfStudy, setYearOfStudy] = useState<string>("");
  const [emoji, setEmoji] = useState<string>("☕");
  const [college, setCollege] = useState<College>("Bang College of Business");

  const [campusVisibility, setCampusVisibility] =
    useState<CampusVisibility>("EVERYONE");
  const [campusDuration, setCampusDuration] = useState<CampusDuration>("2h");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/signin");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    const u: any = session.user;

    setImage(u.image ?? "");
    setStatusText(u.status ?? "");
    setMajor(u.major ?? "");
    setYearOfStudy(
      u.yearOfStudy === null || u.yearOfStudy === undefined
        ? ""
        : String(u.yearOfStudy)
    );
    setEmoji(u.emoji ?? "☕");

    const incomingCollege = (u.college ?? "").trim();
    if ((COLLEGES as readonly string[]).includes(incomingCollege)) {
      setCollege(incomingCollege as College);
    } else {
      setCollege("Bang College of Business");
    }

    setCampusVisibility(
      isCampusVisibility(u.campusStatusVisibility) ? u.campusStatusVisibility : "EVERYONE"
    );
    setCampusDuration(
      isCampusDuration(u.campusStatusDuration) ? u.campusStatusDuration : "2h"
    );
  }, [status, session]);

  const username = useMemo(() => {
    const u: any = session?.user;
    return (u?.username as string | undefined) ?? undefined;
  }, [session]);

  function onSave() {
    if (status !== "authenticated" || !session?.user) return;

    startTransition(async () => {
      await updateProfile({
        image: image || undefined,
        status: statusText || undefined,
        major: major || undefined,
        yearOfStudy: yearOfStudy.trim() === "" ? null : Number(yearOfStudy),
        emoji: emoji || "☕",
        college,
      });

      await setCampusPrefs({
        visibility: campusVisibility,
        duration: campusDuration,
      });

      router.push(username ? `/u/${username}` : "/");
      router.refresh();
    });
  }

  if (status === "loading") return null;

  return (
    <main className="mx-auto max-w-md px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{t("settings.profile.editTitle")}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t("settings.profile.editDesc")}
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-24 w-24 rounded-full overflow-hidden border bg-gray-100 flex items-center justify-center shrink-0">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={t("settings.profile.previewAlt")}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-3xl">{emoji}</span>
            )}
          </div>

          <div className="flex-1 min-w-0 w-full">
            <AvatarUploader onUploaded={(url) => setImage(url)} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
        <div>
          <div className="text-base font-semibold">{t("settings.profile.campusTitle")}</div>
          <div className="text-sm text-gray-500 mt-1">
            {t("settings.profile.campusDesc")}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-gray-700">{t("settings.profile.visibleTo")}</div>
            <select
              value={campusVisibility}
              onChange={(e) => setCampusVisibility(e.target.value as CampusVisibility)}
              disabled={isPending}
              className="w-56 rounded-xl border px-3 py-2 text-sm bg-white"
            >
              <option value="ONLY_ME">{t("settings.option.onlyMe")}</option>
              <option value="FRIENDS">{t("settings.option.friends")}</option>
              <option value="EVERYONE">{t("settings.option.everyone")}</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-gray-700">{t("settings.profile.expiresIn")}</div>
            <select
              value={campusDuration}
              onChange={(e) => setCampusDuration(e.target.value as CampusDuration)}
              disabled={isPending}
              className="w-56 rounded-xl border px-3 py-2 text-sm bg-white"
            >
              <option value="2h">{t("settings.profile.duration2h")}</option>
              <option value="4h">{t("settings.profile.duration4h")}</option>
              <option value="eod">{t("settings.profile.durationEod")}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <input
          placeholder={t("settings.profile.statusPlaceholder")}
          value={statusText}
          onChange={(e) => setStatusText(e.target.value)}
          maxLength={80}
          className="w-full rounded-xl border px-3 py-2 text-sm"
        />

        <input
          placeholder={t("settings.profile.majorPlaceholder")}
          value={major}
          onChange={(e) => setMajor(e.target.value)}
          className="w-full rounded-xl border px-3 py-2 text-sm"
        />

        <select
          value={college}
          onChange={(e) => setCollege(e.target.value as College)}
          className="w-full rounded-xl border px-3 py-2 text-sm bg-white"
        >
          <option value="Bang College of Business">{t("settings.profile.college.bcb")}</option>
          <option value="College of Social Sciences">{t("settings.profile.college.css")}</option>
          <option value="School of Law">{t("settings.profile.college.law")}</option>
          <option value="School of Humanities and Education">{t("settings.profile.college.he")}</option>
          <option value="School of Mathematics and Computer Science">{t("settings.profile.college.mcs")}</option>
          <option value="Other">{t("settings.profile.college.other")}</option>
        </select>

        <input
          placeholder={t("settings.profile.yearPlaceholder")}
          inputMode="numeric"
          value={yearOfStudy}
          onChange={(e) => setYearOfStudy(e.target.value)}
          className="w-full rounded-xl border px-3 py-2 text-sm"
        />

        <input
          placeholder={t("settings.profile.emojiPlaceholder")}
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          className="w-full rounded-xl border px-3 py-2 text-sm"
        />

        <button
          onClick={onSave}
          disabled={isPending}
          className="w-full rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {isPending ? t("settings.profile.saving") : t("settings.profile.saveChanges")}
        </button>
      </div>
    </main>
  );
}