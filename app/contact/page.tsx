"use client";

import { useState } from "react";
export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: "", email: "", message: "" });
        setTimeout(() => {
          setSubmitted(false);
        }, 5000);
      } else {
        alert(data.error || "Failed to send your message.");
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
      alert("Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left Section - Contact Form */}
            <div className="p-8 md:p-12 bg-white dark:bg-gray-800">
              <h1 className="text-4xl md:text-5xl font-bold text-purple-600 dark:text-purple-400 mb-3">
                Get in touch
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                Have questions or feedback? Send us a message and we’ll get back to you soon.
              </p>

              {submitted ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-400 p-6 rounded-lg">
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <p className="font-semibold">
                      Thank you! Your message has been sent.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Your name"
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                    />
                  </div>

                  <div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                    />
                  </div>

                  <div>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      placeholder="How can we help?"
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </button>
                </form>
              )}
            </div>

            {/* Right Section - Illustration and Contact Info */}
            <div className="p-8 md:p-12 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-700 dark:to-gray-800 flex flex-col">
              {/* Illustration */}
              <div className="flex-1 flex items-center justify-center mb-8">
                <div className="relative w-full max-w-md">
                  {/* Person Illustration */}
                  <svg
                    viewBox="0 0 400 300"
                    className="w-full h-auto"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Background shapes */}
                    <circle
                      cx="320"
                      cy="60"
                      r="40"
                      fill="#E9D5FF"
                      className="dark:fill-purple-900"
                      opacity="0.6"
                    />
                    <circle
                      cx="80"
                      cy="240"
                      r="30"
                      fill="#E9D5FF"
                      className="dark:fill-purple-900"
                      opacity="0.5"
                    />
                    <ellipse
                      cx="350"
                      cy="200"
                      rx="25"
                      ry="35"
                      fill="#E9D5FF"
                      className="dark:fill-purple-900"
                      opacity="0.4"
                    />

                    {/* Document/Scroll */}
                    <rect
                      x="180"
                      y="80"
                      width="140"
                      height="180"
                      rx="8"
                      fill="#FFFFFF"
                      className="dark:fill-gray-600"
                      stroke="#9333EA"
                      strokeWidth="2"
                    />
                    {/* Document lines */}
                    <line
                      x1="200"
                      y1="120"
                      x2="280"
                      y2="120"
                      stroke="#9333EA"
                      strokeWidth="2"
                      opacity="0.3"
                    />
                    <line
                      x1="200"
                      y1="150"
                      x2="280"
                      y2="150"
                      stroke="#9333EA"
                      strokeWidth="2"
                      opacity="0.3"
                    />
                    <line
                      x1="200"
                      y1="180"
                      x2="280"
                      y2="180"
                      stroke="#9333EA"
                      strokeWidth="2"
                      opacity="0.3"
                    />
                    {/* Signature */}
                    <path
                      d="M210 230 Q230 220 250 230 T280 230"
                      stroke="#9333EA"
                      strokeWidth="2"
                      fill="none"
                    />

                    {/* Person */}
                    <circle
                      cx="120"
                      cy="100"
                      r="25"
                      fill="#9333EA"
                      className="dark:fill-purple-400"
                    />
                    <rect
                      x="95"
                      y="125"
                      width="50"
                      height="80"
                      rx="25"
                      fill="#9333EA"
                      className="dark:fill-purple-400"
                    />
                    <rect
                      x="85"
                      y="200"
                      width="20"
                      height="50"
                      rx="10"
                      fill="#9333EA"
                      className="dark:fill-purple-400"
                    />
                    <rect
                      x="135"
                      y="200"
                      width="20"
                      height="50"
                      rx="10"
                      fill="#9333EA"
                      className="dark:fill-purple-400"
                    />

                    {/* Phone icon */}
                    <g transform="translate(320, 40)">
                      <rect
                        x="0"
                        y="0"
                        width="24"
                        height="40"
                        rx="4"
                        fill="#9333EA"
                        className="dark:fill-purple-400"
                      />
                      <circle
                        cx="12"
                        cy="32"
                        r="2"
                        fill="#FFFFFF"
                        className="dark:fill-gray-300"
                      />
                    </g>

                    {/* Envelope icon */}
                    <g transform="translate(60, 220)">
                      <rect
                        x="0"
                        y="0"
                        width="32"
                        height="24"
                        rx="2"
                        fill="#9333EA"
                        className="dark:fill-purple-400"
                      />
                      <path
                        d="M0 8 L16 16 L32 8"
                        stroke="#FFFFFF"
                        className="dark:stroke-gray-300"
                        strokeWidth="2"
                        fill="none"
                      />
                    </g>
                  </svg>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-gray-700 dark:text-gray-300">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-base font-medium">New Delhi, India</span>
                </div>

                <div className="flex items-center gap-4 text-gray-700 dark:text-gray-300">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <span className="text-base font-medium">+91 98765 43210</span>
                </div>

                <div className="flex items-center gap-4 text-gray-700 dark:text-gray-300">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <a
                    href="mailto:officialpreetithakur@gmail.com"
                    className="text-base font-medium hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    officialpreetithakur@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
