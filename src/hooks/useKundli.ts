import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { Kundli, KundliFormData, ChartStyle } from "@/types/kundli.types";

export function useKundli(kundliId?: string) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const kundliList = useQuery({
    queryKey: ["kundlis", user?.id],
    queryFn: () => apiFetch<Kundli[]>("/api/kundlis"),
    enabled: !!user,
  });

  const singleKundli = useQuery({
    queryKey: ["kundli", kundliId],
    queryFn: () => apiFetch<Kundli>(`/api/kundlis/${kundliId}`),
    enabled: !!kundliId,
  });

  const createKundli = useMutation({
    mutationFn: (formData: KundliFormData) =>
      apiFetch<Kundli>("/api/kundlis", { method: "POST", body: formData }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["kundlis", user?.id] });
    },
  });

  const deleteKundli = useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/api/kundlis/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["kundlis", user?.id] });
    },
  });

  // Compatibility helper — checks chart style from kundli data
  function getChartStyle(kundli: Kundli): ChartStyle {
    return kundli.kundliData?.chartStyle ?? "north_indian";
  }

  return { kundliList, singleKundli, createKundli, deleteKundli, getChartStyle };
}
