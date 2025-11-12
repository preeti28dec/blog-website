import Link from "next/link";

export default function ServicesPage() {
  const services = [
    {
      icon: "💻",
      title: "Web Development",
      description: "Custom web applications built with modern technologies like React, Next.js, and Node.js.",
    },
    {
      icon: "📱",
      title: "Mobile Development",
      description: "Responsive mobile-first designs that work seamlessly across all devices and screen sizes.",
    },
    {
      icon: "🎨",
      title: "UI/UX Design",
      description: "Beautiful and intuitive user interfaces designed with user experience in mind.",
    },
    {
      icon: "⚡",
      title: "Performance Optimization",
      description: "Optimize your website for speed, SEO, and better user experience.",
    },
    {
      icon: "🔒",
      title: "Security & Authentication",
      description: "Secure authentication systems and data protection for your applications.",
    },
    {
      icon: "🚀",
      title: "Deployment & DevOps",
      description: "Deploy your applications to production with CI/CD pipelines and cloud hosting.",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
          Services
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          What I can help you with.
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="text-4xl mb-4">{service.icon}</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                {service.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {service.description}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            Interested in working together?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Let&apos;s discuss your project and how I can help bring your ideas to life.
          </p>
          <Link
            href="/contact"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Get In Touch
          </Link>
        </div>
      </div>
    </div>
  );
}

