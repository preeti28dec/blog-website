import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PROFILE_KEY } from "@/lib/profile";
import ProfilePhotoControls from "@/components/ProfilePhotoControls";

const baseStats = [
  { key: "posts", label: "Posts", helper: "Feature stories + analysis" },
  { key: "comments", label: "Comments", helper: "Community-first moderation" },
  { key: "coachingYears", label: "Years Coaching", helper: "Athlete mentorship" },
];

const specialties = [
  "Sports Marketing & PR",
  "Event and Facility Management",
  "Broadcasting & Sports Administration",
  "Storytelling, strategy, and on-ground execution",
];

export const metadata: Metadata = {
  title: "About | Kashish Sharma",
  description:
    "Learn more about Kashish Sharma — former national tennis player, coach, and sports storyteller behind the Blog.",
};

export const revalidate = 60;

async function getAboutStats() {
  const [publishedPosts, approvedComments] = await prisma.$transaction([
    prisma.post.count({ where: { published: true } }),
    prisma.comment.count({ where: { approved: true } }),
  ]);

  return {
    posts: publishedPosts,
    comments: approvedComments,
    coachingYears: "10+",
  };
}

async function getProfileData() {
  try {
    const profile = await prisma.profile.findUnique({
      where: { key: PROFILE_KEY },
    });
    const storedImage = profile?.imageUrl ?? null;
    return {
      storedImage,
      displayImage: storedImage,
    };
  } catch (error) {
    console.error("[about] Failed to load profile image", error);
    return {
      storedImage: null,
      displayImage: null,
    };
  }
}

export default async function AboutPage() {
  const [{ posts, comments, coachingYears }, profileData] = await Promise.all([
    getAboutStats(),
    getProfileData(),
  ]);
  const portraitSrc = profileData.displayImage;
  const stats = baseStats.map((stat) => {
    if (stat.key === "posts") {
      return { ...stat, value: posts.toString() };
    }
    if (stat.key === "comments") {
      return { ...stat, value: comments.toString() };
    }
    if (stat.key === "coachingYears") {
      return { ...stat, value: coachingYears };
    }
    return { ...stat, value: "-" };
  });
  const hasPortrait = Boolean(portraitSrc);
  const useUnoptimized = portraitSrc?.startsWith("data:") ?? false;

  return (
    <div className="container mx-auto max-w-5xl px-3 sm:px-4 md:px-6 py-8 sm:py-12 md:py-16 text-gray-800 dark:text-gray-100">
      <header className="mb-8 sm:mb-10 md:mb-12">
        <p className="text-xs sm:text-sm uppercase tracking-wide text-blue-600 dark:text-blue-300">
          About
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          Kashish Sharma
        </h1>
        <p className="mt-3 sm:mt-4 max-w-3xl text-base sm:text-lg text-gray-600 dark:text-gray-300">
          Former nationally ranked tennis player, certified GPTCA C-Level
          International Coach, and the voice bringing you athlete-first stories
          from courtside to boardroom.
        </p>
      </header>

      <section className="flex flex-col gap-6 sm:gap-8 md:gap-10 rounded-2xl sm:rounded-3xl bg-white/70 p-4 sm:p-6 md:p-8 shadow-xl ring-1 ring-gray-200 dark:bg-gray-900/60 dark:ring-gray-800 md:flex-row md:items-start">
        <div className="mx-auto w-full max-w-[280px] sm:max-w-xs md:max-w-sm">
          <div className="rounded-2xl sm:rounded-[32px] border border-dashed border-blue-200 bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 p-2 sm:p-3 shadow-lg dark:border-blue-900/50 dark:from-gray-700 dark:via-gray-700 dark:to-gray-800">
            {hasPortrait ? (
              <Image
                src={portraitSrc as string}
                alt="Kashish Sharma portrait"
                width={460}
                height={520}
                className="h-full w-full rounded-xl sm:rounded-[24px] object-cover"
                unoptimized={useUnoptimized}
                priority
              />
            ) : (
              <div className="flex h-[400px] sm:h-[480px] md:h-[520px] flex-col items-center justify-center rounded-xl sm:rounded-[24px] bg-gradient-to-br from-white/70 to-blue-50 text-center text-xs sm:text-sm text-gray-500 dark:from-gray-800 dark:to-gray-900 dark:text-gray-300">
                <svg
                  className="h-12 w-12 text-blue-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 11c1.657 0 3-1.567 3-3.5S13.657 4 12 4 9 5.567 9 7.5 10.343 11 12 11zM5 20c0-3.038 3.134-5.5 7-5.5s7 2.462 7 5.5"
                  />
                </svg>
                <p className="mt-3 font-medium text-gray-700 dark:text-gray-100">
                  No hero portrait yet
                </p>
                <p className="mt-1 max-w-xs text-xs text-gray-500 dark:text-gray-400">
                  Upload a vertical PNG/JPG to showcase on the About page.
                </p>
              </div>
            )}
          </div>
          <ProfilePhotoControls
            storedImage={profileData.storedImage}
            variant="hero"
          />
        </div>

        <div className="flex-1 space-y-4 sm:space-y-6">
          <p className="text-sm sm:text-base">
            Kashish Sharma is a former nationally ranked tennis player. She
            transitioned into coaching and now serves as a certified GPTCA
            C-Level International Coach. Kashish holds a degree in Sports
            Management from IISM, Mumbai with a specialization in Sports
            Marketing &amp; PR, Event and Facility Management, Broadcasting and
            Sports Administration.
          </p>
          <p className="text-sm sm:text-base">
            Kashish now serves as a freelance writer and reporter, blending
            first-hand athletic experience with sharp reporting and management
            insight. She has covered major tournaments and continues to manage
            athletes across various disciplines. Kashish is committed to
            elevating sports through storytelling, strategy and on-ground
            impact.
          </p>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl sm:rounded-2xl border border-gray-200 bg-gray-50 px-4 sm:px-5 py-3 sm:py-4 text-center dark:border-gray-700 dark:bg-gray-800"
              >
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs sm:text-sm font-semibold uppercase tracking-wide text-gray-500">
                  {stat.label}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {stat.helper}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 sm:mt-12 md:mt-16 rounded-2xl sm:rounded-3xl bg-gray-50 p-4 sm:p-6 md:p-8 ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
          What Kashish Brings
        </h2>
        <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-300">
          Combining athlete management, event command, and media fluency, Kashish
          crafts narratives that celebrate discipline and human stories behind
          sport. Her toolkit spans:
        </p>
        <ul className="mt-4 sm:mt-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
          {specialties.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl bg-white px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
            >
              <span className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 sm:mt-12 md:mt-16 space-y-4 sm:space-y-6">
        <div className="rounded-2xl sm:rounded-3xl border border-gray-200 p-4 sm:p-6 md:p-8 dark:border-gray-800">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Current Focus
          </h3>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Coaching emerging tennis talent, consulting federations on athlete
            pathways, and filing dispatches from ATP, WTA, and ITF events with a
            manager&apos;s eye for detail.
          </p>
        </div>
        <div className="rounded-2xl sm:rounded-3xl border border-gray-200 p-4 sm:p-6 md:p-8 dark:border-gray-800">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Mission
          </h3>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-300">
            To elevate sports through storytelling, strategy, and on-ground
            impact—giving athletes, coaches, and fans actionable insight into the
            work it takes to compete at every level.
          </p>
        </div>
      </section>
    </div>
  );
}


