import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { buildRegistrationLink, createRegistrationCode, deleteRegistrationCode, extendRegistrationCode, fetchRegistrationCodes } from "@/api";
import { CopyableInput } from "@/components/CopyableInput";
import { PaginatedList } from "@/components/PaginatedList";
import { RegistrationCodeCard } from "@/components/RegistrationCodeCard";
import { SectionCard } from "@/components/SectionCard";
import { getApiErrorMessage } from "@/utils/apiError";
import { emptyPaginated } from "@/utils/pagination";
import type { Paginated, RegistrationCode } from "@/types";

export function RegistrationPage() {
  const [validDays, setValidDays] = useState(7);
  const [validDaysError, setValidDaysError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createdLink, setCreatedLink] = useState("");

  const [codes, setCodes] = useState<Paginated<RegistrationCode>>(() => emptyPaginated());
  const [codesLoading, setCodesLoading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);

  const loadCodes = useCallback(
    async (page: number) => {
      setCodesLoading(true);

      try {
        setCodes(await fetchRegistrationCodes(page, codes.limit));
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Не удалось загрузить коды регистрации"));
      } finally {
        setCodesLoading(false);
      }
    },
    [codes.limit],
  );

  useEffect(() => {
    void loadCodes(1);
  }, [loadCodes]);

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validDays) {
      setValidDaysError("Введите срок");
      return;
    }

    if (validDays < 1 || validDays > 365) {
      setValidDaysError("От 1 до 365 дней");
      return;
    }

    setValidDaysError("");
    setCreateLoading(true);
    setCreatedLink("");

    try {
      const code = await createRegistrationCode(validDays);
      setCreatedLink(buildRegistrationLink(code.code));
      toast.success("Код регистрации создан");
      await loadCodes(1);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось создать код регистрации"));
    } finally {
      setCreateLoading(false);
    }
  };

  const onExtend = async (id: number, extendDays: number) => {
    setActionId(id);

    try {
      await extendRegistrationCode(id, extendDays);
      toast.success(`Срок действия кода продлён на ${extendDays} дн.`);
      await loadCodes(codes.page);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось продлить код"));
    } finally {
      setActionId(null);
    }
  };

  const onDelete = async (id: number) => {
    setActionId(id);

    try {
      await deleteRegistrationCode(id);
      toast.success("Код удалён");
      await loadCodes(codes.page);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось удалить код"));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
          <SectionCard title="Создать код" hint="Сгенерируйте ссылку и отправьте её новому пользователю">
            <form className="flex flex-col gap-4" onSubmit={onCreate}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="valid-days">Срок действия кода, дней</Label>
                <Input id="valid-days" type="number" min={1} max={365} value={validDays} aria-invalid={Boolean(validDaysError)} onChange={(event) => setValidDays(Number(event.target.value))} />
                {validDaysError ? <p className="text-sm text-destructive">{validDaysError}</p> : null}
              </div>

              <Button type="submit" disabled={createLoading}>
                {createLoading ? <Loader2 className="animate-spin" /> : null}
                Создать
              </Button>
            </form>

            {createdLink ? <CopyableInput label="Ссылка для регистрации" value={createdLink} /> : null}
          </SectionCard>

          <div>
            <PaginatedList
              page={codes.page}
              pages={codes.pages}
              total={codes.total}
              loading={codesLoading}
              empty={!codes.items.length}
              emptyDescription="Кодов пока нет"
              onPageChange={(page) => void loadCodes(page)}
            >
              {codes.items.map((item) => (
                <RegistrationCodeCard key={item.id} item={item} onExtend={onExtend} onDelete={onDelete} extendLoading={actionId === item.id} deleteLoading={actionId === item.id} />
              ))}
            </PaginatedList>
          </div>
    </div>
  );
}
