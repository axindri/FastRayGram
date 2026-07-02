import { Button, Space, Typography } from "antd";

const { Text } = Typography;

type PaginationFooterProps = {
  page: number;
  pages: number;
  total: number;
  loading: boolean;
  onPageChange: (page: number) => void;
};

export function PaginationFooter({ page, pages, total, loading, onPageChange }: PaginationFooterProps) {
  if (total <= 0) {
    return null;
  }

  return (
    <Space wrap style={{ justifyContent: "space-between", width: "100%" }}>
      <Text type="secondary">
        Страница {page} из {pages} · всего {total}
      </Text>
      <Space>
        <Button disabled={page <= 1 || loading} onClick={() => onPageChange(page - 1)}>
          Назад
        </Button>
        <Button disabled={page >= pages || loading} onClick={() => onPageChange(page + 1)}>
          Вперёд
        </Button>
      </Space>
    </Space>
  );
}
