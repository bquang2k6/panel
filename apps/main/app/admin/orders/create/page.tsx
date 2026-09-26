import { PageHeader } from "@/components/admin/page-header";
import { CreateOrderForm } from "@/components/admin/create-order-form";
import { getAvailableLocketPlans } from "@/lib/queries";

export const metadata = {
  title: "Tạo đơn hàng mới | Locketwan Admin",
  description: "Tạo đơn hàng nâng cấp gói cho người dùng dựa trên UID hoặc Mã khách hàng.",
};

export default async function CreateOrderPage() {
  const plans = await getAvailableLocketPlans();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tạo đơn hàng mới"
        description="Tạo đơn hàng dịch vụ cho khách hàng dựa trên UID hoặc Mã khách hàng (customer_code)."
      />

      <CreateOrderForm plans={plans} />
    </div>
  );
}
