import Image from "next/image";
import { Metadata } from "next";
import { notFound } from "next/navigation";

type AuthorPost = {
  slug: string;
  title: string;
  excerpt: string;
  publishedOn: string;
  readTime: string;
  category: string;
  commentCount: number;
  coverImage: string;
};

type AuthorProfile = {
  name: string;
  username: string;
  title: string;
  avatarUrl: string;
  bio: string;
  highlights: string[];
  stats: {
    posts: number;
    comments: number;
    assignments: number;
  };
  posts: AuthorPost[];
};

const authorProfiles: Record<string, AuthorProfile> = {
  "kashish-sharma": {
    name: "Kashish Sharma",
    username: "kashish-sharma",
    title: "Sports Journalist & Former National Athlete",
    avatarUrl:
      "https://res.cloudinary.com/demo/image/upload/w_320,h_320,c_fill,g_face/cld-sample-5.jpg",
    bio: "Kashish is a former nationally ranked tennis player turned sports journalist. She brings first-hand experience from the tour to every story she covers, blending on-ground reporting with sharp analysis across para sports, archery, and hockey.",
    highlights: [
      "Covered 40+ international tournaments",
      "Certified GPTCA C-Level International Coach",
      "Sports Marketing & PR specialist (IISM, Mumbai)",
    ],
    stats: {
      posts: 18,
      comments: 0,
      assignments: 6,
    },
    posts: [
      {
        slug: "arrows-and-ambition-archery-premier-league",
        title: "Arrows and Ambition: World-class archers grace Archery Premier League",
        excerpt:
          "India's sporting landscape just got sharper. The inaugural Archery Premier League is turning into a high-octane showcase of precision, performance, and clutch shooting under pressure.",
        publishedOn: "October 5, 2025",
        readTime: "6 min read",
        category: "Flashes",
        commentCount: 0,
        coverImage:
          "https://res.cloudinary.com/demo/image/upload/w_900,h_600,c_fill,g_auto/cld-sample-5.jpg",
      },
      {
        slug: "2025-world-para-athletics-leap-forward",
        title: "2025 World Para Athletics: A significant leap forward in how para sport is covered",
        excerpt:
          "The facilities are world-class and the treatment of the athletes sets a new standard. Behind the scenes, organisers are finally prioritising athlete-first design.",
        publishedOn: "October 4, 2025",
        readTime: "5 min read",
        category: "Flashes",
        commentCount: 0,
        coverImage:
          "https://res.cloudinary.com/demo/image/upload/w_900,h_600,c_fill,g_auto/cld-sample.jpg",
      },
      {
        slug: "viraaj-mascot-para-athletics-worlds",
        title: "Viraaj - the mascot unveiled for New Delhi 2025 Para Athletics World Championships",
        excerpt:
          "The road to one of the world's most inspiring sporting events officially kicked off today, as the Paralympic Committee unveiled Viraj - symbolising grit, color, and absolute joy.",
        publishedOn: "June 21, 2025",
        readTime: "4 min read",
        category: "Flashes",
        commentCount: 0,
        coverImage:
          "https://res.cloudinary.com/demo/image/upload/w_900,h_600,c_fill,g_auto/cld-sample-2.jpg",
      },
      {
        slug: "amity-university-hockey-india-mou",
        title: "Amity University and Hockey India sign MoU to transform the lives of young athletes",
        excerpt:
          "Indian women's hockey captain Salima Tete and defender Jyoti are among the first enrollees in the Bachelor of Arts Program at Amity University Online in a partnership built for long-term support.",
        publishedOn: "May 23, 2025",
        readTime: "7 min read",
        category: "Flashes",
        commentCount: 0,
        coverImage:
          "https://res.cloudinary.com/demo/image/upload/w_900,h_600,c_fill,g_auto/cld-sample-3.jpg",
      },
      {
        slug: "hockey-india-annual-awards-milestones",
        title: "Legends, milestones celebrated in Hockey India Annual Awards 2025",
        excerpt:
          "The biggest names in Indian hockey converged in New Delhi to recognise progress across para and able-bodied squads, with development pathways finally in sharp focus.",
        publishedOn: "April 30, 2025",
        readTime: "5 min read",
        category: "Features",
        commentCount: 2,
        coverImage:
          "https://res.cloudinary.com/demo/image/upload/w_900,h_600,c_fill,g_auto/cld-sample-4.jpg",
      },
      {
        slug: "india-finishes-world-para-athletics-grand-prix",
        title: "India finishes World Para Athletics Grand Prix 2025 with podium-hungry intent",
        excerpt:
          "Team India closed out the World Para Athletics Grand Prix by doubling down on relay depth and multi-event talent, setting the tone for an electric home world championship.",
        publishedOn: "March 18, 2025",
        readTime: "6 min read",
        category: "Analysis",
        commentCount: 4,
        coverImage:
          "https://res.cloudinary.com/demo/image/upload/w_900,h_600,c_fill,g_auto/cld-sample-6.jpg",
      },
    ],
  },
};

