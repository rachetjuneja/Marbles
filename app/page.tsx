import CustomerForm from "@/components/CustomerForm";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-9 h-9 rounded-lg"
            style={{ background: "radial-gradient(120% 120% at 30% 20%,#e9d6ac,#c9a25e 45%,#8a6a2f)" }}
          />
          <div>
            <div className="font-semibold">The Sales OS</div>
            <div className="text-[11px] tracking-[0.16em] uppercase text-muted">Marble Visualiser</div>
          </div>
        </div>

        <h1 className="font-display text-3xl mb-2">New visualisation</h1>
        <p className="text-muted text-sm mb-7">
          Start by capturing the customer. Every render is saved to their project, the seed of the quote
          and the follow up.
        </p>

        <CustomerForm />
      </div>
    </main>
  );
}
