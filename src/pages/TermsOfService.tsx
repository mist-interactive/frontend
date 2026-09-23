import { Link } from 'react-router-dom';

export default function TermsOfService() {
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
            Terms of Service
          </h1>
          <p className="text-zinc-400 text-sm mt-2">
            Please read these terms carefully before participating in matches or using Memoir 3167.
          </p>
        </div>

        {/* content sections */}
        <div className="flex flex-col gap-6 text-sm text-zinc-300 leading-relaxed">
          
          {/* section 1 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white border-l-4 border-lime-500 pl-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing the Memoir 3167 platform, creating a user account, or participating in matches, 
              you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, 
              you may not access or use the platform. This application is an educational multiplayer gaming system 
              developed as part of the 42 Network / Hive Helsinki curriculum.
            </p>
          </section>

          {/* section 2 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white border-l-4 border-lime-500 pl-3">
              2. User Accounts & Security
            </h2>
            <p>
              To access multiplayer matchmaking and social features, users must register an account with a unique 
              username, email address, and secure password. You are solely responsible for maintaining the confidentiality 
              of your login credentials and for all activities conducted under your account.
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-400">
              <li>You may not register multiple accounts to manipulate matchmaking ratings or match statistics.</li>
              <li>You must notify platform administrators immediately if you suspect unauthorized access to your account.</li>
              <li>Impersonation of other players or staff is strictly prohibited.</li>
            </ul>
          </section>

          {/* section 3 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white border-l-4 border-lime-500 pl-3">
              3. Fair Play, Matchmaking & Conduct
            </h2>
            <p>
              Memoir 3167 relies on real-time WebSocket communication for competitive gameplay. Players must adhere 
              to fair competition standards:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-400">
              <li><strong>Cheating & Exploits:</strong> Use of bots, automated scripts, packet injection, or network tampering is grounds for permanent suspension.</li>
              <li><strong>Disconnections & Forfeits:</strong> Intentionally disconnecting from an active match results in match abandonment, forfeiting the game and granting the win to your opponent.</li>
              <li><strong>Communication:</strong> The chat service must not be used for harassment, hate speech, spam, or threatening behavior toward other players.</li>
            </ul>
          </section>

          {/* section 4 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white border-l-4 border-lime-500 pl-3">
              4. User Content & Avatars
            </h2>
            <p>
              Users may upload custom avatar images (PNG, JPEG, GIF up to 2 MB) and provide a personal bio. 
              By uploading content, you certify that you own the rights to the material or have obtained proper permission. 
              Content that contains explicit, unlawful, defamatory, or copyright-infringing material will be removed without notice.
            </p>
          </section>

          {/* section 5 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white border-l-4 border-lime-500 pl-3">
              5. Service Availability & Modifications
            </h2>
            <p>
              The platform is provided on an "as is" and "as available" basis. While we strive to maintain uninterrupted 
              service, we do not guarantee continuous availability of the game server or real-time hub. Features, matchmaking 
              algorithms, and gameplay mechanics may be updated or modified at any time to support ongoing development.
            </p>
          </section>

          {/* section 6 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white border-l-4 border-lime-500 pl-3">
              6. Account Deletion & Termination
            </h2>
            <p>
              You have the right to terminate your account at any time via your Profile settings. Terminating your account 
              permanently anonymizes your user credentials, clears session tokens, removes uploaded avatars, and marks 
              your profile as deleted while retaining historic match results for statistics integrity.
            </p>
          </section>

          {/* section 7 */}
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white border-l-4 border-lime-500 pl-3">
              7. Academic Disclaimer & Limitation of Liability
            </h2>
            <p>
              Memoir 3167 is a non-commercial, student-built software project. In no event shall the authors or Hive Helsinki 
              be held liable for any damages arising out of the use or inability to use this service.
            </p>
          </section>

        </div>

        {/* footer actions */}
        <div className="border-t-4 border-black pt-6 flex flex-wrap gap-4 items-center justify-between">
          <Link
            to="/privacy"
            className="text-xs font-bold uppercase tracking-widest text-lime-400 hover:underline"
          >
            View Privacy Policy →
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