export const revalidate = 60;

export function generateStaticParams() {
  return Object.keys(authorProfiles).map((username) => ({ username }));
}

export function generateMetadata({
  params,
}: {
  params: { username: string };
}): Metadata {
  const profile = authorProfiles[params.username];

  if (!profile) {
    return {
      title: "Author Not Found",
      description: "We could not find the requested author profile.",
    };
  }

  return {
    title: `${profile.name} | Profile`,
    description: profile.bio,
  };
}

export default function AuthorProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const profile = authorProfiles[params.username];

  if (!profile) {
    notFound();
  }

  const stats = [
    { label: "Posts", value: profile.stats.posts },
    { label: "Comments", value: profile.stats.comments },
    { label: "Assignments", value: profile.stats.assignments },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto space-y-10">
        <section className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl rounded-2xl p-8 flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0">
            <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden border-4 border-blue-100 dark:border-blue-900 shadow-lg">
              <Image
                src={profile.avatarUrl}
                alt={profile.name}
                fill
                sizes="(max-width: 768px) 144px, 176px"
                className="object-cover"
                priority
              />
            </div>
          </div>

          <div className="flex-1 space-y-5">
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                {profile.name}
              </h1>
              <p className="text-lg text-blue-700 dark:text-blue-300 font-medium">
                {profile.title}
              </p>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {profile.bio}
            </p>

            <div className="flex flex-wrap gap-3">
              {profile.highlights.map((item) => (
                <span
                  key={item}
                  className="text-sm px-3 py-1 rounded-full bg-blue-50 text-blue-800 dark:bg-blue-900/40 dark:text-blue-100 border border-blue-100 dark:border-blue-800"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 px-4 py-3"
                >
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-sm uppercase tracking-wide text-gray-500">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-widest text-blue-500 font-semibold">
                Coverage
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Latest from {profile.name}
              </h2>
            </div>
            <p className="text-sm text-gray-500">
              Showing {profile.posts.length} of {profile.stats.posts} published stories
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {profile.posts.map((post) => (
              <article
                key={post.slug}
                className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-shadow overflow-hidden flex flex-col"
              >
                <div className="relative h-52 w-full">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute top-4 left-4 bg-black/70 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
                    {post.category}
                  </span>
                </div>

                <div className="flex flex-col flex-1 p-6 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      {profile.name}
                      <span className="px-2 text-gray-400" aria-hidden="true">
                        |
                      </span>
                      {post.publishedOn}
                    </p>
                    <h3 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 leading-snug">
                      {post.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="mt-auto flex items-center justify-between text-sm text-gray-500">
                    <span>{post.readTime}</span>
                    <span className="inline-flex items-center gap-1">
                      <CommentIcon />
                      {post.commentCount}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function CommentIcon() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17 11.5C17 12.3284 16.3284 13 15.5 13H6L3 16V4.5C3 3.67157 3.67157 3 4.5 3H15.5C16.3284 3 17 3.67157 17 4.5V11.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
