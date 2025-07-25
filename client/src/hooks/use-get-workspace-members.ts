import { getMembersInWorkspaceQuerryFn } from "@/lib/api";
import { useQuery } from "@tanstack/react-query"


const useGetWorkspaceMembers = (workspaceId: string) => {

  const query = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: ()=> getMembersInWorkspaceQuerryFn(workspaceId),
    staleTime: Infinity
  });

  return query;
}

export default useGetWorkspaceMembers