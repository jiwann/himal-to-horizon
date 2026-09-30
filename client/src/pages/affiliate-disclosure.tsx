import { useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setSEO, resetSEO } from "@/lib/seo";

type Lang = "en" | "es" | "pt" | "fr" | "ne" | "ar" | "hi" | "bn";

const T: Record<Lang, {
  title: string;
  subtitle: string;
  back: string;
  s1_title: string; s1_body: string;
  s2_title: string; s2_body1: string; s2_body2: string;
  s3_title: string; s3_body1: string; s3_body2: string;
  s4_title: string; s4_body1: string; s4_body2: string;
  s5_title: string; s5_body: string;
  s6_title: string; s6_body: string;
}> = {
  en: {
    title: "Affiliate Disclosure",
    subtitle: "Last updated: March 2026 · himaltohorizon.com",
    back: "Back to Himal to Horizon",
    s1_title: "Our Commitment to Transparency",
    s1_body: "Himal to Horizon (\u201Cwe\u201D, \u201Cus\u201D, or \u201Cour\u201D) is committed to full transparency with our users. This page explains how we earn revenue through affiliate partnerships, and how those partnerships work.",
    s2_title: "What Are Affiliate Links?",
    s2_body1: "Some of the links on himaltohorizon.com are affiliate links. This means that if you click on a link and then purchase a flight or travel product, we may receive a commission from the airline, booking platform, or travel company — at no additional cost to you.",
    s2_body2: "Our affiliate partners include but are not limited to flight price search powered by the Travelpayouts network, including partners such as Aviasales, Kiwi.com, Skyscanner, and others.",
    s3_title: "Does Affiliate Revenue Affect Our Recommendations?",
    s3_body1: "No. The flight results, price predictions, and Horizon's Insights shown on our platform are determined entirely by algorithmic analysis of price data — not by affiliate commission rates. We do not promote specific airlines or routes because of higher commissions.",
    s3_body2: "Our Stay Optimizer™, Price Confidence badges, and Prediction system are designed purely to help you find the best value flight for your journey.",
    s4_title: "Travelpayouts Partnership",
    s4_body1: "We participate in the Travelpayouts affiliate network. When you interact with certain flight search results or follow links on our platform, a tracking pixel or script from Travelpayouts may record your interaction for commission attribution purposes. This is standard practice in the travel industry.",
    s4_body2: "Travelpayouts data collection is governed by their own privacy policy. We encourage you to review it at travelpayouts.com.",
    s5_title: "FTC Compliance",
    s5_body: "In accordance with the U.S. Federal Trade Commission (FTC) guidelines, we disclose that we may earn compensation through affiliate links. This disclosure applies site-wide, including search results, featured flights, and any external links on himaltohorizon.com.",
    s6_title: "Questions?",
    s6_body: "If you have any questions about our affiliate relationships, please contact us at hello@himaltohorizon.com.",
  },
  es: {
    title: "Divulgación de Afiliados",
    subtitle: "Última actualización: marzo de 2026 · himaltohorizon.com",
    back: "Volver a Himal to Horizon",
    s1_title: "Nuestro Compromiso con la Transparencia",
    s1_body: "Himal to Horizon ('nosotros') está comprometido con la transparencia total con nuestros usuarios. Esta página explica cómo generamos ingresos a través de asociaciones de afiliados y cómo funcionan esas asociaciones.",
    s2_title: "¿Qué son los enlaces de afiliados?",
    s2_body1: "Algunos de los enlaces en himaltohorizon.com son enlaces de afiliados. Esto significa que si haces clic en un enlace y luego compras un vuelo o producto de viaje, podemos recibir una comisión de la aerolínea, plataforma de reservas o empresa de viajes — sin costo adicional para ti.",
    s2_body2: "Nuestros socios afiliados incluyen, entre otros, la búsqueda de precios de vuelos impulsada por la red Travelpayouts, incluyendo socios como Aviasales, Kiwi.com, Skyscanner y otros.",
    s3_title: "¿Los ingresos por afiliados afectan nuestras recomendaciones?",
    s3_body1: "No. Los resultados de vuelos, predicciones de precios e Insights de Horizon que se muestran en nuestra plataforma están determinados completamente por el análisis algorítmico de datos de precios, no por las tasas de comisión de afiliados.",
    s3_body2: "Nuestro Stay Optimizer™, las insignias de Confianza en Precios y el sistema de Predicción están diseñados puramente para ayudarte a encontrar el vuelo de mejor valor para tu viaje.",
    s4_title: "Asociación con Travelpayouts",
    s4_body1: "Participamos en la red de afiliados Travelpayouts. Cuando interactúas con ciertos resultados de búsqueda de vuelos o sigues enlaces en nuestra plataforma, un píxel de seguimiento o script de Travelpayouts puede registrar tu interacción para fines de atribución de comisiones.",
    s4_body2: "La recopilación de datos de Travelpayouts se rige por su propia política de privacidad. Te recomendamos revisarla en travelpayouts.com.",
    s5_title: "Cumplimiento de la FTC",
    s5_body: "De acuerdo con las directrices de la Comisión Federal de Comercio (FTC) de EE. UU., divulgamos que podemos ganar compensación a través de enlaces de afiliados. Esta divulgación se aplica en todo el sitio, incluidos los resultados de búsqueda, los vuelos destacados y cualquier enlace externo en himaltohorizon.com.",
    s6_title: "¿Preguntas?",
    s6_body: "Si tienes alguna pregunta sobre nuestras relaciones de afiliados, contáctanos en hello@himaltohorizon.com.",
  },
  pt: {
    title: "Divulgação de Afiliados",
    subtitle: "Última atualização: março de 2026 · himaltohorizon.com",
    back: "Voltar ao Himal to Horizon",
    s1_title: "Nosso Compromisso com a Transparência",
    s1_body: "Himal to Horizon ('nós') está comprometido com total transparência com nossos usuários. Esta página explica como geramos receita por meio de parcerias de afiliados e como essas parcerias funcionam.",
    s2_title: "O que são links de afiliados?",
    s2_body1: "Alguns dos links no himaltohorizon.com são links de afiliados. Isso significa que se você clicar em um link e depois comprar um voo ou produto de viagem, podemos receber uma comissão da companhia aérea, plataforma de reservas ou empresa de viagens — sem custo adicional para você.",
    s2_body2: "Nossos parceiros afiliados incluem, entre outros, pesquisa de preços de voos impulsada pela rede Travelpayouts, incluindo parceiros como Aviasales, Kiwi.com, Skyscanner e outros.",
    s3_title: "A receita de afiliados afeta nossas recomendações?",
    s3_body1: "Não. Os resultados de voos, previsões de preços e Horizon's Insights exibidos em nossa plataforma são determinados inteiramente pela análise algorítmica de dados de preços — não pelas taxas de comissão de afiliados.",
    s3_body2: "Nosso Stay Optimizer™, selos de Confiança de Preço e sistema de Previsão são projetados puramente para ajudá-lo a encontrar o voo de melhor valor para sua viagem.",
    s4_title: "Parceria com Travelpayouts",
    s4_body1: "Participamos da rede de afiliados Travelpayouts. Quando você interage com certos resultados de pesquisa de voos ou segue links em nossa plataforma, um pixel de rastreamento ou script da Travelpayouts pode registrar sua interação para fins de atribuição de comissões.",
    s4_body2: "A coleta de dados da Travelpayouts é regida por sua própria política de privacidade. Incentivamos você a revisá-la em travelpayouts.com.",
    s5_title: "Conformidade com a FTC",
    s5_body: "Em conformidade com as diretrizes da Comissão Federal de Comércio dos EUA (FTC), divulgamos que podemos ganhar compensação por meio de links de afiliados. Esta divulgação se aplica em todo o site, incluindo resultados de pesquisa, voos em destaque e quaisquer links externos em himaltohorizon.com.",
    s6_title: "Dúvidas?",
    s6_body: "Se você tiver alguma dúvida sobre nossas relações de afiliados, entre em contato conosco em hello@himaltohorizon.com.",
  },
  fr: {
    title: "Divulgation des Affiliations",
    subtitle: "Dernière mise à jour : mars 2026 · himaltohorizon.com",
    back: "Retour à Himal to Horizon",
    s1_title: "Notre engagement envers la transparence",
    s1_body: "Himal to Horizon ('nous') s'engage à être totalement transparent avec nos utilisateurs. Cette page explique comment nous générons des revenus grâce à des partenariats d'affiliation et comment ces partenariats fonctionnent.",
    s2_title: "Que sont les liens d'affiliation ?",
    s2_body1: "Certains des liens sur himaltohorizon.com sont des liens d'affiliation. Cela signifie que si vous cliquez sur un lien et achetez ensuite un vol ou un produit de voyage, nous pouvons recevoir une commission de la compagnie aérienne, de la plateforme de réservation ou de la société de voyage — sans frais supplémentaires pour vous.",
    s2_body2: "Nos partenaires affiliés comprennent notamment la recherche de prix de vols propulsée par le réseau Travelpayouts, incluant des partenaires tels qu'Aviasales, Kiwi.com, Skyscanner et d'autres.",
    s3_title: "Les revenus d'affiliation affectent-ils nos recommandations ?",
    s3_body1: "Non. Les résultats de vols, les prédictions de prix et les Insights de Horizon affichés sur notre plateforme sont déterminés entièrement par l'analyse algorithmique des données de prix — et non par les taux de commission d'affiliation.",
    s3_body2: "Notre Stay Optimizer™, les badges de Confiance des Prix et le système de Prédiction sont conçus uniquement pour vous aider à trouver le vol au meilleur rapport qualité-prix.",
    s4_title: "Partenariat Travelpayouts",
    s4_body1: "Nous participons au réseau d'affiliation Travelpayouts. Lorsque vous interagissez avec certains résultats de recherche de vols ou suivez des liens sur notre plateforme, un pixel de suivi ou un script de Travelpayouts peut enregistrer votre interaction à des fins d'attribution de commissions.",
    s4_body2: "La collecte de données de Travelpayouts est régie par leur propre politique de confidentialité. Nous vous encourageons à la consulter sur travelpayouts.com.",
    s5_title: "Conformité FTC",
    s5_body: "Conformément aux directives de la Commission fédérale du commerce américaine (FTC), nous divulguons que nous pouvons percevoir une rémunération via des liens d'affiliation. Cette divulgation s'applique à l'ensemble du site, y compris les résultats de recherche, les vols mis en avant et tous les liens externes sur himaltohorizon.com.",
    s6_title: "Des questions ?",
    s6_body: "Si vous avez des questions sur nos relations d'affiliation, veuillez nous contacter à hello@himaltohorizon.com.",
  },
  ne: {
    title: "सम्बद्ध प्रकटीकरण",
    subtitle: "अन्तिम अपडेट: मार्च २०२६ · himaltohorizon.com",
    back: "Himal to Horizon मा फर्कनुहोस्",
    s1_title: "पारदर्शितामा हाम्रो प्रतिबद्धता",
    s1_body: "Himal to Horizon हाम्रा प्रयोगकर्ताहरूसँग पूर्ण पारदर्शितामा प्रतिबद्ध छ। यो पृष्ठले हामी सहयोगी साझेदारीमार्फत कसरी राजस्व आर्जन गर्छौँ र ती साझेदारीहरू कसरी काम गर्छन् भनी बताउँछ।",
    s2_title: "सहयोगी लिङ्कहरू के हुन्?",
    s2_body1: "himaltohorizon.com मा केही लिङ्कहरू सहयोगी लिङ्कहरू हुन्। यसको अर्थ यदि तपाईंले लिङ्कमा क्लिक गरेर उडान वा यात्रा उत्पाद खरीद गर्नुभयो भने, हामीले एयरलाइन, बुकिङ प्लेटफर्म, वा यात्रा कम्पनीबाट कमिसन प्राप्त गर्न सक्छौँ — तपाईंलाई कुनै थप लागत बिना।",
    s2_body2: "हाम्रा सहयोगी साझेदारहरूमा Travelpayouts नेटवर्क द्वारा संचालित उडान मूल्य खोज, साथै Aviasales, Kiwi.com, Skyscanner र अन्य सहभागी साझेदारहरू समावेश छन्।",
    s3_title: "के सहयोगी राजस्वले हाम्रा सिफारिसहरूलाई असर गर्छ?",
    s3_body1: "होइन। हाम्रो प्लेटफर्ममा देखाइने उडान परिणामहरू, मूल्य भविष्यवाणीहरू र Horizon's Insights पूर्ण रूपमा मूल्य डेटाको एल्गोरिदमिक विश्लेषणद्वारा निर्धारित गरिन्छन् — सहयोगी कमिसन दरहरूद्वारा होइन।",
    s3_body2: "हाम्रो Stay Optimizer™, मूल्य विश्वास ब्याजहरू र भविष्यवाणी प्रणाली तपाईंको यात्राको लागि सर्वोत्तम मूल्य उडान फेला पार्न मद्दत गर्न मात्र डिजाइन गरिएको हो।",
    s4_title: "Travelpayouts साझेदारी",
    s4_body1: "हामी Travelpayouts सहयोगी नेटवर्कमा भाग लिन्छौँ। जब तपाईंले हाम्रो प्लेटफर्ममा केही उडान खोज परिणामहरूसँग अन्तरक्रिया गर्नुहुन्छ, Travelpayouts को ट्र्याकिङ पिक्सेल वा स्क्रिप्टले कमिसन श्रेय उद्देश्यका लागि तपाईंको अन्तरक्रिया रेकर्ड गर्न सक्छ।",
    s4_body2: "Travelpayouts डेटा सङ्कलन तिनको आफ्नै गोपनीयता नीतिद्वारा शासित छ। हामी तपाईंलाई travelpayouts.com मा यसलाई समीक्षा गर्न प्रोत्साहित गर्छौँ।",
    s5_title: "FTC अनुपालन",
    s5_body: "अमेरिकी संघीय व्यापार आयोग (FTC) दिशानिर्देशहरू अनुसार, हामी प्रकट गर्छौँ कि हामी सहयोगी लिङ्कहरूमार्फत क्षतिपूर्ति कमाउन सक्छौँ। यो प्रकटीकरण himaltohorizon.com मा खोज परिणामहरू, विशेष उडानहरू र कुनै पनि बाह्य लिङ्कहरू सहित सम्पूर्ण साइटमा लागु हुन्छ।",
    s6_title: "प्रश्नहरू?",
    s6_body: "यदि तपाईंलाई हाम्रो सहयोगी सम्बन्धहरूबारे कुनै प्रश्न छ भने, कृपया hello@himaltohorizon.com मा सम्पर्क गर्नुहोस्।",
  },
  ar: {
    title: "الإفصاح عن الانتساب",
    subtitle: "آخر تحديث: مارس 2026 · himaltohorizon.com",
    back: "العودة إلى Himal to Horizon",
    s1_title: "التزامنا بالشفافية",
    s1_body: "تلتزم Himal to Horizon بالشفافية الكاملة مع مستخدمينا. تشرح هذه الصفحة كيف نكسب إيرادات من خلال شراكات الانتساب وكيف تعمل هذه الشراكات.",
    s2_title: "ما هي روابط الانتساب؟",
    s2_body1: "بعض الروابط على himaltohorizon.com هي روابط انتساب. هذا يعني أنه إذا نقرت على رابط ثم اشتريت رحلة جوية أو منتج سفر، فقد نتلقى عمولة من شركة الطيران أو منصة الحجز أو شركة السفر — دون أي تكلفة إضافية عليك.",
    s2_body2: "يشمل شركاؤنا في الانتساب بحث أسعار الرحلات الجوية المدعوم من شبكة Travelpayouts، بما في ذلك شركاء مثل Aviasales وKiwi.com وSkyscanner وغيرها.",
    s3_title: "هل تؤثر إيرادات الانتساب على توصياتنا؟",
    s3_body1: "لا. نتائج الرحلات الجوية وتوقعات الأسعار ورؤى Horizon المعروضة على منصتنا تحددها بالكامل التحليلات الخوارزمية لبيانات الأسعار — وليس معدلات عمولات الانتساب.",
    s3_body2: "تم تصميم Stay Optimizer™ وشارات ثقة الأسعار ونظام التنبؤ لدينا بحتاً لمساعدتك في العثور على رحلة جوية بأفضل قيمة لرحلتك.",
    s4_title: "شراكة Travelpayouts",
    s4_body1: "نشارك في شبكة الانتساب Travelpayouts. عند تفاعلك مع نتائج بحث معينة أو اتباع روابط على منصتنا، قد يسجل بكسل التتبع أو نص Travelpayouts تفاعلك لأغراض إسناد العمولة.",
    s4_body2: "يخضع جمع بيانات Travelpayouts لسياسة الخصوصية الخاصة بها. نشجعك على مراجعتها على travelpayouts.com.",
    s5_title: "الامتثال لـ FTC",
    s5_body: "وفقاً لإرشادات لجنة التجارة الفيدرالية الأمريكية (FTC)، نفصح عن أننا قد نحصل على تعويض من خلال روابط الانتساب. ينطبق هذا الإفصاح على جميع أنحاء الموقع، بما في ذلك نتائج البحث والرحلات المميزة وأي روابط خارجية على himaltohorizon.com.",
    s6_title: "أسئلة؟",
    s6_body: "إذا كان لديك أي أسئلة حول علاقاتنا بالانتساب، فيرجى التواصل معنا على hello@himaltohorizon.com.",
  },
  hi: {
    title: "एफिलिएट प्रकटीकरण",
    subtitle: "अंतिम अपडेट: मार्च 2026 · himaltohorizon.com",
    back: "Himal to Horizon पर वापस जाएं",
    s1_title: "पारदर्शिता के प्रति हमारी प्रतिबद्धता",
    s1_body: "Himal to Horizon हमारे उपयोगकर्ताओं के साथ पूर्ण पारदर्शिता के लिए प्रतिबद्ध है। यह पृष्ठ बताता है कि हम एफिलिएट पार्टनरशिप के माध्यम से राजस्व कैसे अर्जित करते हैं और ये पार्टनरशिप कैसे काम करती हैं।",
    s2_title: "एफिलिएट लिंक क्या हैं?",
    s2_body1: "himaltohorizon.com पर कुछ लिंक एफिलिएट लिंक हैं। इसका मतलब है कि यदि आप किसी लिंक पर क्लिक करके फ्लाइट या ट्रैवल प्रोडक्ट खरीदते हैं, तो हम एयरलाइन, बुकिंग प्लेटफ़ॉर्म या ट्रैवल कंपनी से कमीशन प्राप्त कर सकते हैं — आपको कोई अतिरिक्त लागत नहीं।",
    s2_body2: "हमारे एफिलिएट पार्टनर्स में Travelpayouts नेटवर्क द्वारा संचालित फ्लाइट मूल्य खोज, तथा Aviasales, Kiwi.com, Skyscanner और अन्य सहयोगी पार्टनर शामिल हैं।",
    s3_title: "क्या एफिलिएट राजस्व हमारी सिफारिशों को प्रभावित करता है?",
    s3_body1: "नहीं। हमारे प्लेटफ़ॉर्म पर दिखाए गए फ्लाइट परिणाम, मूल्य पूर्वानुमान और Horizon's Insights पूरी तरह से मूल्य डेटा के एल्गोरिदमिक विश्लेषण द्वारा निर्धारित होते हैं — एफिलिएट कमीशन दरों द्वारा नहीं।",
    s3_body2: "हमारा Stay Optimizer™, प्राइस कॉन्फिडेंस बैज और प्रेडिक्शन सिस्टम केवल आपकी यात्रा के लिए सबसे अच्छे मूल्य वाली फ्लाइट खोजने में मदद करने के लिए डिज़ाइन किए गए हैं।",
    s4_title: "Travelpayouts पार्टनरशिप",
    s4_body1: "हम Travelpayouts एफिलिएट नेटवर्क में भाग लेते हैं। जब आप हमारे प्लेटफ़ॉर्म पर कुछ फ्लाइट खोज परिणामों के साथ इंटरैक्ट करते हैं, तो Travelpayouts का ट्रैकिंग पिक्सेल या स्क्रिप्ट कमीशन एट्रिब्यूशन के लिए आपके इंटरैक्शन को रिकॉर्ड कर सकता है।",
    s4_body2: "Travelpayouts का डेटा संग्रह उनकी अपनी गोपनीयता नीति द्वारा नियंत्रित होता है। हम आपको travelpayouts.com पर इसकी समीक्षा करने के लिए प्रोत्साहित करते हैं।",
    s5_title: "FTC अनुपालन",
    s5_body: "अमेरिकी फेडरल ट्रेड कमीशन (FTC) के दिशानिर्देशों के अनुसार, हम घोषित करते हैं कि हम एफिलिएट लिंक के माध्यम से मुआवजा अर्जित कर सकते हैं। यह प्रकटीकरण himaltohorizon.com पर खोज परिणामों, विशेष फ्लाइट और किसी भी बाहरी लिंक सहित पूरी साइट पर लागू होता है।",
    s6_title: "सवाल हैं?",
    s6_body: "यदि आपके पास हमारे एफिलिएट संबंधों के बारे में कोई प्रश्न है, तो कृपया hello@himaltohorizon.com पर हमसे संपर्क करें।",
  },
  bn: {
    title: "অ্যাফিলিয়েট প্রকাশ",
    subtitle: "সর্বশেষ আপডেট: মার্চ 2026 · himaltohorizon.com",
    back: "Himal to Horizon-এ ফিরুন",
    s1_title: "স্বচ্ছতার প্রতি আমাদের অঙ্গীকার",
    s1_body: "Himal to Horizon আমাদের ব্যবহারকারীদের সাথে সম্পূর্ণ স্বচ্ছতার প্রতি প্রতিশ্রুতিবদ্ধ। এই পৃষ্ঠাটি ব্যাখ্যা করে যে আমরা অ্যাফিলিয়েট অংশীদারিত্বের মাধ্যমে কীভাবে রাজস্ব অর্জন করি এবং সেই অংশীদারিত্বগুলি কীভাবে কাজ করে।",
    s2_title: "অ্যাফিলিয়েট লিঙ্ক কী?",
    s2_body1: "himaltohorizon.com-এর কিছু লিঙ্ক অ্যাফিলিয়েট লিঙ্ক। এর মানে হল যদি আপনি একটি লিঙ্কে ক্লিক করে ফ্লাইট বা ভ্রমণ পণ্য কিনেন, আমরা এয়ারলাইন, বুকিং প্ল্যাটফর্ম বা ভ্রমণ কোম্পানির কাছ থেকে কমিশন পেতে পারি — আপনার কোনো অতিরিক্ত খরচ ছাড়াই।",
    s2_body2: "আমাদের অ্যাফিলিয়েট অংশীদারদের মধ্যে Travelpayouts নেটওয়ার্ক-চালিত ফ্লাইট মূল্য অনুসন্ধান অন্তর্ভুক্ত, যার মধ্যে Aviasales, Kiwi.com, Skyscanner এবং অন্যান্য অংশীদার রয়েছে।",
    s3_title: "অ্যাফিলিয়েট রাজস্ব কি আমাদের সুপারিশকে প্রভাবিত করে?",
    s3_body1: "না। আমাদের প্ল্যাটফর্মে দেখানো ফ্লাইট ফলাফল, মূল্য পূর্বাভাস এবং Horizon's Insights সম্পূর্ণভাবে মূল্য ডেটার অ্যালগরিদমিক বিশ্লেষণ দ্বারা নির্ধারিত — অ্যাফিলিয়েট কমিশন রেট দ্বারা নয়।",
    s3_body2: "আমাদের Stay Optimizer™, Price Confidence ব্যাজ এবং Prediction সিস্টেম শুধুমাত্র আপনার যাত্রার জন্য সেরা মূল্যের ফ্লাইট খুঁজে পেতে সাহায্য করার জন্য ডিজাইন করা হয়েছে।",
    s4_title: "Travelpayouts অংশীদারিত্ব",
    s4_body1: "আমরা Travelpayouts অ্যাফিলিয়েট নেটওয়ার্কে অংশগ্রহণ করি। যখন আপনি আমাদের প্ল্যাটফর্মে নির্দিষ্ট ফ্লাইট অনুসন্ধান ফলাফলের সাথে ইন্টারঅ্যাক্ট করেন, Travelpayouts-এর একটি ট্র্যাকিং পিক্সেল বা স্ক্রিপ্ট কমিশন অ্যাট্রিবিউশনের উদ্দেশ্যে আপনার ইন্টারঅ্যাকশন রেকর্ড করতে পারে।",
    s4_body2: "Travelpayouts ডেটা সংগ্রহ তাদের নিজস্ব গোপনীয়তা নীতি দ্বারা পরিচালিত। আমরা আপনাকে travelpayouts.com-এ এটি পর্যালোচনা করতে উৎসাহিত করি।",
    s5_title: "FTC সম্মতি",
    s5_body: "মার্কিন ফেডারেল ট্রেড কমিশন (FTC) নির্দেশিকা অনুযায়ী, আমরা প্রকাশ করছি যে আমরা অ্যাফিলিয়েট লিঙ্কের মাধ্যমে ক্ষতিপূরণ অর্জন করতে পারি। এই প্রকাশ himaltohorizon.com-এ অনুসন্ধান ফলাফল, বৈশিষ্ট্যযুক্ত ফ্লাইট এবং যেকোনো বাহ্যিক লিঙ্ক সহ সাইটজুড়ে প্রযোজ্য।",
    s6_title: "প্রশ্ন আছে?",
    s6_body: "আমাদের অ্যাফিলিয়েট সম্পর্ক সম্পর্কে আপনার যদি কোনো প্রশ্ন থাকে, অনুগ্রহ করে hello@himaltohorizon.com-এ আমাদের সাথে যোগাযোগ করুন।",
  },
};

