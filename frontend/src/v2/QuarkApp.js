import React, { Suspense, lazy } from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import { CircularProgress } from "@material-ui/core";
import QuarkShell from "./shell/QuarkShell";
import GestaoPageLayout from "./shell/GestaoPageLayout";
import LegacyRedirect from "./routing/LegacyRedirect";
import { v2ChatDashboardPath, v2ChatPath } from "../helpers/v2Paths";

import V2ChatRedirect from "./pages/V2ChatRedirect";
import V2ChatInboxPage from "./pages/V2ChatInboxPage";
import V2ChatDashboardPage from "./pages/V2ChatDashboardPage";
import V2ClientesPage from "./pages/V2ClientesPage";

import AjustesHub from "../pages/AjustesHub";
import Connections from "../pages/Connections";
import SettingsCustom from "../pages/SettingsCustom";
import Financeiro from "../pages/Financeiro";
import Users from "../pages/Users";
import Contacts from "../pages/Contacts";
import Queues from "../pages/Queues";
import Tags from "../pages/Tags";
import MessagesAPI from "../pages/MessagesAPI";
import Helps from "../pages/Helps";
import QuickMessages from "../pages/QuickMessages";
import Kanban from "../pages/Kanban";
import Schedules from "../pages/Schedules";
import CampaignsConfig from "../pages/CampaignsConfig";
import CampaignReport from "../pages/CampaignReport";
import Annoucements from "../pages/Annoucements";
import Chat from "../pages/Chat";
import ToDoList from "../pages/ToDoList";
import Subscription from "../pages/Subscription";
import Files from "../pages/Files";
import Prompts from "../pages/Prompts";
import QueueIntegration from "../pages/QueueIntegration";
import Flows from "../pages/Flows";
import IspConnectors from "../pages/IspConnectors";
import LogLauncher from "../pages/LogLauncher";

const FlowEditor = lazy(() => import("../pages/FlowEditor"));
const CampaignsLazy = lazy(() => import("../pages/Campaigns"));
const RelatoriosLazy = lazy(() => import("../pages/Relatórios"));
const ContactListsPage = lazy(() => import("../pages/ContactLists"));
const ContactListItems = lazy(() => import("../pages/ContactListItems"));

const LazyFallback = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
    <CircularProgress />
  </div>
);

const Gestao = ({ title, children }) => (
  <GestaoPageLayout title={title}>{children}</GestaoPageLayout>
);

