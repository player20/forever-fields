import Link from "next/link";
import { Flower2, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Forever Fields memorial platform",
};

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-gray-body mb-8">
            Last updated: January 2026
          </p>

          <div className="prose prose-sage max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-serif font-bold text-gray-dark mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-body leading-relaxed">
                By accessing or using Forever Fields (&quot;the Service&quot;), you agree to be bound
                by these Terms of Service. If you do not agree to these terms, please do not
                use our Service. We reserve the right to modify these terms at any time, and
                your continued use of the Service constitutes acceptance of any changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-serif font-bold text-gray-dark mb-4">
                2. Description of Service
              </h2>
              <p className="text-gray-body leading-relaxed">
                Forever Fields provides a digital memorial platform that allows users to create,
                manage, and share memorial pages for their loved ones. Our services include but
                are not limited to: memorial page creation, photo storage and enhancement, family
                collaboration tools, AI-assisted memory writing, and memorial merchandise.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-serif font-bold text-gray-dark mb-4">
                3. User Accounts
              </h2>
              <p className="text-gray-body leading-relaxed mb-4">
                To use certain features of our Service, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-body space-y-2">
                <li>Provide accurate and complete information when creating your account</li>
                <li>Maintain the security of your account credentials</li>
                <li>Promptly notify us of any unauthorized access to your account</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-serif font-bold text-gray-dark mb-4">
                4. User Content
              </h2>
              <p className="text-gray-body leading-relaxed mb-4">
                You retain ownership of content you upload to Forever Fields. By uploading content,
                you grant us a non-exclusive, worldwide, royalty-free license to use, display, and
                distribute your content solely for the purpose of providing our Service.
              </p>
              <p className="text-gray-body leading-relaxed">
                You are responsible for ensuring you have the right to share any content you upload,
                including photos, stories, and other media. Content must not violate any third-party
                rights or applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-serif font-bold text-gray-dark mb-4">
                5. Memorial Ownership & Transfer
              </h2>
              <p className="text-gray-body leading-relaxed mb-4">
                The creator of a memorial page is the primary owner. Owners may:
              </p>
              <ul className="list-disc pl-6 text-gray-body space-y-2">
                <li>Invite collaborators with varying permission levels</li>
                <li>Transfer ownership to another user</li>
                <li>Set privacy levels for the memorial</li>
                <li>Delete the memorial and all associated content</li>
              </ul>
              <p className="text-gray-body leading-relaxed mt-4">
                In the event of an account holder&apos;s death, ownership may be transferred to
                designated authorized contacts following our verification procedures.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-serif font-bold text-gray-dark mb-4">
                6. Acceptable Use
              </h2>
              <p className="text-gray-body leading-relaxed mb-4">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc pl-6 text-gray-body space-y-2">
                <li>Create memorials for living persons without their consent</li>
                <li>Upload harmful, offensive, or illegal content</li>
                <li>Impersonate others or create false memorials</li>
                <li>Violate the privacy rights of others</li>
                <li>Engage in harassment or abusive behavior</li>
                <li>Attempt to gain unauthorized access to our systems</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-serif font-bold text-gray-dark mb-4">
                7. AI Features
              </h2>
              <p className="text-gray-body leading-relaxed">
                Our Service includes AI-powered features such as memory writing assistance and
                legacy conversations. These features are designed to help preserve memories and
                are not intended to replace professional grief counseling. AI-generated content
                is based on information you provide and should be reviewed before sharing.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-serif font-bold text-gray-dark mb-4">
                8. Payments & Subscriptions
              </h2>
              <p className="text-gray-body leading-relaxed">
                Some features require a paid subscription. Subscription fees are billed in advance
                on a monthly or annual basis. You may cancel at any time, and your subscription
                will remain active until the end of the current billing period. Refunds are
                available within 30 days of initial purchase.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-serif font-bold text-gray-dark mb-4">
                9. Data Preservation
              </h2>
              <p className="text-gray-body leading-relaxed">
                We understand the irreplaceable nature of memorial content. We commit to:
              </p>
              <ul className="list-disc pl-6 text-gray-body space-y-2 mt-4">
                <li>Maintaining regular backups of all user data</li>
                <li>Providing 90-day grace period before content deletion due to non-payment</li>
                <li>Never deleting content without owner notification</li>
                <li>Offering data export options for all user content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-serif font-bold text-gray-dark mb-4">
                10. Limitation of Liability
              </h2>
              <p className="text-gray-body leading-relaxed">
                Forever Fields is provided &quot;as is&quot; without warranties of any kind. We are not
                liable for any indirect, incidental, or consequential damages arising from your
                use of the Service. Our total liability shall not exceed the amount paid by you
                in the 12 months preceding any claim.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-serif font-bold text-gray-dark mb-4">
                11. Contact Us
              </h2>
              <p className="text-gray-body leading-relaxed">
                If you have questions about these Terms of Service, please contact us at:
              </p>
              <p className="text-gray-body mt-4">
                <strong>Email:</strong> legal@foreverfields.com<br />
                <strong>Address:</strong> Forever Fields, Inc.<br />
                123 Memorial Lane<br />
                San Francisco, CA 94102
              </p>
            </section>
          </div>
        </article>

        <div className="mt-8 text-center">
          <Link href="/privacy" className="text-sage hover:text-sage-dark">
            Read our Privacy Policy →
          </Link>
        </div>
      </main>
    </div>
  );
}
