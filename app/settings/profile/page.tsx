"use client";



import { useEffect, useMemo, useState, useTransition, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions/updateProfile";
import { setCampusPrefs } from "@/app/actions/setCampusPrefs";
import { useI18n } from "@/components/LanguageProvider";
import ImageCropper from "@/components/ImageCropper";
import { uploadFiles } from "@/lib/uploadthing"; 

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile States
  const [name, setName] = useState<string>(""); // ✅ NEW
  const [username, setUsername] = useState<string>(""); // ✅ NEW
  const [image, setImage] = useState<string>("");
  const [statusText, setStatusText] = useState<string>("");
  const [major, setMajor] = useState<string>("");
  const [yearOfStudy, setYearOfStudy] = useState<string>("");
  const [emoji, setEmoji] = useState<string>("☕");
  const [college, setCollege] = useState<College>("Bang College of Business");

  // Error State
  const [errorMsg, setErrorMsg] = useState<string | null>(null); // ✅ NEW

  // Campus States
  const [campusVisibility, setCampusVisibility] = useState<CampusVisibility>("EVERYONE");
  const [campusDuration, setCampusDuration] = useState<CampusDuration>("2h");

  // Cropper & Upload States
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/signin");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    const u: any = session.user;

    setName(u.name ?? "");
    setUsername(u.username ?? "");
    setImage(u.image ?? "");
    setStatusText(u.status ?? "");
    setMajor(u.major ?? "");
    setYearOfStudy(
      u.yearOfStudy === null || u.yearOfStudy === undefined
        ? ""
        : String(u.yearOfStudy)
    );
    u.emoji && setEmoji(u.emoji);

    const incomingCollege = (u.college ?? "").trim();
    if ((COLLEGES as readonly string[]).includes(incomingCollege)) {
      setCollege(incomingCollege as College);
    }

    setCampusVisibility(
      isCampusVisibility(u.campusStatusVisibility) ? u.campusStatusVisibility : "EVERYONE"
    );
    setCampusDuration(
      isCampusDuration(u.campusStatusDuration) ? u.campusStatusDuration : "2h"
    );
  }, [status, session]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => setTempImage(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCropComplete = async (blob: Blob) => {
    setTempImage(null);
    setIsUploading(true);

    try {
      const file = new File([blob], "profile.jpg", { type: "image/jpeg" });

      const res = await uploadFiles("avatarImage", {
        files: [file],
      });

      if (res && res[0].url) {
        setImage(res[0].url);
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  function onSave() {
    if (status !== "authenticated" || !session?.user) return;
    setErrorMsg(null); // Clear previous errors

    const normalizedYear = (() => {
      const raw = yearOfStudy.trim();
      if (raw === "") return null;
      const parsed = Number.parseInt(raw, 10);
      if (Number.isNaN(parsed)) return null;
      return Math.min(4, Math.max(1, parsed)); 
    })();

    startTransition(async () => {
      const res = await updateProfile({
        name: name || undefined,
        username: username || undefined,
        image: image || undefined,
        status: statusText || undefined,
        major: major || undefined,
        yearOfStudy: normalizedYear,
        emoji: emoji || "☕",
        college,
      });

      // ✅ Если сервер вернул ошибку, показываем ее и не переходим
      if (res && res.error) {
        setErrorMsg(res.error);
        return; 
      }

      await setCampusPrefs({
        visibility: campusVisibility,
        duration: campusDuration,
      });

      // ✅ Перенаправляем на актуальный юзернейм (если поменяли)
      const finalUsername = res?.username || (session.user as any).username;
      router.push(finalUsername ? `/u/${finalUsername}` : "/");
      router.refresh();
    });
  }

  if (status === "loading") return null;

  return (
    <main className="mx-auto max-w-md px-4 py-6 space-y-6">
      {tempImage && (
        <ImageCropper 
          image={tempImage} 
          onCropComplete={handleCropComplete} 
          onCancel={() => setTempImage(null)} 
        />
      )}

      <div>
        <h1 className="text-xl font-semibold dark:text-white">{t("settings.profile.editTitle")}</h1>
        <p className="text-sm text-gray-500 mt-1 dark:text-zinc-400">
          {t("settings.profile.editDesc")}
        </p>
      </div>

      {/* Вывод ошибки, если юзернейм занят */}
      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
          {errorMsg}
        </div>
      )}

      <div className="rounded-2xl border bg-white p-4 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border bg-gray-100 flex items-center justify-center dark:bg-zinc-800 dark:border-zinc-700">
            {image ? (
              <img
                src={image}
                alt={t("settings.profile.previewAlt")}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-3xl">{emoji}</span>
            )}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={onFileChange} 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition active:scale-95 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {isUploading ? t("settings.profile.saving") : "Change Photo"}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3 dark:bg-zinc-900 dark:border-zinc-800">
        <div>
          <div className="text-base font-semibold dark:text-white">{t("settings.profile.campusTitle")}</div>
          <div className="text-sm text-gray-500 mt-1 dark:text-zinc-400">
            {t("settings.profile.campusDesc")}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-gray-700 dark:text-zinc-300">{t("settings.profile.visibleTo")}</div>
            <select
              value={campusVisibility}
              onChange={(e) => setCampusVisibility(e.target.value as CampusVisibility)}
              disabled={isPending}
              className="w-48 sm:w-56 rounded-xl border px-3 py-2 text-sm bg-white outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
            >
              <option value="ONLY_ME">{t("settings.option.onlyMe")}</option>
              <option value="FRIENDS">{t("settings.option.friends")}</option>
              <option value="EVERYONE">{t("settings.option.everyone")}</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-gray-700 dark:text-zinc-300">{t("settings.profile.expiresIn")}</div>
            <select
              value={campusDuration}
              onChange={(e) => setCampusDuration(e.target.value as CampusDuration)}
              disabled={isPending}
              className="w-48 sm:w-56 rounded-xl border px-3 py-2 text-sm bg-white outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
            >
              <option value="2h">{t("settings.profile.duration2h")}</option>
              <option value="4h">{t("settings.profile.duration4h")}</option>
              <option value="eod">{t("settings.profile.durationEod")}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* ✅ NEW: Name field */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 ml-1">Name</label>
          <input
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black dark:bg-zinc-900 dark:border-zinc-800 dark:text-white dark:focus:ring-white"
          />
        </div>

        {/* ✅ NEW: Username field */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 ml-1">Username</label>
          <input
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())} // Принудительно в нижний регистр
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black dark:bg-zinc-900 dark:border-zinc-800 dark:text-white dark:focus:ring-white"
          />
        </div>

        <div className="space-y-1 mt-2">
          <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 ml-1">Bio / Status</label>
          <input
            placeholder={t("settings.profile.statusPlaceholder")}
            value={statusText}
            onChange={(e) => setStatusText(e.target.value)}
            maxLength={80}
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black dark:bg-zinc-900 dark:border-zinc-800 dark:text-white dark:focus:ring-white"
          />
        </div>

        <input
          placeholder={t("settings.profile.majorPlaceholder")}
          value={major}
          onChange={(e) => setMajor(e.target.value)}
          className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black dark:bg-zinc-900 dark:border-zinc-800 dark:text-white dark:focus:ring-white"
        />

        <select
          value={college}
          onChange={(e) => setCollege(e.target.value as College)}
          className="w-full rounded-xl border px-3 py-2 text-sm bg-white outline-none dark:bg-zinc-900 dark:border-zinc-800 dark:text-white"
        >
          <option value="Bang College of Business">{t("settings.profile.college.bcb")}</option>
          <option value="College of Social Sciences">{t("settings.profile.college.css")}</option>
          <option value="School of Law">{t("settings.profile.college.law")}</option>
          <option value="School of Humanities and Education">{t("settings.profile.college.he")}</option>
          <option value="School of Mathematics and Computer Science">{t("settings.profile.college.mcs")}</option>
          <option value="Other">{t("settings.profile.college.other")}</option>
        </select>

        <div className="flex gap-3">
          <input
            placeholder={t("settings.profile.yearPlaceholder")}
            type="number" min={1} max={4} step={1}
            inputMode="numeric"
            value={yearOfStudy}
            onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              setYearOfStudy("");
              return;
            }
            const parsed = Number.parseInt(raw, 10);
            if (Number.isNaN(parsed)) return;
            setYearOfStudy(String(Math.min(4, Math.max(1, parsed))));
          }}
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black dark:bg-zinc-900 dark:border-zinc-800 dark:text-white dark:focus:ring-white"
          />

          <input
            placeholder={t("settings.profile.emojiPlaceholder")}
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="w-24 shrink-0 text-center rounded-xl border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black dark:bg-zinc-900 dark:border-zinc-800 dark:text-white dark:focus:ring-white"
          />
        </div>

        <button
          onClick={onSave}
          disabled={isPending || isUploading}
          className="mt-4 w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {isPending ? t("settings.profile.saving") : t("settings.profile.saveChanges")}
        </button>
      </div>
    </main>
  );
}