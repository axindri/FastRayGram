import { Avatar, theme, type AvatarProps } from "antd";

export function ThemedIconAvatar({ style, ...props }: AvatarProps) {
  const { token } = theme.useToken();

  return <Avatar {...props} style={{ backgroundColor: token.colorPrimary, ...style }} />;
}
