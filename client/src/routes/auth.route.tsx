import { DashboardSkeleton } from "@/components/skeleton-loaders/dashboard-skeleton";
import useAuth from "@/hooks/api/use-auth";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthRoute } from "./common/routePaths";

const AuthRoute = () => {

  const location = useLocation();  //get current route loaction
  const { data: authData, isLoading } = useAuth();
  const user = authData?.user;

  const _isAuthRoute = isAuthRoute(location.pathname); //return the current location path is auth route or not

  if(isLoading && !_isAuthRoute) return <DashboardSkeleton/>;  //so that dashboard skeleton not visible while ladong login page

  if(!user) return <Outlet/>;

  return <Navigate to={`workspace/${user.currentWorkSpace?._id}`}/>;
};

export default AuthRoute;
