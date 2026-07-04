import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  );
}
