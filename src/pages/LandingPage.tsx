import React from 'react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 text-gray-800">
      <main className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
        <section className="rounded-2xl bg-white/90 p-6 shadow-sm sm:p-10">
          <h1 className="text-4xl font-bold text-pink-600 sm:text-5xl">Glow</h1>
          <p className="mt-4 text-base leading-7 text-gray-700 sm:text-lg">
            Glow provides Human Design readings and customized relationship matching systems.
          </p>
          <p className="mt-4 text-sm leading-6 text-gray-600">
            Domain: glowme.io
          </p>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-semibold text-gray-900">Services</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-gray-700">
            <li>
              <span className="font-medium">Human Design readings</span> delivered as digital services.
            </li>
            <li>
              <span className="font-medium">Customized relationship matching systems</span> delivered as digital services.
            </li>
          </ul>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-semibold text-gray-900">Customer support</h2>
          <p className="mt-4 text-gray-700">
            Contact support at{' '}
            <a className="font-medium text-pink-700 underline" href="mailto:support@glowme.io">
              support@glowme.io
            </a>
            .
          </p>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-semibold text-gray-900">Refunds and billing disputes</h2>
          <p className="mt-4 text-gray-700">
            Refunds are available only before the purchased digital product or service has been delivered.
          </p>
          <p className="mt-3 text-gray-700">
            For billing concerns or disputes, contact{' '}
            <a className="font-medium text-pink-700 underline" href="mailto:support@glowme.io">
              support@glowme.io
            </a>{' '}
            so Glow can review and resolve the issue.
          </p>
        </section>

        <section className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Cancellation policy</h2>
            <p className="mt-3 text-gray-700">
              Glow does not currently offer scheduled readings, so no cancellation policy applies at this time.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Returns</h2>
            <p className="mt-3 text-gray-700">
              Glow does not sell physical goods, so no return policy applies.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Restrictions</h2>
            <p className="mt-3 text-gray-700">
              Glow services are available only to individuals age 18 or older.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Promotions</h2>
            <p className="mt-3 text-gray-700">Glow has no active promotions at this time.</p>
            <p className="mt-2 text-gray-700">
              If future promotions are offered, the applicable terms will be stated with the offer.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-pink-100 bg-white/90 px-6 py-6 text-center text-sm text-gray-600">
        <p>Glow · glowme.io · support@glowme.io</p>
      </footer>
    </div>
  );
};

export default LandingPage;