export default function AffiliateDisclosurePage() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const tx = T[(language as Lang) in T ? (language as Lang) : "en"];

  useEffect(() => {
    setSEO({
      title: "Affiliate Disclosure",
      description: "How Himal to Horizon earns revenue through affiliate partnerships. Full transparency on our partner relationships.",
      path: "/affiliate-disclosure",
    });
    return () => { resetSEO(); };
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "hsl(211 60% 8%)" }}>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="mb-8 gap-2"
          data-testid="back-home"
        >
          <ArrowLeft className="h-4 w-4" />
          {tx.back}
        </Button>

        <div className="space-y-8">
          <div>
            <h1
              className="text-3xl font-bold mb-2"
              style={{ fontFamily: "var(--font-serif)", color: "hsl(22 79% 75%)" }}
            >
              {tx.title}
            </h1>
            <p className="text-sm text-muted-foreground">{tx.subtitle}</p>
          </div>

          <div className="space-y-6 text-sm leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.85)" }}>
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">{tx.s1_title}</h2>
              <p>{tx.s1_body}</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">{tx.s2_title}</h2>
              <p>{tx.s2_body1.replace("no additional cost to you", "<strong>no additional cost to you</strong>")}</p>
              <p>{tx.s2_body2}</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">{tx.s3_title}</h2>
              <p>{tx.s3_body1}</p>
              <p>{tx.s3_body2}</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">{tx.s4_title}</h2>
              <p>{tx.s4_body1}</p>
              <p>
                {tx.s4_body2.split("travelpayouts.com").map((part, i, arr) =>
                  i < arr.length - 1 ? (
                    <span key={i}>
                      {part}
                      <span style={{ color: "#F7B088" }}>travelpayouts.com</span>
                    </span>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )}
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">{tx.s5_title}</h2>
              <p>{tx.s5_body}</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">{tx.s6_title}</h2>
              <p>
                {tx.s6_body.split("hello@himaltohorizon.com").map((part, i, arr) =>
                  i < arr.length - 1 ? (
                    <span key={i}>
                      {part}
                      <span style={{ color: "#F7B088" }}>hello@himaltohorizon.com</span>
                    </span>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )}
              </p>
            </section>
          </div>

          <div className="pt-6 border-t border-border/40">
            <p className="text-xs text-muted-foreground text-center">
              © Himal to Horizon · himaltohorizon.com · <em>A Himal to Horizon Project.</em>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
