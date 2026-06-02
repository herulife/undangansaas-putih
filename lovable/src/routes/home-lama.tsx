import { createFileRoute } from "@tanstack/react-router";
import { LegacyHome } from "@/components/site/LegacyHome";

export const Route = createFileRoute("/home-lama")({
  head: () => ({
    meta: [
      { title: "Home Lama - Undanganku" },
      {
        name: "description",
        content: "Landing page lama Undanganku yang disimpan sebagai arsip aktif.",
      },
    ],
  }),
  component: LegacyHome,
});
