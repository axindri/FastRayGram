export const USERNAME_MAX_LENGTH = 32;
export const USERNAME_PATTERN = /^[a-zA-Z0-9]+$/;
export const USERNAME_HINT = "Только латинские буквы и цифры, до 32 символов";

export const usernameFormRules = [
  { required: true, message: "Введите username" },
  { max: USERNAME_MAX_LENGTH, message: `Не более ${USERNAME_MAX_LENGTH} символов` },
  { pattern: USERNAME_PATTERN, message: "Только латинские буквы и цифры" },
];
