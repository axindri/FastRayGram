import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { avatarLetter } from "@/utils/format";

type UserAvatarProps = {
  username: string;
  size?: "default" | "sm" | "lg";
  className?: string;
};

export function UserAvatar({ username, size = "default", className }: UserAvatarProps) {
  return (
    <Avatar size={size} className={cn(className)}>
      <AvatarFallback aria-hidden>{avatarLetter(username)}</AvatarFallback>
    </Avatar>
  );
}
