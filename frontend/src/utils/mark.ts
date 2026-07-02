import { MARK_MAX_LENGTH } from "@/constants";

export { MARK_HINT, MARK_MAX_LENGTH } from "@/constants";

export const optionalMarkFormRules = [{ max: MARK_MAX_LENGTH, message: `Не более ${MARK_MAX_LENGTH} символов` }];

export const requiredMarkFormRules = [
  { required: true, message: "Укажите контакт для связи" },
  { max: MARK_MAX_LENGTH, message: `Не более ${MARK_MAX_LENGTH} символов` },
];
