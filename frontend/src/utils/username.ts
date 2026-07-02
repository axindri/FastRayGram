import { USERNAME_MAX_LENGTH, USERNAME_PATTERN } from "@/constants";

export { USERNAME_HINT, USERNAME_MAX_LENGTH, USERNAME_PATTERN } from "@/constants";

export const usernameFormRules = [
  { required: true, message: "Введите username" },
  { max: USERNAME_MAX_LENGTH, message: `Не более ${USERNAME_MAX_LENGTH} символов` },
  { pattern: USERNAME_PATTERN, message: "Только латинские буквы и цифры" },
];
