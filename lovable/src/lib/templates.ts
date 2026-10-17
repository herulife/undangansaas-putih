import premium050 from "@/assets/template-previews/wedding-premium050-pixel-clean.webp";

export type InvitationTemplate = {
  id: number;
  slug: string;
  name: string;
  category: string;
  tier: "Free" | "Creator" | "Pro";
  tag: string;
  status: "Published" | "Draft";
  uses: number;
  img: string;
  previewUrl: string;
};

export const invitationTemplates: InvitationTemplate[] = [
  { id: 1, slug: "wedding-premium050-pixel-clean", name: "Wedding Premium 050", category: "Wedding", tier: "Pro", tag: "Floral", status: "Published", uses: 940, img: premium050, previewUrl: "/templates/wedding-premium050-pixel-clean/index.html" },
];
