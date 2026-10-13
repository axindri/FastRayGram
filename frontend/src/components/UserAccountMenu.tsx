import { useMemo, useState } from "react";
import { Link2, Loader2, LogOut, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { buildAuthLink, refreshMyToken } from "@/api";
import { useAuth } from "@/auth";
import { UserAvatar } from "@/components/UserAvatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ROLE_LABELS, TOKEN_KEY } from "@/constants";
import { BADGE_STYLES } from "@/lib/badge-styles";
import { cn } from "@/lib/utils";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { getApiErrorMessage } from "@/utils/apiError";
import { displayName } from "@/utils/format";
import { formatJwtExpiryRemaining, isJwtToken, jwtExpiryTagColor } from "@/utils/jwt";

function expiryBadgeClassName(color: "success" | "error" | "default") {
  if (color === "success") {
    return BADGE_STYLES.success;
  }

  return undefined;
}

export function UserAccountMenu() {
  const navigate = useNavigate();
  const { user, logout, login } = useAuth();
  const copy = useCopyToClipboard();
  const [authToken, setAuthToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [tokenRefreshLoading, setTokenRefreshLoading] = useState(false);
  const [confirmRefresh, setConfirmRefresh] = useState(false);

  const authLink = useMemo(() => (authToken ? buildAuthLink(authToken) : ""), [authToken]);
  const tokenExpiryLabel = useMemo(() => formatJwtExpiryRemaining(authToken), [authToken]);
  const tokenExpiryColor = useMemo(() => jwtExpiryTagColor(authToken), [authToken]);
  const canRefreshToken = Boolean(user && user.role !== "superuser" && isJwtToken(authToken));

  if (!user) {
    return null;
  }

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  const onCopyAuthLink = () => {
    if (!authLink) {
      return;
    }
    copy(authLink);
  };

  const onRefreshAuthToken = async () => {
    setTokenRefreshLoading(true);

    try {
      const token = await refreshMyToken();
      await login(token);
      setAuthToken(token);
      toast.success("Ссылка обновлена — старая больше не действует");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось обновить ссылку"));
    } finally {
      setTokenRefreshLoading(false);
      setConfirmRefresh(false);
    }
  };

  const name = displayName(user.username);

  return (
    <>
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
              <p className="text-xs text-muted-foreground">
                ID {user.id} · {ROLE_LABELS[user.role]}
              </p>
            </div>
          </DropdownMenuLabel>

          {authLink || canRefreshToken ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm leading-none font-medium">Ссылка для входа</p>
                  {canRefreshToken && tokenExpiryLabel ? (
                    <Badge
                      variant={tokenExpiryColor === "error" ? "destructive" : "outline"}
                      className={cn("w-fit", expiryBadgeClassName(tokenExpiryColor))}
                    >
                      Активна {tokenExpiryLabel}
                    </Badge>
                  ) : null}
                </div>
              </DropdownMenuLabel>
              {authLink ? (
                <DropdownMenuItem onSelect={onCopyAuthLink}>
                  <Link2 />
                  Скопировать
                </DropdownMenuItem>
              ) : null}
              {canRefreshToken ? (
                <DropdownMenuItem
                  disabled={tokenRefreshLoading}
                  onSelect={(event) => {
                    event.preventDefault();
                    setConfirmRefresh(true);
                  }}
                >
                  {tokenRefreshLoading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                  Обновить
                </DropdownMenuItem>
              ) : null}
            </>
          ) : null}

          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onLogout}>
            <LogOut />
            Выйти
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmRefresh} onOpenChange={setConfirmRefresh}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Получить новую ссылку для входа?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={tokenRefreshLoading}>Нет</AlertDialogCancel>
            <AlertDialogAction disabled={tokenRefreshLoading} onClick={() => void onRefreshAuthToken()}>
              Да
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
