import { Loader2, RefreshCw, Search } from "lucide-react";

import { PaginatedList } from "@/components/PaginatedList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { USERNAME_MAX_LENGTH } from "@/constants";
import { UserCard } from "@/pages/users/components/UserCard";
import { useUsersContext } from "@/pages/users/useUsersContext";

export function UsersAllPage() {
  const {
    allUsers,
    allUsersLoading,
    loadAllUsers,
    usersSearchInput,
    setUsersSearchInput,
    onUsersSearch,
    roleOptions,
    actionUserId,
    setDetailUser,
    onDeleteUser,
    onRefreshUserLink,
    onUpdateUserRole,
  } = useUsersContext();

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full">
        <Input
          value={usersSearchInput}
          placeholder="Поиск по имени пользователя"
          maxLength={USERNAME_MAX_LENGTH}
          className="rounded-r-none"
          onChange={(event) => {
            const next = event.target.value;
            setUsersSearchInput(next);
            if (!next) {
              onUsersSearch("");
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onUsersSearch(usersSearchInput);
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="shrink-0 rounded-none"
          disabled={allUsersLoading}
          onClick={() => void loadAllUsers(allUsers.page)}
        >
          {allUsersLoading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
        </Button>
        <Button type="button" variant="outline" className="shrink-0 rounded-l-none" onClick={() => onUsersSearch(usersSearchInput)}>
          <Search />
        </Button>
      </div>

      <PaginatedList
        page={allUsers.page}
        pages={allUsers.pages}
        total={allUsers.total}
        loading={allUsersLoading}
        empty={!allUsers.items.length}
        emptyDescription="Пользователей нет"
        onPageChange={(page) => void loadAllUsers(page)}
      >
        {allUsers.items.map((item) => (
          <UserCard
            key={item.id}
            user={item}
            roleOptions={roleOptions}
            actionUserId={actionUserId}
            onView={setDetailUser}
            onDelete={onDeleteUser}
            onRefreshLink={onRefreshUserLink}
            onUpdateRole={onUpdateUserRole}
          />
        ))}
      </PaginatedList>
    </div>
  );
}
