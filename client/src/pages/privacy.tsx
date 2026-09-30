import { useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Shield } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { useLanguage } from "@/contexts/language-context";
import { setSEO, resetSEO } from "@/lib/seo";

const PEACH = "#F7B088";
const BG = "hsl(211 60% 8%)";
const CARD = "rgba(255,255,255,0.03)";
const BORDER = "rgba(247,176,136,0.15)";

type Lang = "en" | "es" | "pt" | "fr" | "ne" | "ar" | "hi" | "bn";

const T: Record<Lang, {
  title: string;
  updated: string;
  intro: string;
  back: string;
  privacy_link: string;
  terms_link: string;
  s1: string; s2: string; s3: string; s4: string; s5: string; s6: string;
  s7: string; s8: string; s9: string; s10: string; s11: string;
}> = {
  en: {
    title: "Privacy Policy",
    updated: "Himal to Horizon · Last updated: March 2026",
    intro: "Welcome to Himal to Horizon (\u201Cwe\u201D, \u201Cus\u201D, or \u201Cour\u201D). We are committed to protecting your privacy and handling your personal data with transparency and care. This Privacy Policy explains what information we collect, why we collect it, and how we use it when you use our flight search and travel planning service at himaltohorizon.com.",
    back: "Home",
    privacy_link: "Privacy Policy",
    terms_link: "Terms of Service",
    s1: "1. Information We Collect",
    s2: "2. How We Use Your Email Address",
    s3: "3. Google OAuth Data",
    s4: "4. Cookies & Sessions",
    s5: "5. Data Sharing",
    s6: "6. Data Retention",
    s7: "7. Your Rights",
    s8: "8. Security",
    s9: "9. Children's Privacy",
    s10: "10. Changes to This Policy",
    s11: "11. Contact Us",
  },
  es: {
    title: "Política de Privacidad",
    updated: "Himal to Horizon · Última actualización: marzo de 2026",
    intro: "Bienvenido a Himal to Horizon (\u201Cnosotros\u201D). Estamos comprometidos a proteger tu privacidad y manejar tus datos personales con transparencia y cuidado. Esta Política de Privacidad explica qué información recopilamos, por qué la recopilamos y cómo la utilizamos cuando usas nuestro servicio de búsqueda de vuelos en himaltohorizon.com.",
    back: "Inicio",
    privacy_link: "Política de Privacidad",
    terms_link: "Términos de Servicio",
    s1: "1. Información que Recopilamos",
    s2: "2. Cómo Usamos tu Correo Electrónico",
    s3: "3. Datos de Google OAuth",
    s4: "4. Cookies y Sesiones",
    s5: "5. Compartición de Datos",
    s6: "6. Retención de Datos",
    s7: "7. Tus Derechos",
    s8: "8. Seguridad",
    s9: "9. Privacidad de Menores",
    s10: "10. Cambios en Esta Política",
    s11: "11. Contáctanos",
  },
  pt: {
    title: "Política de Privacidade",
    updated: "Himal to Horizon · Última atualização: março de 2026",
    intro: "Bem-vindo ao Himal to Horizon (\u201Cnós\u201D). Estamos comprometidos em proteger sua privacidade e lidar com seus dados pessoais com transparência e cuidado. Esta Política de Privacidade explica quais informações coletamos, por que as coletamos e como as usamos quando você usa nosso serviço de pesquisa de voos em himaltohorizon.com.",
    back: "Início",
    privacy_link: "Política de Privacidade",
    terms_link: "Termos de Serviço",
    s1: "1. Informações que Coletamos",
    s2: "2. Como Usamos Seu E-mail",
    s3: "3. Dados do Google OAuth",
    s4: "4. Cookies e Sessões",
    s5: "5. Compartilhamento de Dados",
    s6: "6. Retenção de Dados",
    s7: "7. Seus Direitos",
    s8: "8. Segurança",
    s9: "9. Privacidade Infantil",
    s10: "10. Alterações nesta Política",
    s11: "11. Fale Conosco",
  },
  fr: {
    title: "Politique de Confidentialité",
    updated: "Himal to Horizon · Dernière mise à jour : mars 2026",
    intro: "Bienvenue sur Himal to Horizon (\u201Cnous\u201D). Nous nous engageons à protéger votre vie privée et à traiter vos données personnelles avec transparence et soin. Cette Politique de Confidentialité explique quelles informations nous collectons, pourquoi nous les collectons et comment nous les utilisons lorsque vous utilisez notre service de recherche de vols sur himaltohorizon.com.",
    back: "Accueil",
    privacy_link: "Politique de Confidentialité",
    terms_link: "Conditions d'Utilisation",
    s1: "1. Informations que nous collectons",
    s2: "2. Comment nous utilisons votre adresse e-mail",
    s3: "3. Données Google OAuth",
    s4: "4. Cookies et sessions",
    s5: "5. Partage des données",
    s6: "6. Conservation des données",
    s7: "7. Vos droits",
    s8: "8. Sécurité",
    s9: "9. Confidentialité des enfants",
    s10: "10. Modifications de cette politique",
    s11: "11. Nous contacter",
  },
  ne: {
    title: "गोपनीयता नीति",
    updated: "Himal to Horizon · अन्तिम अपडेट: मार्च २०२६",
    intro: "Himal to Horizon मा स्वागत छ। हामी तपाईंको गोपनीयता सुरक्षित गर्न र तपाईंको व्यक्तिगत डेटा पारदर्शिता र ध्यानपूर्वक ह्यान्डल गर्न प्रतिबद्ध छौँ। यो गोपनीयता नीतिले के जानकारी सङ्कलन गर्छौँ, किन सङ्कलन गर्छौँ र himaltohorizon.com मा सेवा प्रयोग गर्दा कसरी प्रयोग गर्छौँ भनी बताउँछ।",
    back: "गृहपृष्ठ",
    privacy_link: "गोपनीयता नीति",
    terms_link: "सेवाका सर्तहरू",
    s1: "१. हामीले सङ्कलन गर्ने जानकारी",
    s2: "२. हामी तपाईंको इमेल कसरी प्रयोग गर्छौँ",
    s3: "३. Google OAuth डेटा",
    s4: "४. कुकिज र सेसनहरू",
    s5: "५. डेटा साझेदारी",
    s6: "६. डेटा प्रतिधारण",
    s7: "७. तपाईंका अधिकारहरू",
    s8: "८. सुरक्षा",
    s9: "९. बालबालिकाको गोपनीयता",
    s10: "१०. यो नीतिमा परिवर्तन",
    s11: "११. हामीलाई सम्पर्क गर्नुहोस्",
  },
  ar: {
    title: "سياسة الخصوصية",
    updated: "Himal to Horizon · آخر تحديث: مارس 2026",
    intro: "مرحباً بك في Himal to Horizon ('نحن'). نحن ملتزمون بحماية خصوصيتك والتعامل مع بياناتك الشخصية بشفافية وعناية. تشرح سياسة الخصوصية هذه المعلومات التي نجمعها، ولماذا نجمعها، وكيف نستخدمها عند استخدامك لخدمة البحث عن رحلات جوية على himaltohorizon.com.",
    back: "الرئيسية",
    privacy_link: "سياسة الخصوصية",
    terms_link: "شروط الخدمة",
    s1: "١. المعلومات التي نجمعها",
    s2: "٢. كيف نستخدم بريدك الإلكتروني",
    s3: "٣. بيانات Google OAuth",
    s4: "٤. ملفات تعريف الارتباط والجلسات",
    s5: "٥. مشاركة البيانات",
    s6: "٦. الاحتفاظ بالبيانات",
    s7: "٧. حقوقك",
    s8: "٨. الأمان",
    s9: "٩. خصوصية الأطفال",
    s10: "١٠. التغييرات على هذه السياسة",
    s11: "١١. اتصل بنا",
  },
  hi: {
    title: "गोपनीयता नीति",
    updated: "Himal to Horizon · अंतिम अपडेट: मार्च 2026",
    intro: "Himal to Horizon में आपका स्वागत है। हम आपकी गोपनीयता की रक्षा करने और आपके व्यक्तिगत डेटा को पारदर्शिता और देखभाल के साथ संभालने के लिए प्रतिबद्ध हैं। यह गोपनीयता नीति बताती है कि हम कौन सी जानकारी एकत्र करते हैं, क्यों करते हैं और आप himaltohorizon.com पर हमारी सेवा का उपयोग करते समय इसे कैसे उपयोग करते हैं।",
    back: "होम",
    privacy_link: "गोपनीयता नीति",
    terms_link: "सेवा की शर्तें",
    s1: "1. हम जो जानकारी एकत्र करते हैं",
    s2: "2. हम आपके ईमेल का उपयोग कैसे करते हैं",
    s3: "3. Google OAuth डेटा",
    s4: "4. कुकीज़ और सेशन",
    s5: "5. डेटा साझाकरण",
    s6: "6. डेटा प्रतिधारण",
    s7: "7. आपके अधिकार",
    s8: "8. सुरक्षा",
    s9: "9. बच्चों की गोपनीयता",
    s10: "10. इस नीति में बदलाव",
    s11: "11. हमसे संपर्क करें",
  },
  bn: {
    title: "গোপনীয়তা নীতি",
    updated: "Himal to Horizon · সর্বশেষ আপডেট: মার্চ 2026",
    intro: "Himal to Horizon-এ স্বাগতম। আমরা আপনার গোপনীয়তা রক্ষা করতে এবং আপনার ব্যক্তিগত তথ্য স্বচ্ছতা ও যত্নের সাথে পরিচালনা করতে প্রতিশ্রুতিবদ্ধ। এই গোপনীয়তা নীতি ব্যাখ্যা করে আমরা কী তথ্য সংগ্রহ করি, কেন করি এবং himaltohorizon.com-এ আমাদের পরিষেবা ব্যবহার করার সময় কীভাবে ব্যবহার করি।",
    back: "হোম",
    privacy_link: "গোপনীয়তা নীতি",
    terms_link: "পরিষেবার শর্তাবলী",
    s1: "১. আমরা যে তথ্য সংগ্রহ করি",
    s2: "২. আমরা আপনার ইমেল কীভাবে ব্যবহার করি",
    s3: "৩. Google OAuth তথ্য",
    s4: "৪. কুকি ও সেশন",
    s5: "৫. তথ্য ভাগাভাগি",
    s6: "৬. তথ্য সংরক্ষণ",
    s7: "৭. আপনার অধিকার",
    s8: "৮. নিরাপত্তা",
    s9: "৯. শিশুদের গোপনীয়তা",
    s10: "১০. এই নীতিতে পরিবর্তন",
    s11: "১১. আমাদের সাথে যোগাযোগ করুন",
  },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2
        className="text-lg font-bold mb-3 pb-2"
        style={{ color: PEACH, borderBottom: `1px solid ${BORDER}` }}
      >
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const tx = T[(language as Lang) in T ? (language as Lang) : "en"];

  useEffect(() => {
    setSEO({
      title: "Privacy Policy",
      description: "How Himal to Horizon collects, uses, and protects your personal information. Read our full privacy policy.",
      path: "/privacy",
    });
    return () => { resetSEO(); };
  }, []);

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <header
        className="sticky top-0 z-40 border-b"
        style={{ background: "hsl(211 60% 8% / 0.95)", borderColor: BORDER, backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: "rgba(255,255,255,0.6)" }}
            aria-label={tx.back}
            data-testid="button-back-home"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 bg-transparent border-0 p-0 cursor-pointer"
          >
            <img src={logoImg} alt="Himal to Horizon" className="w-7 h-7 rounded-full object-cover" />
            <span className="font-bold text-base" style={{ color: PEACH, fontFamily: "var(--font-serif)" }}>
              Himal to Horizon
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
            style={{ background: `${PEACH}18`, border: `1px solid ${PEACH}30` }}
          >
            <Shield className="w-7 h-7" style={{ color: PEACH }} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-serif)" }}>
            {tx.title}
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            {tx.updated}
          </p>
        </div>

        <div
          className="rounded-2xl p-6 mb-10 text-sm leading-relaxed"
          style={{ background: CARD, border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.75)" }}
        >
          {tx.intro.split("himaltohorizon.com").map((part, i, arr) =>
            i < arr.length - 1 ? (
              <span key={i}>
                {part}
                <a href="https://himaltohorizon.com" style={{ color: PEACH }}>himaltohorizon.com</a>
              </span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </div>

        <Section title={tx.s1}>
          <p>
            <strong className="text-white">Account information.</strong> When you create an account using your
            email and password, we collect your email address, name (optional), and a securely hashed version
            of your password. We never store passwords in plain text.
          </p>
          <p>
            <strong className="text-white">Google Sign-In.</strong> If you choose to sign in with Google, we
            receive your Google profile information — specifically your <em>email address</em>,{" "}
            <em>display name</em>, and a unique Google account identifier. We use your email address to
            create and manage your Himal to Horizon account and to send you flight price alerts you have
            opted into. We do not access your Google contacts, calendar, Drive, or any other Google data
            beyond what is needed to authenticate you.
          </p>
          <p>
            <strong className="text-white">Search activity.</strong> We store your flight search history
            locally in your browser. We do not log individual searches on our servers unless you explicitly
            save or track a route.
          </p>
          <p>
            <strong className="text-white">Home airport preference.</strong> If you set a home airport (e.g.,
            MCO), we store it in your profile to pre-populate your search form on future visits.
          </p>
          <p>
            <strong className="text-white">Usage data.</strong> We collect standard server logs (IP address,
            browser type, pages visited) for security monitoring and service improvement. These logs are
            retained for 30 days.
          </p>
        </Section>

        <Section title={tx.s2}>
          <p>Your email address is used for the following purposes only:</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong className="text-white">Account verification.</strong> We send a one-time verification
              link when you create an account to confirm your email address.
            </li>
            <li>
              <strong className="text-white">Price alerts.</strong> If you enable "Track Prices" on a flight
              route, we will send you email notifications when prices drop below your threshold. You can
              disable alerts at any time from your profile or by clicking the unsubscribe link in any alert
              email.
            </li>
            <li>
              <strong className="text-white">Account security.</strong> We may email you if unusual activity
              is detected on your account.
            </li>
          </ul>
          <p>
            We do <strong className="text-white">not</strong> sell your email address to third parties, use it
            for advertising, or share it with marketing platforms.
          </p>
        </Section>

        <Section title={tx.s3}>
          <p>
            When you authenticate via Google, we receive only the minimum data required by the OAuth 2.0
            protocol — your email address, display name, and a Google-assigned user identifier. This data is
            used exclusively to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Create or link your Himal to Horizon account</li>
            <li>Send flight price alert emails to your Google-registered address if you opt in</li>
          </ul>
          <p>
            We request only the <code className="px-1 py-0.5 rounded text-xs" style={{ background: "rgba(255,255,255,0.08)" }}>profile</code>{" "}
            and <code className="px-1 py-0.5 rounded text-xs" style={{ background: "rgba(255,255,255,0.08)" }}>email</code>{" "}
            OAuth scopes. You can revoke our access at any time at{" "}
            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" style={{ color: PEACH }}>
              myaccount.google.com/permissions
            </a>
            .
          </p>
        </Section>

        <Section title={tx.s4}>
          <p>
            We use a single session cookie (<code className="px-1 py-0.5 rounded text-xs" style={{ background: "rgba(255,255,255,0.08)" }}>connect.sid</code>)
            to keep you logged in. This cookie is HTTP-only and expires when you log out or when your
            session ends. We do not use advertising or tracking cookies.
          </p>
        </Section>

        <Section title={tx.s5}>
          <p>We share personal data only in the following limited circumstances:</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong className="text-white">Travelpayouts / Aviasales.</strong> Flight search requests are sent to the Travelpayouts
              network (our flight data provider) to retrieve real-time flight availability and pricing. Travelpayouts
              receives the origin, destination, dates, and passenger count — never your personal account
              details.
            </li>
            <li>
              <strong className="text-white">Resend.</strong> Transactional emails (verification, price
              alerts) are delivered via Resend. Resend receives your email address and message content only.
            </li>
            <li>
              <strong className="text-white">Legal requirements.</strong> We may disclose your data if
              required by law or to protect the rights and safety of our users.
            </li>
          </ul>
        </Section>

        <Section title={tx.s6}>
          <p>
            We retain your account data for as long as your account is active. If you delete your account,
            we will delete your personal data within 30 days. Flight search history stored in your browser
            is under your control and can be cleared at any time.
          </p>
        </Section>

        <Section title={tx.s7}>
          <p>
            Depending on your location, you may have the right to access, correct, or delete your personal
            data, object to or restrict processing, and request data portability. To exercise any of these
            rights, email us at{" "}
            <a href="mailto:hello@himaltohorizon.com" style={{ color: PEACH }}>
              hello@himaltohorizon.com
            </a>
            .
          </p>
        </Section>

        <Section title={tx.s8}>
          <p>
            We protect your data using industry-standard security measures: HTTPS everywhere, bcrypt password
            hashing, HTTP-only session cookies, and PostgreSQL with encrypted connections. While no system is
            completely immune to risk, we take reasonable precautions to safeguard your information.
          </p>
        </Section>

        <Section title={tx.s9}>
          <p>
            Himal to Horizon is not directed to children under 13. We do not knowingly collect personal
            information from children. If you believe we have inadvertently collected such data, please
            contact us and we will delete it promptly.
          </p>
        </Section>

        <Section title={tx.s10}>
          <p>
            We may update this Privacy Policy from time to time. If we make material changes, we will notify
            you via email or a notice on our website before the changes take effect. Continued use of the
            service after the effective date constitutes your acceptance of the updated policy.
          </p>
        </Section>

        <Section title={tx.s11}>
          <p>If you have questions about this Privacy Policy, please reach out:</p>
          <div
            className="mt-3 rounded-xl p-4 text-sm"
            style={{ background: "rgba(247,176,136,0.06)", border: `1px solid ${BORDER}` }}
          >
            <p style={{ color: PEACH }} className="font-semibold mb-1">Himal to Horizon</p>
            <p className="mb-2" style={{ color: "rgba(255,255,255,0.55)" }}>
              Data Controller: <span className="text-white font-medium">Synergy Soul LLC</span>
            </p>
            <p>
              Email:{" "}
              <a href="mailto:hello@himaltohorizon.com" style={{ color: PEACH }}>
                hello@himaltohorizon.com
              </a>
            </p>
            <p>
              Website:{" "}
              <a href="https://himaltohorizon.com" style={{ color: PEACH }}>
                himaltohorizon.com
              </a>
            </p>
          </div>
        </Section>
      </main>

      <footer
        className="border-t mt-8 py-8 text-center text-xs"
        style={{ borderColor: BORDER, color: "rgba(255,255,255,0.35)" }}
      >
        <p>© 2026 Himal to Horizon. All rights reserved. Himal to Horizon is a product of Synergy Soul LLC.</p>
        <div className="flex justify-center gap-4 mt-2">
          <button type="button" onClick={() => setLocation("/privacy")} style={{ color: PEACH }}>
            {tx.privacy_link}
          </button>
          <span>·</span>
          <button type="button" onClick={() => setLocation("/terms")} style={{ color: "rgba(255,255,255,0.5)" }}>
            {tx.terms_link}
          </button>
        </div>
      </footer>
    </div>
  );
}
