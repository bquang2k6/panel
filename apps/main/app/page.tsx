import { redirect } from "next/navigation";

export default function Home() {
  // Tự động chuyển hướng vào thẳng trang Admin
  redirect("/admin");
}
