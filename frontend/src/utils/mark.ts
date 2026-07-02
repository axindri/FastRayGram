export const MARK_MAX_LENGTH = 64;
export const MARK_HINT = `До ${MARK_MAX_LENGTH} символов`;

export const optionalMarkFormRules = [{ max: MARK_MAX_LENGTH, message: `Не более ${MARK_MAX_LENGTH} символов` }];

export const requiredMarkFormRules = [
  { required: true, message: "Укажите контакт для связи" },
  { max: MARK_MAX_LENGTH, message: `Не более ${MARK_MAX_LENGTH} символов` },
];
