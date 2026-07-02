import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/auth";
import { UserAvatar } from "@/components/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS } from "@/constants";
import { displayName } from "@/utils/format";

export function UserAccountMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  const name = displayName(user.username);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-11 max-w-[12rem] cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent p-0 text-sm font-medium outline-none hover:opacity-80 focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:max-w-none"
          aria-label="Меню пользователя"
        >
          <UserAvatar username={user.username} size="lg" className="size-10" />
          <span className="truncate">{name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm leading-none font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</p>
            <p className="text-xs text-muted-foreground">ID {user.id}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onLogout}>
          <LogOut />
          Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
