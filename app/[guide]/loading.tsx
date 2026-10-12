export default function Loading() {
  return (
    <div className="app-shell" aria-busy="true">
      <div className="flex-none border-b border-line bg-ink/80 px-4 py-3"><div className="skeleton mx-auto h-11 max-w-3xl" /></div>
      <div className="mx-auto w-full max-w-3xl flex-1 space-y-4 px-4 pt-6">
        <div className="skeleton h-9 w-2/3" /><div className="skeleton h-24 w-full" /><div className="skeleton h-28 w-full" /><div className="skeleton h-28 w-full" />
      </div>
    </div>
  );
}
