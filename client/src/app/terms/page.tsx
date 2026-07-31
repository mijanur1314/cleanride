import { FileText } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-300 pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white font-heading tracking-tight">Terms of Service</h1>
            <p className="text-sm text-gray-500 mt-2 font-medium tracking-widest uppercase">Last Updated: July 2026</p>
          </div>
        </div>

        <div className="space-y-8 prose prose-invert prose-p:leading-relaxed prose-h2:text-2xl prose-h2:text-white prose-h2:font-heading prose-h2:tracking-tight max-w-none">
          <section className="p-8 rounded-3xl bg-[#141414] border border-white/5 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-400 mb-4 font-light">
              By accessing or using the CleanRide mobile or web application, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access our services.
            </p>
          </section>

          <section className="p-8 rounded-3xl bg-[#141414] border border-white/5 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">2. Service Description</h2>
            <p className="text-gray-400 mb-4 font-light">
              CleanRide is an on-demand premium mobile car detailing platform that connects users with independent, verified detailing professionals. We are a technology platform, and while we ensure quality control and partner vetting, the actual detailing services are provided by independent contractors.
            </p>
          </section>

          <section className="p-8 rounded-3xl bg-[#141414] border border-white/5 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">3. User Responsibilities</h2>
            <p className="text-gray-400 mb-4 font-light">As a user of our service, you agree to:</p>
            <ul className="list-disc pl-5 text-gray-400 space-y-2 font-light">
              <li>Provide accurate and complete information when booking a service.</li>
              <li>Ensure the vehicle is parked in a legally accessible location where detailing can be safely performed.</li>
              <li>Remove all personal valuables from the vehicle prior to the service.</li>
              <li>Be present or available at the start and end of the scheduled service time.</li>
            </ul>
          </section>

          <section className="p-8 rounded-3xl bg-[#141414] border border-white/5 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">4. Cancellations & Refunds</h2>
            <p className="text-gray-400 font-light mb-4">
              Bookings can be canceled without penalty up to 4 hours before the scheduled service time. Cancellations made within 4 hours may be subject to a cancellation fee. Refunds for unsatisfactory service will be evaluated on a case-by-case basis through our support team.
            </p>
          </section>

          <section className="p-8 rounded-3xl bg-[#141414] border border-white/5 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">5. Limitation of Liability</h2>
            <p className="text-gray-400 font-light">
              CleanRide is not liable for any pre-existing damage to the vehicle. While our partners take the utmost care, any claims regarding damage must be reported within 24 hours of service completion. CleanRide's total liability shall not exceed the amount paid for the specific service in question.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
