import { supabase } from "@/config/supabaseClient";

export const supabaseApi = {
  // 通用查询
  fetch: async function (
    table: string,
    options?: {
      select?: string;
      filter?: Record<string, any>;
      orderBy?: string;
      ascending?: boolean;
      limit?: number;
      offset?: number;
      like?: Record<string, string>;
    },
  ) {
    let query = supabase.from(table).select(options?.select || "*");

    if (options?.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    if (options?.like) {
      Object.entries(options.like).forEach(([key, value]) => {
        query = query.like(key, `%${value}%`);
      });
    }
    if (options?.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.ascending ?? true,
      });
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(
        options.offset,
        (options.offset || 0) + (options.limit || 10) - 1,
      );
    }
    const { data, error } = await query;

    if (error) throw error;

    return data;
  },

  insert: async function (
    table: string,
    values: Record<string, any> | Record<string, any>[],
  ) {
    const { data, error } = await supabase.from(table).insert(values);

    if (error) throw error;

    return data;
  },

  update: async function (
    table: string,
    values: Record<string, any>,
    filter: Record<string, any>,
  ) {
    let query = supabase.from(table).update(values);

    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    const { data, error } = await query;

    if (error) throw error;

    return data;
  },

  delete: async function (table: string, filter: Record<string, any>) {
    let query = supabase.from(table).delete();

    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    const { data, error } = await query;

    if (error) throw error;

    return data;
  },
};

// 保持向后兼容的单独导出
export const { fetch, insert, update, delete: deleteTable } = supabaseApi;
