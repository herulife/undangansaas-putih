import { invitationTemplates } from "@/lib/templates";

export type InvitationStatus = "Published" | "Draft";

export type Invitation = {
  id: string;
  title: string;
  slug: string;
  template: string;
  templateSlug: string;
  status: InvitationStatus;
  views: number;
  rsvp: number;
  date: string;
  groom: string;
  bride: string;
  venue: string;
  city: string;
  akadTime: string;
  receptionTime: string;
  img: string;
};

export const userInvitations: Invitation[] = [
  {
    id: "inv-1",
    title: "Rara & Dimas",
    slug: "rara-dimas",
    template: "Wedding Premium 050",
    templateSlug: "wedding-premium050-pixel-clean",
    status: "Published",
    views: 1240,
    rsvp: 187,
    date: "2026-06-12",
    groom: "Dimas Putra",
    bride: "Rara Wijaya",
    venue: "Hotel Mulia, Jakarta",
    city: "Jakarta",
    akadTime: "08.00 WIB",
    receptionTime: "11.00 WIB",
    img: invitationTemplates[0].img,
  },
  {
    id: "inv-2",
    title: "Nadia & Fajar",
    slug: "nadia-fajar",
    template: "Wedding Premium 050",
    templateSlug: "wedding-premium050-pixel-clean",
    status: "Draft",
    views: 0,
    rsvp: 0,
    date: "2026-07-20",
    groom: "Fajar Pratama",
    bride: "Nadia Kirana",
    venue: "Grand Ballroom",
    city: "Bandung",
    akadTime: "09.00 WIB",
    receptionTime: "10.00 WIB",
    img: invitationTemplates[0].img,
  },
  {
    id: "inv-3",
    title: "Sari & Bagus",
    slug: "sari-bagus",
    template: "Wedding Premium 050",
    templateSlug: "wedding-premium050-pixel-clean",
    status: "Published",
    views: 642,
    rsvp: 89,
    date: "2026-08-01",
    groom: "Bagus Aditya",
    bride: "Sari Dewi",
    venue: "Pangeran Beach Hotel",
    city: "Padang",
    akadTime: "09.00 WIB",
    receptionTime: "12.00 WIB",
    img: invitationTemplates[0].img,
  },
  {
    id: "inv-4",
    title: "Alyssa & Rayhan",
    slug: "alyssa-rayhan",
    template: "Wedding Premium 050",
    templateSlug: "wedding-premium050-pixel-clean",
    status: "Published",
    views: 320,
    rsvp: 41,
    date: "2026-05-20",
    groom: "Rayhan Pradipta",
    bride: "Alyssa Kirana",
    venue: "Pendopo Agung Royal Ambarrukmo",
    city: "Yogyakarta",
    akadTime: "08.00 WIB",
    receptionTime: "11.00 WIB",
    img: invitationTemplates[0].img,
  },
];

export function formatInvitationDate(date: string) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function getTemplateBySlug(slug: string) {
  return invitationTemplates.find((template) => template.slug === slug) ?? invitationTemplates[0];
}
