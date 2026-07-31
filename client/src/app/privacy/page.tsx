import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-300 pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white font-heading tracking-tight">Privacy Policy</h1>
            <p className="text-sm text-gray-500 mt-2 font-medium tracking-widest uppercase">Last Updated: July 2026</p>
          </div>
        </div>

        <div className="space-y-8 prose prose-invert prose-p:leading-relaxed prose-h2:text-2xl prose-h2:text-white prose-h2:font-heading prose-h2:tracking-tight max-w-none">
          <section className="p-8 rounded-3xl bg-[#141414] border border-white/5 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
            <p className="text-gray-400 mb-4 font-light">
              We collect information that you provide directly to us when you use our services. This includes personal information such as your name, email address, phone number, vehicle details, and payment information. We also collect location data to provide our mobile detailing services to your exact location.
            </p>
            <p className="text-gray-400 font-light">
              Automatically collected data includes device information, IP addresses, and browsing behavior on our platform to enhance user experience and ensure security.
            </p>
          </section>

          <section className="p-8 rounded-3xl bg-[#141414] border border-white/5 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-400 mb-4 font-light">We use the information we collect to:</p>
            <ul className="list-disc pl-5 text-gray-400 space-y-2 font-light">
              <li>Provide, maintain, and improve our detailing services.</li>
              <li>Process your transactions and send related information, including confirmations and receipts.</li>
              <li>Send you technical notices, updates, security alerts, and support messages.</li>
              <li>Respond to your comments, questions, and customer service requests.</li>
              <li>Communicate with you about products, services, offers, and events offered by CleanRide.</li>
            </ul>
          </section>

          <section className="p-8 rounded-3xl bg-[#141414] border border-white/5 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">3. Data Sharing and Security</h2>
            <p className="text-gray-400 mb-4 font-light">
              We do not share your personal information with third parties except as described in this privacy policy. We may share information with our trusted partners who perform services on our behalf, such as payment processing and verified detailing partners who need your location to fulfill service requests.
            </p>
            <p className="text-gray-400 font-light">
              We implement advanced security measures designed to protect your personal information from unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section className="p-8 rounded-3xl bg-[#141414] border border-white/5 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">4. Your Rights</h2>
            <p className="text-gray-400 font-light">
              You have the right to access, update, or delete your personal information. You can manage your account settings or contact our support team to exercise these rights.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
