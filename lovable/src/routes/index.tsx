import { createFileRoute } from "@tanstack/react-router";
import { FlowLanding } from "@/components/site/FlowLanding";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IndoInvite - Undangan Digital Modern & Eksklusif" },
      {
        name: "description",
        content:
          "Buat undangan digital modern: pilih template, isi data, publish, RSVP, buku tamu, gift, maps, dan share dalam satu link.",
      },
      { property: "og:title", content: "IndoInvite - Undangan Digital Modern" },
      { property: "og:description", content: "Alur undangan digital yang jelas untuk user, admin, dan tamu." },
    ],
  }),
  component: Index,
});

function Index() {
  return <FlowLanding />;
}
