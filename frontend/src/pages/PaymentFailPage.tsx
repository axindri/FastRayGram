import { ProfileResultPage } from "../components/ProfileResultPage";

export function PaymentFailPage() {
  return (
    <ProfileResultPage
      status="error"
      title="Нет успешной оплаты"
      subTitle="Если возникли трудности или что-то пошло не так, пожалуйста, обратитесь к администратору или в личные сообщения группы."
    />
  );
}