const QuarkApp = ({ showCampaigns }) => (
  <QuarkShell>
    <Switch>
      {/* Legacy → unified V2 (no parallel Whaticket UI) */}
      <Route exact path="/tickets/:ticketId?" component={LegacyRedirect} />
      <Route exact path="/app" render={() => <Redirect to={v2ChatDashboardPath()} />} />
      <Route exact path="/dashboard" render={() => <Redirect to={v2ChatDashboardPath()} />} />

      {/* Chat V2 */}
      <Route exact path="/v2/chat" component={V2ChatRedirect} />
      <Route exact path="/v2/chat/dashboard" component={V2ChatDashboardPage} />
      <Route exact path="/v2/chat/andamento/:ticketId?" component={V2ChatInboxPage} />
      <Route exact path="/v2/chat/espera/:ticketId?" component={V2ChatInboxPage} />
      <Route exact path="/v2/chat/automacao/:ticketId?" component={V2ChatInboxPage} />
      <Route exact path="/v2/chat/clientes" component={V2ClientesPage} />

      {/* Gestão — same shell, Quark tokens */}
      <Route exact path="/ajustes" render={() => (
        <AjustesHub />
      )} />
      <Route exact path="/settings" render={() => (
        <Gestao title="Configurações"><SettingsCustom /></Gestao>
      )} />
      <Route exact path="/connections" render={() => (
        <Gestao title="Conexões"><Connections /></Gestao>
      )} />
      <Route exact path="/queues" render={() => (
        <Gestao title="Filas"><Queues /></Gestao>
      )} />
      <Route exact path="/users" render={() => (
        <Gestao title="Usuários"><Users /></Gestao>
      )} />
      <Route exact path="/flows" render={() => (
        <Gestao title="Automações"><Flows /></Gestao>
      )} />
      <Route exact path="/flows/editor" render={() => (
        <Suspense fallback={<LazyFallback />}><FlowEditor /></Suspense>
      )} />
      <Route exact path="/flows/editor/:flowId" render={() => (
        <Suspense fallback={<LazyFallback />}><FlowEditor /></Suspense>
      )} />
      <Route exact path="/quick-messages" render={() => (
        <Gestao title="Mensagens rápidas"><QuickMessages /></Gestao>
      )} />
      <Route exact path="/tags" render={() => (
        <Gestao title="Tags"><Tags /></Gestao>
      )} />
      <Route exact path="/contacts" render={() => (
        <Gestao title="Contatos"><Contacts /></Gestao>
      )} />
      <Route exact path="/financeiro" render={() => (
        <Gestao title="Financeiro"><Financeiro /></Gestao>
      )} />
      <Route exact path="/relatorios" render={() => (
        <Gestao title="Relatórios">
          <Suspense fallback={<LazyFallback />}><RelatoriosLazy /></Suspense>
        </Gestao>
      )} />
      <Route exact path="/kanban" render={() => (
        <Gestao title="Kanban"><Kanban /></Gestao>
      )} />
      <Route exact path="/todolist" render={() => (
        <Gestao title="Tarefas"><ToDoList /></Gestao>
      )} />
      <Route exact path="/schedules" render={() => (
        <Gestao title="Agendamentos"><Schedules /></Gestao>
      )} />
      <Route exact path="/helps" render={() => (
        <Gestao title="Ajuda ISP"><Helps /></Gestao>
      )} />
      <Route exact path="/files" render={() => (
        <Gestao title="Arquivos"><Files /></Gestao>
      )} />
      <Route exact path="/prompts" render={() => (
        <Gestao title="Prompts"><Prompts /></Gestao>
      )} />
      <Route exact path="/LogLauncher" render={() => (
        <Gestao title="Logs"><LogLauncher /></Gestao>
      )} />
      <Route exact path="/queue-integration" render={() => (
        <Gestao title="Integrações de fila"><QueueIntegration /></Gestao>
      )} />
      <Route exact path="/isp-connectors" render={() => (
        <Gestao title="Conectores ISP"><IspConnectors /></Gestao>
      )} />
      <Route exact path="/messages-api" render={() => (
        <Gestao title="API de mensagens"><MessagesAPI /></Gestao>
      )} />
      <Route exact path="/announcements" render={() => (
        <Gestao title="Anúncios"><Annoucements /></Gestao>
      )} />
      <Route exact path="/subscription" render={() => (
        <Gestao title="Assinatura"><Subscription /></Gestao>
      )} />
      <Route exact path="/chats/:id?" render={() => (
        <Gestao title="Chat interno"><Chat /></Gestao>
      )} />

      {showCampaigns && (
        <>
          <Route exact path="/contact-lists" render={() => (
            <Gestao title="Listas de contatos">
              <Suspense fallback={<LazyFallback />}><ContactListsPage /></Suspense>
            </Gestao>
          )} />
          <Route exact path="/contact-lists/:contactListId/contacts" render={() => (
            <Gestao title="Contatos da lista">
              <Suspense fallback={<LazyFallback />}><ContactListItems /></Suspense>
            </Gestao>
          )} />
          <Route exact path="/campaigns" render={() => (
            <Gestao title="Campanhas">
              <Suspense fallback={<LazyFallback />}><CampaignsLazy /></Suspense>
            </Gestao>
          )} />
          <Route exact path="/campaign/:campaignId/report" render={() => (
            <Gestao title="Relatório de campanha"><CampaignReport /></Gestao>
          )} />
          <Route exact path="/campaigns-config" render={() => (
            <Gestao title="Configuração de campanhas"><CampaignsConfig /></Gestao>
          )} />
        </>
      )}

      {/* Fallback autenticado → inbox */}
      <Route render={() => <Redirect to={v2ChatPath()} />} />
    </Switch>
  </QuarkShell>
);

export default QuarkApp;
