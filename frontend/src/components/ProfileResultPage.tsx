import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PROFILE_RESULT_STATUS_CARD_CLASS, type ProfileResultStatus } from "@/constants";

type ProfileResultPageProps = {
  status: ProfileResultStatus;
  title: ReactNode;
  subTitle?: ReactNode;
};

export function ProfileResultPage({ status, title, subTitle }: ProfileResultPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-lg justify-center px-4 py-16">
      <Card className={cn("w-full text-center", PROFILE_RESULT_STATUS_CARD_CLASS[status])}>
        <CardHeader className="items-center">
          <CardTitle className="text-balance text-xl leading-snug">{title}</CardTitle>
          {subTitle ? <CardDescription className="text-balance">{subTitle}</CardDescription> : null}
        </CardHeader>
        <CardFooter className="justify-center">
          <Button asChild>
            <Link to="/profile">Перейти в профиль</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
