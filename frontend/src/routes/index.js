import React, { useEffect, useState } from "react";
import { BrowserRouter, Switch } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import Signup from "../pages/Signup/";
import Login from "../pages/Login/";
import { ForwardMessageProvider } from "../context/ForwarMessage/ForwardMessageContext";
import { AuthProvider } from "../context/Auth/AuthContext";
import { TicketsContextProvider } from "../context/Tickets/TicketsContext";
import { WhatsAppsProvider } from "../context/WhatsApp/WhatsAppsContext";
import Route from "./Route";
import ForgetPassword from "../pages/ForgetPassWord/";
import Landing from "../pages/Landing";
import Terms from "../pages/Terms";
import QuarkApp from "../v2/QuarkApp";

const Routes = () => {
  const [showCampaigns, setShowCampaigns] = useState(false);

  useEffect(() => {
    const cshow = localStorage.getItem("cshow");
    if (cshow !== undefined) {
      setShowCampaigns(true);
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <ForwardMessageProvider>
          <TicketsContextProvider>
            <Switch>
              <Route exact path="/" component={Landing} />
              <Route exact path="/home" component={Landing} />
              <Route exact path="/termos" component={Terms} />
              <Route exact path="/login" component={Login} />
              <Route exact path="/signup" component={Signup} />
              <Route exact path="/forgetpsw" component={ForgetPassword} />
              <WhatsAppsProvider>
                <Route
                  path="/"
                  component={() => <QuarkApp showCampaigns={showCampaigns} />}
                  isPrivate
                />
              </WhatsAppsProvider>
            </Switch>
            <ToastContainer autoClose={3000} />
          </TicketsContextProvider>
        </ForwardMessageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Routes;
