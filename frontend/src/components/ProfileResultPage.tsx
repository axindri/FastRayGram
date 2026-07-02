import { Button, Result } from "antd";
import type { ResultProps } from "antd";
import { Link } from "react-router-dom";

type ProfileResultPageProps = Pick<ResultProps, "status" | "title" | "subTitle">;

export function ProfileResultPage({ status, title, subTitle }: ProfileResultPageProps) {
  return (
    <Result
      status={status}
      title={title}
      subTitle={subTitle}
      extra={
        <Link to="/profile">
          <Button type="primary">Перейти в профиль</Button>
        </Link>
      }
    />
  );
}
