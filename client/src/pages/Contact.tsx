import { useState } from "react";
import {
  MessageCircle,
  Mail,
  Send,
  Phone,
  Truck,
  ShieldCheck,
  HeadphonesIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { useContactForm } from "@/hooks/useContactForm";

export default function Contact() {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [message, setMessage] = useState("");

  const { submitting, success, error, submit } = useContactForm();

  const whatsappNumber = "33663284908";
  const contactEmail = "info@97import.com";
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=Bonjour%2C%20je%20souhaite%20obtenir%20des%20informations%20sur%20vos%20produits.`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit({
      name: `${prenom} ${nom}`.trim(),
      email,
      phone: telephone || undefined,
      message,
      source: "contact",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <ScrollToTop />
      <Header />

      {/* Hero Section */}
      <div className="bg-white text-[#4A90D9] py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">Nous Contacter</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Notre équipe est à votre disposition pour répondre à toutes vos questions.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 -mt-8">

        {/* Contact Form + Sidebar */}
        <section className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-12">
          <div className="grid md:grid-cols-3 gap-12">

            {/* Form - 2 columns */}
            <div className="md:col-span-2">
              <h2 className="text-3xl font-bold text-[#4A90D9] mb-8">Envoyez-nous un message</h2>

              {/* Success state */}
              {success ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="bg-green-100 p-5 rounded-full mb-6">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Message envoyé !</h3>
                  <p className="text-gray-600 max-w-md mb-8">
                    Merci pour votre message. Notre équipe vous répondra dans les plus brefs délais,
                    généralement sous 24 à 48 heures.
                  </p>
                  <Button
                    onClick={() => {
                      setNom(""); setPrenom(""); setEmail(""); setTelephone(""); setMessage("");
                    }}
                    variant="outline"
                    className="border-[#4A90D9] text-[#4A90D9] hover:bg-[#4A90D9] hover:text-white"
                  >
                    Envoyer un autre message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">

                  {/* Error banner */}
                  {error && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="nom" className="block text-sm font-semibold text-gray-700 mb-2">
                        Nom
                      </label>
                      <input
                        id="nom"
                        type="text"
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        required
                        disabled={submitting}
                        placeholder="Votre nom"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#4A90D9] focus:ring-2 focus:ring-[#4A90D9]/20 outline-none transition-all text-gray-900 disabled:bg-gray-50 disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label htmlFor="prenom" className="block text-sm font-semibold text-gray-700 mb-2">
                        Prénom
                      </label>
                      <input
                        id="prenom"
                        type="text"
                        value={prenom}
                        onChange={(e) => setPrenom(e.target.value)}
                        required
                        disabled={submitting}
                        placeholder="Votre prénom"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#4A90D9] focus:ring-2 focus:ring-[#4A90D9]/20 outline-none transition-all text-gray-900 disabled:bg-gray-50 disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={submitting}
                        placeholder="votre@email.com"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#4A90D9] focus:ring-2 focus:ring-[#4A90D9]/20 outline-none transition-all text-gray-900 disabled:bg-gray-50 disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label htmlFor="telephone" className="block text-sm font-semibold text-gray-700 mb-2">
                        Téléphone <span className="text-gray-400 font-normal">(optionnel)</span>
                      </label>
                      <input
                        id="telephone"
                        type="tel"
                        value={telephone}
                        onChange={(e) => setTelephone(e.target.value)}
                        disabled={submitting}
                        placeholder="+33 6 00 00 00 00"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#4A90D9] focus:ring-2 focus:ring-[#4A90D9]/20 outline-none transition-all text-gray-900 disabled:bg-gray-50 disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      disabled={submitting}
                      rows={5}
                      placeholder="Décrivez votre projet ou posez-nous vos questions..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#4A90D9] focus:ring-2 focus:ring-[#4A90D9]/20 outline-none transition-all text-gray-900 resize-none disabled:bg-gray-50 disabled:opacity-60"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#4A90D9] hover:bg-[#3a7bc8] text-white font-bold py-6 px-8 text-lg disabled:opacity-70"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Envoi en cours…
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        Envoyer le message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>

            {/* Sidebar - Contact Cards */}
            <div className="space-y-6">

              {/* WhatsApp Card */}
              <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <MessageCircle className="h-6 w-6 text-green-700" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Contact WhatsApp</h3>
                </div>
                <p className="text-gray-600 text-sm mb-2">
                  Réponse rapide par WhatsApp :
                </p>
                <p className="text-gray-900 font-semibold mb-4 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-700" />
                  +33 6 63 28 49 08
                </p>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-5">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Ouvrir WhatsApp
                  </Button>
                </a>
              </div>

              {/* Email Card */}
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Mail className="h-6 w-6 text-[#4A90D9]" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Email</h3>
                </div>
                <p className="text-gray-600 text-sm mb-2">
                  Envoyez-nous un email directement :
                </p>
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-[#4A90D9] font-semibold hover:underline break-all"
                >
                  {contactEmail}
                </a>
              </div>

            </div>
          </div>
        </section>

        {/* Nos Engagements */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#4A90D9] text-center mb-10">Nos Engagements</h2>
          <div className="grid md:grid-cols-3 gap-8">

            {/* Livraison DOM TOM */}
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="bg-blue-100 p-4 rounded-full w-fit mx-auto mb-6">
                <Truck className="h-8 w-8 text-[#4A90D9]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Livraison DOM TOM</h3>
              <p className="text-gray-600">
                Livraison maîtrisée vers les DOM TOM
              </p>
            </div>

            {/* Qualité Certifiée */}
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="bg-blue-100 p-4 rounded-full w-fit mx-auto mb-6">
                <ShieldCheck className="h-8 w-8 text-[#4A90D9]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Qualité Certifiée</h3>
              <p className="text-gray-600">
                Produits rigoureusement sélectionnés
              </p>
            </div>

            {/* SAV Réactif */}
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="bg-blue-100 p-4 rounded-full w-fit mx-auto mb-6">
                <HeadphonesIcon className="h-8 w-8 text-[#4A90D9]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">SAV Réactif</h3>
              <p className="text-gray-600">
                Assistance 24/7 via WhatsApp
              </p>
            </div>

          </div>
        </section>

      </div>

      <Footer />
    </div>
  );
}
