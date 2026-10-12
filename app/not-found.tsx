import Link from "next/link";
export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-extrabold">Stranica nije pronađena</h1>
      <Link href="/" className="btn btn-primary mt-6">Nazad na izbor naloga</Link>
    </main>
  );
}
