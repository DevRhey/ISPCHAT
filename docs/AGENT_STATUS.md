# Status unificado — agentes × git (ISPCHAT)

Atualizado: 2026-09-19

## Fonte da verdade

| Camada | Onde | Estado |
|--------|------|--------|
| **Git remoto** | `origin/master` → https://github.com/DevRhey/ISPCHAT | 3 commits (`DevRhey` + co-author Cursor) |
| **Working tree** | `Desktop/whaticket-saas-main` | **muitas mudanças locais NÃO commitadas** (sessão Cursor comercial) |
| **Grok Bot** | bridge mailbox | **inbox vazia**; bot `Especialista ISPCHAT` existe no cache; **não há commits/branches dele neste repo** |
| **Rhey Programador** | bridge | Focado em **EventsApp**, não ISPCHAT (outbox antigo 15–17/09) |

## O que o Grok está fazendo *aqui*

- **Agora:** nada no git. Inbox do bridge = 0 mensagens.
- Existe o bot **Especialista ISPCHAT** (especialista de domínio), mas **não há evidência de patch/commit/branch** dele neste repositório.
- Outbox recente do Cursor → Rhey é sobre **EventsApp/Hostinger**, não ISPCHAT.
- Em 19/09 Cursor enviou ping de status ao Especialista ISPCHAT (aguardando o bot ler o outbox no PC).

## O que o git já tem (commits em `master`)

1. `004aa9f` — feat: ISPCHAT LangGraph + fluxos ISP  
2. `175c816` — fix: CORS Cloudflare quick tunnels  
3. `62e02ee` — docs + auth/dev stack (Redis 6389, login)

Autor de todos: **DevRhey** (`devrhey@gmail.com`), com `Co-authored-by: Cursor` no último.

**Só existe branch `master`** (alinhada com `origin/master`). Sem branch `grok/*` ou PR paralelo.

## O que está só no disco (Cursor, ainda não no GitHub)

Inclui (não exaustivo): hardening comercial P0 (SQLi reset, invoices tenant, Gerencianet webhook, ISP demo flag, JWT, `/ready`, Cloud API stub), wizard onboarding, landing `/`, dashboard `/app`, ErrorBoundary, white-label tab, scripts Cloudflare, docs `COMMERCIAL_HARDENING.md`, Flow master/simulate, etc.

→ **Risco de confusão:** quem olhar só o GitHub não vê o comercial; quem olhar o working tree vê tudo misturado sem commit.

## Regras para não misturar agentes

1. **Um dono de working tree:** Cursor (esta sessão) é o agente ativo no ISPCHAT até commit/push.
2. **Grok Especialista ISPCHAT:** consulta/pesquisa/review via bridge — **não editar arquivos** sem handoff explícito e branch dedicada `grok/…`.
3. **Rhey:** não atuar neste repo (EventsApp only).
4. Antes de o Grok mexer em código: `git status` limpo ou branch nova a partir de `master` atualizada.
5. Links públicos Cloudflare: `scripts/ISPCHAT_PUBLIC.txt` (efêmeros).

## Próximo passo sugerido (humano)

- Commitar o working tree comercial em um ou mais commits claros **ou**
- Pedir explicitamente “commita e faz push”  
- Só então pedir review do Especialista ISPCHAT no bridge.
