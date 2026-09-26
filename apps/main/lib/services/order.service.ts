// lib/services/order.service.ts

import { createClient } from "../supabase/client";

export interface CreateOrderBody {
  planId: string;
  userId: string;
  coupon?: string;
}

export interface CreateOrderResponse {
  code?: number;
  data?: {
    id?: string;
    orderId?: string;
    user_id?: string;
    plan_id?: string;
    price?: number;
    status?: string;
    checkout_qr?: string;
    transfer_content?: string;
    isExistingOrder?: boolean;
    customer_code?: string;
    checkout_url?: string;
  };
  message?: string;
}

export const createOrder = async (body: CreateOrderBody): Promise<CreateOrderResponse> => {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke("orders", {
    body: {
      action: "CREATE",
      ...body,
    },
  });

  if (error) throw error;
  return data;
};

export const getOrder = async (orderId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke("orders", {
    body: {
      action: "GET",
      orderId,
    },
  });

  if (error) throw error;
  return data;
};

export const cancelOrder = async (orderId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke("orders", {
    body: {
      action: "CANCEL",
      orderId,
    },
  });

  if (error) throw error;
  return data;
};

export const sendInvoice = async (orderId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke("orders", {
    body: {
      action: "SEND_INVOICE",
      orderId,
    },
  });

  if (error) throw error;
  return data;
};