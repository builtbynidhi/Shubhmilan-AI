import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { Biodata } from "@/types/biodata.types";

export function useBiodata(biodataId?: string) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const biodataList = useQuery({
    queryKey: ["biodatas", user?.id],
    queryFn: () => apiFetch<Biodata[]>("/api/biodatas"),
    enabled: !!user,
  });

  const singleBiodata = useQuery({
    queryKey: ["biodata", biodataId],
    queryFn: () => apiFetch<Biodata>(`/api/biodatas/${biodataId}`),
    enabled: !!biodataId,
  });

  const saveBiodata = useMutation({
    mutationFn: (payload: Partial<Biodata> & { id?: string }) =>
      apiFetch<Biodata>("/api/biodatas", { method: "POST", body: payload }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["biodatas", user?.id] });
    },
  });

  const deleteBiodata = useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/api/biodatas/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["biodatas", user?.id] });
    },
  });

  return { biodataList, singleBiodata, saveBiodata, deleteBiodata };
}
