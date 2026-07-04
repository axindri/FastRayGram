import type { UserRole } from "@/types";

import { MARK_MAX_LENGTH, ROLE_LABELS, USERNAME_MAX_LENGTH, USERNAME_PATTERN } from "@/constants";

export type CreateUserForm = {
  username: string;
  role: UserRole;
  mark?: string;
  flow?: string;
  limit_ips?: number;
  total_gb?: number;
  expiry_time_days?: number;
};

export type CreateUserFieldErrors = Partial<Record<"username" | "mark", string>>;

export function getAssignableRoleOptions(role: UserRole | undefined) {
  if (role === "superuser") {
    return [
      { value: "user" as const, label: ROLE_LABELS.user },
      { value: "admin" as const, label: ROLE_LABELS.admin },
    ];
  }

  return [{ value: "user" as const, label: ROLE_LABELS.user }];
}

export function validateCreateUser(values: CreateUserForm): CreateUserFieldErrors {
  const errors: CreateUserFieldErrors = {};
  const username = values.username.trim();

  if (!username) {
    errors.username = "Введите username";
  } else if (username.length > USERNAME_MAX_LENGTH) {
    errors.username = `Не более ${USERNAME_MAX_LENGTH} символов`;
  } else if (!USERNAME_PATTERN.test(username)) {
    errors.username = "Только латинские буквы и цифры";
  }

  if (values.mark && values.mark.length > MARK_MAX_LENGTH) {
    errors.mark = `Не более ${MARK_MAX_LENGTH} символов`;
  }

  return errors;
}
