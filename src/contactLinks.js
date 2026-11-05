// Click-to-chat and email links for project inquiries. Both open an external
// application; nothing is sent until the visitor sends it there.
export const WHATSAPP_NUMBER = "6281310083944";
export const CONTACT_EMAIL = "harits.achmad2003@gmail.com";

export const whatsappUrl = (message) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export const mailtoUrl = (subject, body) =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
