export default function SkillsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
          My Skills
        </h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Here are my technical skills and expertise areas.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Frontend Development
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>• React & Next.js</li>
                <li>• TypeScript</li>
                <li>• Tailwind CSS</li>
                <li>• HTML5 & CSS3</li>
              </ul>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Backend Development
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>• Node.js</li>
                <li>• Express.js</li>
                <li>• MongoDB & Prisma</li>
                <li>• RESTful APIs</li>
              </ul>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Tools & Technologies
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>• Git & GitHub</li>
                <li>• VS Code</li>
                <li>• Cloudinary</li>
                <li>• Vercel Deployment</li>
              </ul>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Other Skills
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>• UI/UX Design</li>
                <li>• Responsive Design</li>
                <li>• SEO Optimization</li>
                <li>• Performance Optimization</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



