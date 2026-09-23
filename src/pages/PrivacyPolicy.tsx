import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="p-6 md:p-12 bg-zinc-950 text-zinc-100 min-h-screen font-sans">
      <div className="max-w-4xl mx-auto bg-zinc-900 border-4 border-black shadow-[8px_8px_0_0_#000000] p-6 md:p-10 flex flex-col gap-8">
        
        {/* header section */}
        <div className="border-b-4 border-black pb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-lime-500 bg-black px-3 py-1 border border-zinc-700">
              Legal Documentation
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Last Updated: September 2026
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-widest text-white">
            Privacy Policy
          </h1>
          <p className="text-zinc-400 text-sm mt-2">
            How Memoir 3167 collects, uses, and protects your personal data in accordance with privacy principles.
          </p>
        </div>

        {/* content sections */}
        <div className="flex flex-col gap-6 text-sm text-zinc-300 leading-relaxed">
          
          {/* section 1 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white border-l-4 border-lime-500 pl-3">
              1. Project Overview & Data Controller
            </h2>
            <p>
              Memoir 3167 is a multiplayer web application developed for academic purposes at Hive Helsinki (42 Network). 
              This policy explains what information is collected when you create an account, play matches, and use social features. 
              We prioritize data minimization: we only collect the information strictly necessary to run the game and provide multiplayer services.
            </p>
          </section>

          {/* section 2 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white border-l-4 border-lime-500 pl-3">
              2. Information We Collect
            </h2>
            <p>
              We collect the following categories of information when you interact with our service:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-400">
              <li><strong>Account Credentials:</strong> Username, email address, and a cryptographically hashed password (using bcrypt). We never store plaintext passwords.</li>
              <li><strong>Profile Information:</strong> Optional user bio and custom avatar images uploaded to the server.</li>
              <li><strong>Gameplay Records:</strong> Match history including match IDs, opponent usernames, final scores, timestamps, and match outcomes (win, loss, or aborted).</li>
              <li><strong>Social & Communications:</strong> Friend lists, friend request statuses, online presence state, and in-game direct messages exchanged between players.</li>
              <li><strong>Technical Connection Logs:</strong> IP address, browser type, and timestamps recorded by the reverse proxy and server logs for security and debugging.</li>
            </ul>
          </section>

          {/* section 3 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white border-l-4 border-lime-500 pl-3">
              3. Purpose & Legal Basis for Processing
            </h2>
            <p>
              Your data is processed strictly for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-400">
              <li>Authenticating users and issuing session tokens.</li>
              <li>Enabling real-time WebSocket gameplay, matchmaking, and chat messaging.</li>
              <li>Maintaining match history records and player rankings.</li>
              <li>Displaying online/offline status to accepted friends.</li>
              <li>Preventing unauthorized access, botting, and platform abuse.</li>
            </ul>
          </section>

          {/* section 4 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white border-l-4 border-lime-500 pl-3">
              4. Cookies & Local Storage
            </h2>
            <p>
              We do not use advertising, marketing, or third-party tracking cookies. We only use essential technical storage:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-400">
              <li><strong>HttpOnly Session Cookies:</strong> A secure, HttpOnly cookie is issued upon login to enable silent JWT access token renewal via <code className="text-lime-400">/api/renew</code>. This cookie cannot be read by JavaScript, protecting against cross-site scripting (XSS).</li>
              <li><strong>Browser Local Storage:</strong> A short-lived JSON Web Token (JWT) is stored in localStorage to authorize protected API and WebSocket requests.</li>
            </ul>
          </section>

          {/* section 5 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white border-l-4 border-lime-500 pl-3">
              5. Data Sharing & Third Parties
            </h2>
            <p>
              Your data is hosted locally within isolated Docker containers on our deployment server. We do not sell, rent, 
              or transfer personal information to any third parties, advertisers, or external analytics providers.
            </p>
          </section>

          {/* section 6 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white border-l-4 border-lime-500 pl-3">
              6. Your Rights & GDPR Compliance
            </h2>
            <p>
              Under general data protection principles (including GDPR), you retain full control over your personal data:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-400">
              <li><strong>Right to Access:</strong> You can view all stored profile details, active matches, and friends list directly in the application.</li>
              <li><strong>Right to Rectification:</strong> You can edit your bio, email, or avatar at any time via your Profile page.</li>
              <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> You may delete your account at any time. When deleted, your username is anonymized, your email and bio are permanently erased, avatar files are deleted from the disk, and all active sessions are invalidated.</li>
            </ul>
          </section>

          {/* section 7 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white border-l-4 border-lime-500 pl-3">
              7. Security Measures
            </h2>
            <p>
              We implement industry-standard security practices, including TLS/HTTPS encryption via Caddy reverse proxy, 
              asymmetric RSA-signed JWT tokens, bcrypt password hashing, and parameterized database queries to guard against SQL injection.
            </p>
          </section>

        </div>

        {/* footer actions */}
        <div className="border-t-4 border-black pt-6 flex flex-wrap gap-4 items-center justify-between">
          <Link
            to="/terms"
            className="text-xs font-bold uppercase tracking-widest text-lime-400 hover:underline"
          >
            ← View Terms of Service
          </Link>
          <Link
            to="/"
            className="bg-zinc-700 text-white font-bold uppercase tracking-widest px-6 py-2 border-4 border-black shadow-[4px_4px_0_0_#000000] hover:bg-zinc-600 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all text-xs"
          >
            Return to App
          </Link>
        </div>

      </div>
    </div>
  );
}
