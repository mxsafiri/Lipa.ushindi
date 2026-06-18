export default function StatusBar({ dark = true }: { dark?: boolean }) {
  const color = dark ? "#fff" : "#16261B";
  return (
    <div
      className="flex justify-between items-center px-7 pt-[17px]"
      style={{ color }}
    >
      <span className="text-[14px] font-bold">9:41</span>
      <div className="flex items-center gap-2">
        <span className="text-[11.5px] font-bold tracking-[.06em]">5G</span>
        <div
          className="w-[23px] h-3 rounded-[3.5px] p-[1.6px]"
          style={{ border: `1.6px solid ${dark ? "rgba(255,255,255,.85)" : "rgba(22,38,27,.55)"}` }}
        >
          <div
            className="h-full rounded-[1.5px]"
            style={{ width: "74%", background: color }}
          />
        </div>
      </div>
    </div>
  );
}
