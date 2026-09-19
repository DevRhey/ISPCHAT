import React, { useContext } from "react";
import { Route as RouterRoute, Redirect } from "react-router-dom";

import { AuthContext } from "../context/Auth/AuthContext";
import BackdropLoading from "../components/BackdropLoading";

const PUBLIC_AUTH_PATHS = ["/", "/home", "/login", "/signup", "/forgetpsw"];

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
							<Redirect to={{ pathname: "/app", state: { from: location } }} />
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
							<Redirect to="/app" />
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
