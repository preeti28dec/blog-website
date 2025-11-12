import Link from "next/link";

export default function ProjectsPage() {
  const projects = [
    {
      id: 1,
      title: "Blog Website",
      description: "A modern blogging platform built with Next.js, featuring user authentication, post management, and comments.",
      tech: ["Next.js", "TypeScript", "Prisma", "MongoDB"],
      link: "/",
    },
    {
      id: 2,
      title: "E-Commerce Platform",
      description: "Full-stack e-commerce solution with payment integration and order management.",
      tech: ["React", "Node.js", "Stripe", "PostgreSQL"],
      link: "#",
    },
    {
      id: 3,
      title: "Task Management App",
      description: "Collaborative task management application with real-time updates and team collaboration features.",
      tech: ["Next.js", "Socket.io", "MongoDB", "Tailwind CSS"],
      link: "#",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
          Projects
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Here are some of my recent projects and work.
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <h3 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
                {project.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tech.map((tech, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              {project.link !== "#" && (
                <Link
                  href={project.link}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  View Project →
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



