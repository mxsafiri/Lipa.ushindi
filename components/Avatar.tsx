import { avatarColor, initials } from "@/lib/util";

export default function Avatar({
  name,
  size = 42,
  radius = 13,
  bg,
}: {
  name: string;
  size?: number;
  radius?: number;
  bg?: string;
}) {
  return (
    <div
      className="flex items-center justify-center font-extrabold text-white flex-none"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: bg ?? avatarColor(name),
        fontSize: size * 0.36,
      }}
    >
      {initials(name)}
    </div>
  );
}
