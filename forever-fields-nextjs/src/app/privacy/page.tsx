import Link from "next/link";
import { Flower2, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Forever Fields memorial platform",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-sage-pale/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2">
              <Flower2 className="w-8 h-8 text-sage" />
              <span className="text-xl font-serif font-bold text-sage-dark">
                Forever Fields
              </span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-gray-body hover:text-sage"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <article className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-serif font-bold text-gray-dark mb-2">
            Privacy Policy
          </h1>
          <p className="text-gray-body mb-8">
            Last updated: January 2026
          </p>

          <div className="prose prose-sage max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-serif font-bold text-gray-dark mb-4">
                1. Introduction
              </h2>
              <p className="text-gray-body leading-relaxed">
                Forever Fields (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your
                information when you use our memorial platform service. We understand that the
                information you share with us is deeply personal and meaningful, and we treat
                it with the utmost care and respect.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-serif font-bold text-gray-dark mb-4">
                2. Information We Collect
              </h2>

              <h3 className="text-lg font-semibold text-gray-dark mt-6 mb-3">
                Personal Information
              </h3>
              <ul className="list-disc pl-6 text-gray-body space-y-2">
                <li>Name and email address</li>
                <li>Phone number (optional)</li>
                <li>Payment information (processed securely via Stripe)</li>
                <li>Account preferences and settings</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-dark mt-6 mb-3">
                Memorial Content
              </h3>
              <ul className="list-disc pl-6 text-gray-body space-y-2">
                <li>Photos and videos you upload</li>
                <li>Stories, memories, and biographical information</li>
                <li>Voice recordings and audio files</li>
                <li>Family tree data and relationships</li>
                <li>Location information for memorial sites</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-dark mt-6 mb-3">
                Automatically Collected Information
              </h3>
              <ul className="list-disc pl-6 text-gray-body space-y-2">
                <li>Device information and browser type</li>
                <li>IP address and general location</li>
                <li>Usage data and interaction patterns</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-serif font-bold text-gray-dark mb-4">
                3. How We Use Your Information
              </h2>
              <p className="text-gray-body leading-relaxed mb-4">
                We use your information to:
              </p>
              <ul className="list-disc pl-6 text-gray-body space-y-2">
                <li>Provide and maintain our memorial services</li>
                <li>Process your transactions and send related information</li>
                <li>Send you technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Improve and develop new features</li>
                <li>Protect against fraudulent or unauthorized activity</li>
                <li>Power AI features (with your explicit consent)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-serif font-bold text-gray-dark mb-4">
                4. AI Features & Data Processing
              </h2>
              <p className="text-gray-body leading-relaxed mb-4">
                Our AI-powered features use your data to:
              </p>
              <ul className="list-disc pl-6 text-gray-body space-y-2">
                <li>Assist with writing memories and obituaries</li>
                <li>Generate conversations based on shared memories (Legacy Companion)</li>
                <li>Enhance and restore photos</li>
                <li>Transcribe voice recordings</li>
              </ul>
              <p className="text-gray-body leading-relaxed mt-4">
                You control which AI features to use. AI-processed content is not shared with
                third parties for marketing purposes. Our AI partners (Anthropic, Replicate)
                process data according to strict data processing agreements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-serif font-bold text-gray-dark mb-4">
                5. Information Sharing
              </h2>
              <p className="text-gray-body leading-relaxed mb-4">
                We do not sell your personal information. We may share information with:
              </p>
              <ul className="list-disc pl-6 text-gray-body space-y-2">
                <li><strong>Service Providers:</strong> Companies that help us operate (hosting, payments, AI processing)</li>
                <li><strong>Family Members:</strong> Those you explicitly invite to collaborate on memorials</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger or acquisition</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-serif font-bold text-gray-dark mb-4">
                6. Memorial Privacy Settings
              </h2>
              <p className="text-gray-body leading-relaxed mb-4">
                You control who can view your memorials:
              </p>
              <ul className="list-disc pl-6 text-gray-body space-y-2">
                <li><strong>Public:</strong> Visible to anyone on the internet</li>
                <li><strong>Unlisted:</strong> Only accessible via direct link</li>
                <li><strong>Private:</strong> Only visible to invited collaborators</li>
              </ul>
              <p className="text-gray-body leading-relaxed mt-4">
                You can change these settings at any time from the memorial settings page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-serif font-bold text-gray-dark mb-4">
                7. Data Security
              </h2>
              <p className="text-gray-body leading-relaxed">
                We implement industry-standard security measures including:
              </p>
              <ul className="list-disc pl-6 text-gray-body space-y-2 mt-4">
                <li>Encryption of data in transit (TLS/SSL) and at rest</li>
                <li>Regular security audits and vulnerability testing</li>
                <li>Access controls and authentication requirements</li>
                <li>Secure data centers with physical security</li>
                <li>Regular backups with geo-redundant storage</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-serif font-bold text-gray-dark mb-4">
                8. Data Retention
              </h2>
              <p className="text-gray-body leading-relaxed">
                We retain your data for as long as your account is active. Memorial content
                is preserved indefinitely by default to honor your loved ones&apos; memories.
                If you close your account, we retain data for 90 days before permanent deletion,
                allowing time to export your content or reconsider.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-serif font-bold text-gray-dark mb-4">
                9. Your Rights
              </h2>
              <p className="text-gray-body leading-relaxed mb-4">
                Depending on your location, you may have the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-body space-y-2">
                <li><strong>Access:</strong> Request a copy of your data</li>
                <li><strong>Correction:</strong> Update inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your data</li>
                <li><strong>Portability:</strong> Export your data in a standard format</li>
                <li><strong>Opt-out:</strong> Decline marketing communications</li>
                <li><strong>Restrict:</strong> Limit how we process your data</li>
              </ul>
              <p className="text-gray-body leading-relaxed mt-4">
                To exercise these rights, contact us at privacy@foreverfields.com.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-serif font-bold text-gray-dark mb-4">
                10. Children&apos;s Privacy
              </h2>
              <p className="text-gray-body leading-relaxed">
                Our Service is not intended for children under 13. We do not knowingly collect
                personal information from children under 13. Our Kids features are designed for
                use with parental supervision, and any content related to children is controlled
                by their parent or guardian account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-serif font-bold text-gray-dark mb-4">
                11. International Transfers
              </h2>
              <p className="text-gray-body leading-relaxed">
                Your information may be transferred to and processed in countries other than
                your own. We ensure appropriate safeguards are in place for international
                transfers, including standard contractual clauses approved by relevant authorities.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-serif font-bold text-gray-dark mb-4">
                12. Cookies
              </h2>
              <p className="text-gray-body leading-relaxed">
                We use essential cookies to operate our Service, and optional analytics cookies
                to improve your experience. You can manage cookie preferences through your
                browser settings. Disabling cookies may affect some features of our Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-serif font-bold text-gray-dark mb-4">
                13. Changes to This Policy
              </h2>
              <p className="text-gray-body leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of
                material changes by email or through a prominent notice on our Service.
                Your continued use after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-serif font-bold text-gray-dark mb-4">
                14. Contact Us
              </h2>
              <p className="text-gray-body leading-relaxed">
                If you have questions about this Privacy Policy or our data practices:
              </p>
              <p className="text-gray-body mt-4">
                <strong>Email:</strong> privacy@foreverfields.com<br />
                <strong>Data Protection Officer:</strong> dpo@foreverfields.com<br />
                <strong>Address:</strong> Forever Fields, Inc.<br />
                123 Memorial Lane<br />
                San Francisco, CA 94102
              </p>
            </section>
          </div>
        </article>

        <div className="mt-8 text-center">
          <Link href="/terms" className="text-sage hover:text-sage-dark">
            Read our Terms of Service →
          </Link>
        </div>
      </main>
    </div>
  );
}
