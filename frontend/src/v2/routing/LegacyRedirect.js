import React from "react";
import { Redirect, useLocation, useParams } from "react-router-dom";
import { resolveLegacyPath, v2ChatDashboardPath } from "../../helpers/v2Paths";

/**
 * Redirects legacy Whaticket routes into the unified V2 shell.
 */
const LegacyRedirect = ({ fallback = null }) => {
  const location = useLocation();
  const params = useParams();
  const target = resolveLegacyPath(location.pathname, params);

  if (target) {
    return <Redirect to={target} />;
  }

  if (fallback) {
    return <Redirect to={fallback} />;
  }

  return <Redirect to={v2ChatDashboardPath()} />;
};

export default LegacyRedirect;
