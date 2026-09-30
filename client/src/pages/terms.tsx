import { useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ScrollText } from "lucide-react";
import logoImg from "@assets/logo_1772143671966.png";
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
  s1: string; s2: string; s3: string; s4: string; s5: string; s6: string; s7: string;
  s8: string; s9: string; s10: string; s11: string; s12: string; s13: string; s14: string;
}> = {
  en: {
    title: "Terms of Service",
    updated: "Himal to Horizon · Last updated: March 2026",
    intro: "These Terms of Service (\u201CTerms\u201D) govern your access to and use of the Himal to Horizon flight search and travel planning platform operated at himaltohorizon.com (\u201CService\u201D). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, please do not use the Service.",
    back: "Home",
    privacy_link: "Privacy Policy",
    terms_link: "Terms of Service",
    s1: "1. Acceptance of Terms",
    s2: "2. Description of Service",
    s3: "3. User Accounts",
    s4: "4. Price Alerts & Email Communications",
    s5: "5. Acceptable Use",
    s6: "6. Flight Data Accuracy",
    s7: "7. Intellectual Property",
    s8: "8. Disclaimer of Warranties",
    s9: "9. Limitation of Liability",
    s10: "10. Third-Party Links & Services",
    s11: "11. Modifications to the Service",
    s12: "12. Changes to These Terms",
    s13: "13. Governing Law",
    s14: "14. Contact",
  },
  es: {
    title: "Términos de Servicio",
    updated: "Himal to Horizon · Última actualización: marzo de 2026",
    intro: "Estos Términos de Servicio ('Términos') rigen tu acceso y uso de la plataforma de búsqueda de vuelos y planificación de viajes Himal to Horizon en himaltohorizon.com ('Servicio'). Al acceder o usar el Servicio, aceptas quedar vinculado por estos Términos. Si no estás de acuerdo, por favor no uses el Servicio.",
    back: "Inicio",
    privacy_link: "Política de Privacidad",
    terms_link: "Términos de Servicio",
    s1: "1. Aceptación de los Términos",
    s2: "2. Descripción del Servicio",
    s3: "3. Cuentas de Usuario",
    s4: "4. Alertas de Precios y Comunicaciones por Correo",
    s5: "5. Uso Aceptable",
    s6: "6. Exactitud de los Datos de Vuelo",
    s7: "7. Propiedad Intelectual",
    s8: "8. Renuncia de Garantías",
    s9: "9. Limitación de Responsabilidad",
    s10: "10. Enlances y Servicios de Terceros",
    s11: "11. Modificaciones al Servicio",
    s12: "12. Cambios en estos Términos",
    s13: "13. Ley Aplicable",
    s14: "14. Contacto",
  },
  pt: {
    title: "Termos de Serviço",
    updated: "Himal to Horizon · Última atualização: março de 2026",
    intro: "Estes Termos de Serviço ('Termos') regem seu acesso e uso da plataforma de pesquisa de voos e planejamento de viagens Himal to Horizon em himaltohorizon.com ('Serviço'). Ao acessar ou usar o Serviço, você concorda em ficar vinculado por estes Termos. Se você não concordar, por favor não use o Serviço.",
    back: "Início",
    privacy_link: "Política de Privacidade",
    terms_link: "Termos de Serviço",
    s1: "1. Aceitação dos Termos",
    s2: "2. Descrição do Serviço",
    s3: "3. Contas de Usuário",
    s4: "4. Alertas de Preços e Comunicações por E-mail",
    s5: "5. Uso Aceitável",
    s6: "6. Precisão dos Dados de Voo",
    s7: "7. Propriedade Intelectual",
    s8: "8. Isenção de Garantias",
    s9: "9. Limitação de Responsabilidade",
    s10: "10. Links e Serviços de Terceiros",
    s11: "11. Modificações ao Serviço",
    s12: "12. Alterações nestes Termos",
    s13: "13. Lei Aplicável",
    s14: "14. Contato",
  },
  fr: {
    title: "Conditions d'Utilisation",
    updated: "Himal to Horizon · Dernière mise à jour : mars 2026",
    intro: "Ces Conditions d'Utilisation ('Conditions') régissent votre accès et utilisation de la plateforme de recherche de vols et de planification de voyages Himal to Horizon sur himaltohorizon.com ('Service'). En accédant ou en utilisant le Service, vous acceptez d'être lié par ces Conditions. Si vous n'acceptez pas, veuillez ne pas utiliser le Service.",
    back: "Accueil",
    privacy_link: "Politique de Confidentialité",
    terms_link: "Conditions d'Utilisation",
    s1: "1. Acceptation des conditions",
    s2: "2. Description du service",
    s3: "3. Comptes utilisateurs",
    s4: "4. Alertes de prix et communications par e-mail",
    s5: "5. Utilisation acceptable",
    s6: "6. Exactitude des données de vol",
    s7: "7. Propriété intellectuelle",
    s8: "8. Exclusion de garanties",
    s9: "9. Limitation de responsabilité",
    s10: "10. Liens et services tiers",
    s11: "11. Modifications du service",
    s12: "12. Modifications des présentes conditions",
    s13: "13. Droit applicable",
    s14: "14. Contact",
  },
  ne: {
    title: "सेवाका सर्तहरू",
    updated: "Himal to Horizon · अन्तिम अपडेट: मार्च २०२६",
    intro: "यी सेवाका सर्तहरू ('सर्तहरू') himaltohorizon.com मा Himal to Horizon को उडान खोज र यात्रा योजना प्लेटफर्मको तपाईंको पहुँच र प्रयोगलाई नियन्त्रण गर्छन्। सेवा पहुँच वा प्रयोग गरेर, तपाईं यी सर्तहरूद्वारा बाधित हुन सहमति दिनुहुन्छ।",
    back: "गृहपृष्ठ",
    privacy_link: "गोपनीयता नीति",
    terms_link: "सेवाका सर्तहरू",
    s1: "१. सर्तहरू स्वीकार",
    s2: "२. सेवाको विवरण",
    s3: "३. प्रयोगकर्ता खाताहरू",
    s4: "४. मूल्य अलर्ट र इमेल सञ्चार",
    s5: "५. स्वीकार्य प्रयोग",
    s6: "६. उडान डेटा सटीकता",
    s7: "७. बौद्धिक सम्पत्ति",
    s8: "८. वारेन्टी अस्वीकरण",
    s9: "९. दायित्वको सीमितता",
    s10: "१०. तेस्रो पक्ष लिङ्क र सेवाहरू",
    s11: "११. सेवामा परिमार्जन",
    s12: "१२. यी सर्तहरूमा परिवर्तन",
    s13: "१३. शासन कानून",
    s14: "१४. सम्पर्क",
  },
  ar: {
    title: "شروط الخدمة",
    updated: "Himal to Horizon · آخر تحديث: مارس 2026",
    intro: "تحكم شروط الخدمة هذه ('الشروط') وصولك واستخدامك لمنصة Himal to Horizon للبحث عن رحلات جوية وتخطيط السفر على himaltohorizon.com ('الخدمة'). بالوصول إلى الخدمة أو استخدامها، فإنك توافق على الالتزام بهذه الشروط.",
    back: "الرئيسية",
    privacy_link: "سياسة الخصوصية",
    terms_link: "شروط الخدمة",
    s1: "١. قبول الشروط",
    s2: "٢. وصف الخدمة",
    s3: "٣. حسابات المستخدمين",
    s4: "٤. تنبيهات الأسعار والتواصل عبر البريد الإلكتروني",
    s5: "٥. الاستخدام المقبول",
    s6: "٦. دقة بيانات الرحلات الجوية",
    s7: "٧. الملكية الفكرية",
    s8: "٨. إخلاء مسؤولية الضمانات",
    s9: "٩. تحديد المسؤولية",
    s10: "١٠. روابط وخدمات الطرف الثالث",
    s11: "١١. التعديلات على الخدمة",
    s12: "١٢. التغييرات على هذه الشروط",
    s13: "١٣. القانون الحاكم",
    s14: "١٤. التواصل",
  },
  hi: {
    title: "सेवा की शर्तें",
    updated: "Himal to Horizon · अंतिम अपडेट: मार्च 2026",
    intro: "ये सेवा की शर्तें ('शर्तें') himaltohorizon.com पर Himal to Horizon फ्लाइट सर्च और ट्रैवल प्लानिंग प्लेटफ़ॉर्म ('सेवा') तक आपकी पहुँच और उपयोग को नियंत्रित करती हैं। सेवा का उपयोग करके आप इन शर्तों से सहमत होते हैं।",
    back: "होम",
    privacy_link: "गोपनीयता नीति",
    terms_link: "सेवा की शर्तें",
    s1: "1. शर्तों की स्वीकृति",
    s2: "2. सेवा का विवरण",
    s3: "3. उपयोगकर्ता खाते",
    s4: "4. मूल्य अलर्ट और ईमेल संचार",
    s5: "5. स्वीकार्य उपयोग",
    s6: "6. फ्लाइट डेटा की सटीकता",
    s7: "7. बौद्धिक संपदा",
    s8: "8. वारंटी का अस्वीकरण",
    s9: "9. दायित्व की सीमा",
    s10: "10. तृतीय-पक्ष लिंक और सेवाएं",
    s11: "11. सेवा में संशोधन",
    s12: "12. इन शर्तों में बदलाव",
    s13: "13. शासी कानून",
    s14: "14. संपर्क",
  },
  bn: {
    title: "পরিষেবার শর্তাবলী",
    updated: "Himal to Horizon · সর্বশেষ আপডেট: মার্চ 2026",
    intro: "এই পরিষেবার শর্তাবলী ('শর্তাবলী') himaltohorizon.com-এ Himal to Horizon ফ্লাইট সার্চ ও ট্রাভেল প্ল্যানিং প্ল্যাটফর্ম ('পরিষেবা') অ্যাক্সেস ও ব্যবহার নিয়ন্ত্রণ করে। পরিষেবা ব্যবহার করে আপনি এই শর্তাবলীতে সম্মত হন।",
    back: "হোম",
    privacy_link: "গোপনীয়তা নীতি",
    terms_link: "পরিষেবার শর্তাবলী",
    s1: "১. শর্তাবলী গ্রহণ",
    s2: "২. পরিষেবার বিবরণ",
    s3: "৩. ব্যবহারকারী অ্যাকাউন্ট",
    s4: "৪. মূল্য সতর্কতা ও ইমেল যোগাযোগ",
    s5: "৫. গ্রহণযোগ্য ব্যবহার",
    s6: "৬. ফ্লাইট ডেটার নির্ভুলতা",
    s7: "৭. মেধাস্বত্ব",
    s8: "৮. ওয়ারেন্টি অস্বীকৃতি",
    s9: "৯. দায়বদ্ধতার সীমাবদ্ধতা",
    s10: "১০. তৃতীয় পক্ষের লিঙ্ক ও পরিষেবা",
    s11: "১১. পরিষেবায় পরিবর্তন",
    s12: "১২. এই শর্তাবলীতে পরিবর্তন",
    s13: "১৩. প্রযোজ্য আইন",
    s14: "১৪. যোগাযোগ",
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

export default function TermsPage() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const tx = T[(language as Lang) in T ? (language as Lang) : "en"];

  useEffect(() => {
    setSEO({
      title: "Terms of Service",
      description: "Terms of Service for Himal to Horizon flight search and travel planning platform by Synergy Soul LLC.",
      path: "/terms",
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
            <ScrollText className="w-7 h-7" style={{ color: PEACH }} />
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
            By creating an account or using any part of the Himal to Horizon Service, you confirm that you
            are at least 13 years old, that you have read and understood these Terms, and that you agree to
            be bound by them and our Privacy Policy.
          </p>
        </Section>

        <Section title={tx.s2}>
          <p>
            Himal to Horizon is a flight search and travel planning tool that allows users to search for
            flights, compare prices across flexible dates, set price alerts, and optimise travel schedules.
            We source real-time flight data through the Travelpayouts network and display it for informational purposes.
          </p>
          <p>
            <strong className="text-white">We are not a travel agency.</strong> We do not sell airline
            tickets directly. Booking transactions are completed through third-party platforms (airlines or
            booking agents). We are not a party to any booking contract between you and an airline or agent.
          </p>
        </Section>

        <Section title={tx.s3}>
          <p>
            You may create an account using an email address and password or by signing in with Google. You
            are responsible for maintaining the confidentiality of your account credentials and for all
            activity that occurs under your account.
          </p>
          <p>
            You agree to provide accurate, current, and complete information when registering. We reserve
            the right to suspend or terminate accounts that provide false information or violate these Terms.
          </p>
        </Section>

        <Section title={tx.s4}>
          <p>
            When you enable price tracking for a route, you consent to receive email notifications from
            Himal to Horizon at the email address associated with your account (including your Google
            email address if you signed in via Google). These emails will contain flight price updates for
            the routes you are tracking.
          </p>
          <p>
            You can unsubscribe from price alerts at any time via your profile settings or the unsubscribe
            link in any alert email. Transactional emails (account verification, security notices) cannot
            be opted out of while your account is active.
          </p>
        </Section>

        <Section title={tx.s5}>
          <p>You agree not to:</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
            <li>Attempt to reverse engineer, scrape, or extract data from our platform in bulk</li>
            <li>Interfere with or disrupt the integrity or performance of the Service</li>
            <li>Create multiple accounts for abusive or fraudulent purposes</li>
            <li>Impersonate any person or entity</li>
            <li>Use the Service to distribute spam, malware, or any harmful content</li>
          </ul>
          <p>
            We reserve the right to suspend or terminate access for any user who violates these
            acceptable-use standards without prior notice.
          </p>
        </Section>

        <Section title={tx.s6}>
          <p>
            Flight prices, availability, and schedules are sourced from third-party providers (primarily
            Travelpayouts/Aviasales) and are subject to change without notice. Himal to Horizon makes no guarantee that:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Prices displayed are the final bookable price at time of purchase</li>
            <li>Flights displayed are currently available for booking</li>
            <li>Schedule or route information is free from errors</li>
          </ul>
          <p>
            Always verify prices and availability directly with the airline or booking platform before
            making a purchasing decision. We are not liable for losses arising from reliance on price or
            availability information displayed on our Service.
          </p>
        </Section>

        <Section title={tx.s7}>
          <p>
            The Himal to Horizon name, logo, Stay Optimizer™ trademark, and all original content on the
            Service are the intellectual property of Himal to Horizon and may not be reproduced, distributed,
            or used without our prior written consent.
          </p>
          <p>
            Flight data displayed through the Service is owned by the respective airlines and data providers
            and is used under licence from Travelpayouts.
          </p>
        </Section>

        <Section title={tx.s8}>
          <p>
            The Service is provided <strong className="text-white">"as is"</strong> and{" "}
            <strong className="text-white">"as available"</strong> without warranties of any kind, express or
            implied. We do not warrant that the Service will be uninterrupted, error-free, or completely
            secure. To the fullest extent permitted by applicable law, we disclaim all implied warranties,
            including fitness for a particular purpose and non-infringement.
          </p>
        </Section>

        <Section title={tx.s9}>
          <p>
            To the maximum extent permitted by law, Himal to Horizon and its operators shall not be liable
            for any indirect, incidental, special, consequential, or punitive damages arising from your use
            of the Service, including but not limited to lost travel bookings, missed flights, or reliance
            on inaccurate pricing data.
          </p>
          <p>
            Our total liability to you for any claim arising from these Terms shall not exceed the amount
            you paid us (if any) in the 12 months preceding the claim.
          </p>
        </Section>

        <Section title={tx.s10}>
          <p>
            The Service may contain links to third-party websites or booking platforms. These links are
            provided for convenience only. Himal to Horizon does not endorse and is not responsible for the
            content, policies, or practices of any third-party site. Your interactions with third-party
            services are subject to their own terms and privacy policies.
          </p>
        </Section>

        <Section title={tx.s11}>
          <p>
            We reserve the right to modify, suspend, or discontinue any part of the Service at any time
            without liability. We will endeavour to provide reasonable notice for significant changes. Your
            continued use after such changes constitutes acceptance.
          </p>
        </Section>

        <Section title={tx.s12}>
          <p>
            We may update these Terms from time to time. When we do, we will update the "Last updated" date
            at the top of this page and, where appropriate, notify you by email. Your continued use of the
            Service after any update constitutes your acceptance of the revised Terms.
          </p>
        </Section>

        <Section title={tx.s13}>
          <p>
            These Terms are governed by and construed in accordance with applicable law. Any disputes
            arising under these Terms shall be resolved through good-faith negotiation where possible. If
            resolution cannot be reached, disputes shall be submitted to binding arbitration or the courts
            of competent jurisdiction.
          </p>
        </Section>

        <Section title={tx.s14}>
          <p>If you have questions about these Terms, please contact us:</p>
          <div
            className="mt-3 rounded-xl p-4 text-sm"
            style={{ background: "rgba(247,176,136,0.06)", border: `1px solid ${BORDER}` }}
          >
            <p style={{ color: PEACH }} className="font-semibold mb-1">Himal to Horizon</p>
            <p className="mb-2" style={{ color: "rgba(255,255,255,0.55)" }}>
              Operated by: <span className="text-white font-medium">Synergy Soul LLC</span>
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
          <button type="button" onClick={() => setLocation("/privacy")} style={{ color: "rgba(255,255,255,0.5)" }}>
            {tx.privacy_link}
          </button>
          <span>·</span>
          <button type="button" onClick={() => setLocation("/terms")} style={{ color: PEACH }}>
            {tx.terms_link}
          </button>
        </div>
      </footer>
    </div>
  );
}
