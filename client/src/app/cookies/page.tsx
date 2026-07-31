import { Cookie } from "lucide-react";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-300 pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Cookie className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white font-heading tracking-tight">Cookie Policy</h1>
            <p className="text-sm text-gray-500 mt-2 font-medium tracking-widest uppercase">Last Updated: July 2026</p>
          </div>
        </div>

        <div className="space-y-8 prose prose-invert prose-p:leading-relaxed prose-h2:text-2xl prose-h2:text-white prose-h2:font-heading prose-h2:tracking-tight max-w-none">
          <section className="p-8 rounded-3xl bg-[#141414] border border-white/5 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">What Are Cookies?</h2>
            <p className="text-gray-400 mb-4 font-light">
              Cookies are small text files that are placed on your computer or mobile device when you visit our website. They are widely used to make websites work more efficiently and provide information to the owners of the site.
            </p>
          </section>

          <section className="p-8 rounded-3xl bg-[#141414] border border-white/5 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">How We Use Cookies</h2>
            <p className="text-gray-400 mb-4 font-light">We use cookies for several reasons:</p>
            <ul className="list-disc pl-5 text-gray-400 space-y-2 font-light">
              <li><strong>Essential Cookies:</strong> These are required for the operation of our platform (e.g., keeping you logged in).</li>
              <li><strong>Performance & Analytics:</strong> These allow us to recognize and count the number of visitors and see how they move around our site. This helps us improve the way our platform works.</li>
              <li><strong>Functionality Cookies:</strong> These are used to recognize you when you return to our site, remembering your preferences (like location or selected service tier).</li>
              <li><strong>Targeting Cookies:</strong> These record your visit, the pages you visited, and links you followed to make advertising more relevant to your interests.</li>
            </ul>
          </section>

          <section className="p-8 rounded-3xl bg-[#141414] border border-white/5 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">Managing Cookies</h2>
            <p className="text-gray-400 font-light mb-4">
              You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies. If you disable or refuse cookies, please note that some parts of this platform may become inaccessible or not function properly.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
