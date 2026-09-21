import React, { useEffect, useState, Suspense, lazy } from "react";
import { BrowserRouter, Switch } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { CircularProgress } from "@material-ui/core";

import LoggedInLayout from "../layout";
import Dashboard from "../pages/Dashboard/";
import TicketResponsiveContainer from "../pages/TicketResponsiveContainer";
import Signup from "../pages/Signup/";
import Login from "../pages/Login/";
import Connections from "../pages/Connections/";
import SettingsCustom from "../pages/SettingsCustom/";
import Financeiro from "../pages/Financeiro/";
import Users from "../pages/Users";
import Contacts from "../pages/Contacts/";
import Queues from "../pages/Queues/";
import Tags from "../pages/Tags/";
import MessagesAPI from "../pages/MessagesAPI/";
import Helps from "../pages/Helps/";
import ContactLists from "../pages/ContactLists/";
import ContactListItems from "../pages/ContactListItems/";
import { ForwardMessageProvider } from "../context/ForwarMessage/ForwardMessageContext";
// import Companies from "../pages/Companies/";
import QuickMessages from "../pages/QuickMessages/";
import Kanban from "../pages/Kanban";
import { AuthProvider } from "../context/Auth/AuthContext";
import { TicketsContextProvider } from "../context/Tickets/TicketsContext";
import { WhatsAppsProvider } from "../context/WhatsApp/WhatsAppsContext";
import Route from "./Route";
//import kanbanSchedules from "../pages/kanbanSchedules/";
import Schedules from "../pages/Schedules";
import CampaignsConfig from "../pages/CampaignsConfig";
import CampaignReport from "../pages/CampaignReport";
import Annoucements from "../pages/Annoucements";
import Chat from "../pages/Chat";
import ToDoList from "../pages/ToDoList/";
import Subscription from "../pages/Subscription/";
import Files from "../pages/Files/";
import Prompts from "../pages/Prompts";
import QueueIntegration from "../pages/QueueIntegration";
import Flows from "../pages/Flows";
import IspConnectors from "../pages/IspConnectors";
import LogLauncher from "../pages/LogLauncher";
import AjustesHub from "../pages/AjustesHub";

import ForgetPassword from "../pages/ForgetPassWord/"; // Reset PassWd
import Landing from "../pages/Landing";
import Terms from "../pages/Terms";

const FlowEditor = lazy(() => import("../pages/FlowEditor"));
const CampaignsLazy = lazy(() => import("../pages/Campaigns"));
const RelatoriosLazy = lazy(() => import("../pages/Relatórios"));

const LazyFallback = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
    <CircularProgress />
  </div>
);

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
            {/* <Route exact path="/create-company" component={Companies} /> */}
            <WhatsAppsProvider>
              <LoggedInLayout>
                <Route exact path="/app" component={Dashboard} isPrivate />
                <Route exact path="/dashboard" component={Dashboard} isPrivate />
                <Route
                  exact
                  path="/tickets/:ticketId?"
                  component={TicketResponsiveContainer}
                  isPrivate
                />
                <Route
                  exact
                  path="/connections"
                  component={Connections}
                  isPrivate
                />
                <Route
                  exact
                  path="/quick-messages"
                  component={QuickMessages}
                  isPrivate
                />
                <Route
                  exact
                  path="/todolist"
                  component={ToDoList}
                  isPrivate
                  />
                <Route
                  exact
                  path="/schedules"
                  component={Schedules}
                  isPrivate
                />
                <Route exact path="/tags" component={Tags} isPrivate />
                <Route exact path="/contacts" component={Contacts} isPrivate />
                <Route exact path="/helps" component={Helps} isPrivate />
                <Route exact path="/users" component={Users} isPrivate />
                <Route exact path="/files" component={Files} isPrivate />
                <Route exact path="/prompts" component={Prompts} isPrivate />
                <Route exact path="/LogLauncher" component={LogLauncher} isPrivate />
                <Route exact path="/queue-integration" component={QueueIntegration} isPrivate />
                <Route exact path="/flows" component={Flows} isPrivate />
                <Route
                  exact
                  path="/flows/editor"
                  component={() => (
                    <Suspense fallback={<LazyFallback />}>
                      <FlowEditor />
                    </Suspense>
                  )}
                  isPrivate
                />
                <Route
                  exact
                  path="/flows/editor/:flowId"
                  component={() => (
                    <Suspense fallback={<LazyFallback />}>
                      <FlowEditor />
                    </Suspense>
                  )}
                  isPrivate
                />
                <Route exact path="/isp-connectors" component={IspConnectors} isPrivate />
                {/*<Route exact path="/kanban-schedules" component={kanbanSchedules} isPrivate />*/}
                <Route
                  exact
                  path="/messages-api"
                  component={MessagesAPI}
                  isPrivate
                />
                <Route
                  exact
                  path="/ajustes"
                  component={AjustesHub}
                  isPrivate
                />
                <Route
                  exact
                  path="/settings"
                  component={SettingsCustom}
                  isPrivate
                />
				        <Route 
                  exact
                  path="/kanban"
                  component={Kanban}
                  isPrivate
                />
                <Route
                  exact
                  path="/relatorios"
                  component={() => (
                    <Suspense fallback={<LazyFallback />}>
                      <RelatoriosLazy />
                    </Suspense>
                  )}
                  isPrivate
                />				
                <Route
                  exact
                  path="/financeiro"
                  component={Financeiro}
                  isPrivate
                />
                <Route exact path="/queues" component={Queues} isPrivate />
                <Route
                  exact
                  path="/announcements"
                  component={Annoucements}
                  isPrivate
                />
                <Route
                  exact
                  path="/subscription"
                  component={Subscription}
                  isPrivate
                />
                <Route exact path="/chats/:id?" component={Chat} isPrivate />
                {showCampaigns && (
                  <>
                    <Route
                      exact
                      path="/contact-lists"
                      component={ContactLists}
                      isPrivate
                    />
                    <Route
                      exact
                      path="/contact-lists/:contactListId/contacts"
                      component={ContactListItems}
                      isPrivate
                    />
                    <Route
                      exact
                      path="/campaigns"
                      component={() => (
                        <Suspense fallback={<LazyFallback />}>
                          <CampaignsLazy />
                        </Suspense>
                      )}
                      isPrivate
                    />
                    <Route
                      exact
                      path="/campaign/:campaignId/report"
                      component={CampaignReport}
                      isPrivate
                    />
                    <Route
                      exact
                      path="/campaigns-config"
                      component={CampaignsConfig}
                      isPrivate
                    />
                  </>
                )}
              </LoggedInLayout>
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
