import React, { useContext } from "react";
import { Route as RouterRoute, Redirect } from "react-router-dom";

import { AuthContext } from "../context/Auth/AuthContext";
import BackdropLoading from "../components/BackdropLoading";
import { v2ChatDashboardPath, v2ChatPath } from "../helpers/v2Paths";

const PUBLIC_AUTH_PATHS = ["/", "/home", "/login", "/signup", "/forgetpsw", "/termos"];

const Route = ({ component: Component, isPrivate = false, ...rest }) => {
	const { isAuth, loading } = useContext(AuthContext);

	return (
		<RouterRoute
			{...rest}
			render={(routeProps) => {
				const { location } = routeProps;
				const isPublicAuthRoute = PUBLIC_AUTH_PATHS.includes(location.pathname);

				if (!isAuth && isPrivate) {
					return (
						<>
							{loading && <BackdropLoading />}
							<Redirect to={{ pathname: "/login", state: { from: location } }} />
						</>
					);
				}

				if (isAuth && !isPrivate && !isPublicAuthRoute) {
					return (
						<>
							{loading && <BackdropLoading />}
							<Redirect to={{ pathname: v2ChatDashboardPath(), state: { from: location } }} />
						</>
					);
				}

				// Autenticado na landing → painel
				if (
					isAuth &&
					!isPrivate &&
					(location.pathname === "/" || location.pathname === "/home")
				) {
					return (
						<>
							{loading && <BackdropLoading />}
							<Redirect to={v2ChatPath()} />
						</>
					);
				}

				return (
					<>
						{loading && <BackdropLoading />}
						<Component {...routeProps} />
					</>
				);
			}}
		/>
	);
};

export default Route;
