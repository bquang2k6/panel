import { NextResponse } from "next/server";

const BASE_API_URL = "https://author-api.locket-wan.com/api";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, uid, data } = body;

    // =========================
    // GET CACHE
    // =========================
    if (action === "get") {
      if (!uid || typeof uid !== "string") {
        return NextResponse.json(
          {
            success: false,
            error: "Vui lòng nhập UID hợp lệ.",
          },
          { status: 400 },
        );
      }

      const response = await fetch(`${BASE_API_URL}/getUserCache`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: uid.trim(),
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          {
            success: false,
            error: resData?.message || "Không thể lấy User Cache.",
          },
          { status: response.status },
        );
      }

      // Backend:
      // {
      //   data: { uid: "..." },
      //   message: "ok"
      // }
      //
      // Frontend chỉ nhận object cache
      return NextResponse.json({
        success: true,
        data: resData.data,
        message: resData.message,
      });
    }

    // =========================
    // UPDATE CACHE
    // =========================
    if (action === "update") {
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        return NextResponse.json(
          {
            success: false,
            error: "Dữ liệu JSON cập nhật không hợp lệ.",
          },
          { status: 400 },
        );
      }

      if (!data.uid || typeof data.uid !== "string") {
        return NextResponse.json(
          {
            success: false,
            error: "UID trong data không hợp lệ.",
          },
          { status: 400 },
        );
      }

      const response = await fetch(`${BASE_API_URL}/updateUserCache`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        // Gửi nguyên object cache
        body: JSON.stringify(data),
      });

      const resData = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          {
            success: false,
            error: resData?.message || "Không thể cập nhật User Cache.",
          },
          { status: response.status },
        );
      }

      return NextResponse.json({
        success: true,
        data: resData.data,
        message: resData.message || "Đã cập nhật User Cache thành công!",
      });
    }

    // =========================
    // DELETE CACHE
    // =========================
    if (action === "delete") {
      if (!uid || typeof uid !== "string") {
        return NextResponse.json(
          {
            success: false,
            error: "Vui lòng nhập UID hợp lệ.",
          },
          { status: 400 },
        );
      }

      const response = await fetch(`${BASE_API_URL}/deleteUserCache`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: uid.trim(),
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          {
            success: false,
            error: resData?.message || "Không thể xóa User Cache.",
          },
          { status: response.status },
        );
      }

      return NextResponse.json({
        success: true,
        data: resData,
        message: resData.message || "Đã xóa User Cache thành công!",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Hành động (action) không hợp lệ.",
      },
      { status: 400 },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    return NextResponse.json(
      {
        success: false,
        error: `Lỗi máy chủ: ${msg}`,
      },
      { status: 500 },
    );
  }
}
