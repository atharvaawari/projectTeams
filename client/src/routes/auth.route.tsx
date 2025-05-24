import { DashboardSkeleton } from "@/components/skeleton-loaders/dashboard-skeleton";
import useAuth from "@/hooks/api/use-auth";
import { Navigate, Outlet } from "react-router-dom";

const AuthRoute = () => {
  const { data: authData, isLoading } = useAuth();

  const user = authData?.user;

  if(isLoading) return <DashboardSkeleton/>;

  if(!user) return <Outlet/>;

  return <Navigate to={`workspace/${user.currentWorkSpace?._id}`}/>;
};

export default AuthRoute;
